import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { twilioClient } from "@/lib/twilio";

export async function POST(request: Request) {
    const data = await request.formData();
    const dialStatus = data.get("DialCallStatus"); // 'completed', 'busy', 'no-answer', 'failed', 'canceled'
    const callerNumber = data.get("From") as string; // The Customer
    const twilioNumber = data.get("To") as string;   // Your Twilio/AI Number

    const url = new URL(request.url);
    const merchantId = url.searchParams.get("merchantId");

    if (!merchantId) return new NextResponse("OK");

    console.log(`📞 Call Status: ${dialStatus} | Merchant: ${merchantId}`);

    // TRIGGER CONDITION: The business owner didn't pick up
    if (dialStatus === "no-answer" || dialStatus === "busy" || dialStatus === "failed" || dialStatus === "canceled") {

        // 1. Check if Automation is ON
        const { data: automation } = await supabaseAdmin
            .from("automations")
            .select("is_active, config")
            .eq("merchant_id", merchantId)
            .eq("type", "missed_call_sms")
            .single();

        if (automation?.is_active) {
            // 2. Get Business Name for context
            const { data: merchant } = await supabaseAdmin.from("merchants").select("business_name").eq("platform_merchant_id", merchantId).single();
            const businessName = merchant?.business_name || "Us";

            // 3. Send the Text
            try {
                const message = automation.config?.message || "Sorry we missed your call! How can we help?";
                // Prefix with business name so customer knows who it is
                const fullMessage = `Hi, this is ${businessName}. ${message}`;

                await twilioClient.messages.create({
                    body: fullMessage,
                    from: twilioNumber, // Send from the number they just called
                    to: callerNumber
                });
                console.log("✅ SMS Sent!");
            } catch (error) {
                console.error("❌ SMS Failed:", error);
            }
        }
    }

    return new NextResponse("OK");
}