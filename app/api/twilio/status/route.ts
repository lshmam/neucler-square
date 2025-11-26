import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { twilioClient } from "@/lib/twilio";

export async function POST(request: Request) {
    const data = await request.formData();
    const dialStatus = data.get("DialCallStatus");
    const callerNumber = data.get("From") as string;
    // Get the AI Number that received the original call
    const aiNumber = data.get("To") as string;

    const url = new URL(request.url);
    const merchantId = url.searchParams.get("merchantId");

    if (!merchantId) return new NextResponse("OK");

    // IF CALL FAILED / BUSY / NO ANSWER -> SEND SMS
    if (dialStatus === "no-answer" || dialStatus === "busy" || dialStatus === "failed") {

        // 1. Check if automation is active
        const { data: automation } = await supabaseAdmin
            .from("automations")
            .select("is_active, config")
            .eq("merchant_id", merchantId)
            .eq("type", "missed_call_sms")
            .single();

        if (automation?.is_active) {
            // 2. Fetch Business Name for Context
            const { data: merchant } = await supabaseAdmin
                .from("merchants")
                .select("business_name")
                .eq("platform_merchant_id", merchantId)
                .single();

            try {
                // 3. Construct the Message
                // Force the Business Name prefix if it's not in the template
                let messageBody = automation.config?.message || "Sorry we missed you! How can we help?";
                const prefix = `Hi, this is ${merchant?.business_name}.`;

                // Avoid double prefixing if the user already wrote it
                if (!messageBody.toLowerCase().includes("this is")) {
                    messageBody = `${prefix} ${messageBody}`;
                }

                // 4. Send SMS from the AI Number (aiNumber)
                await twilioClient.messages.create({
                    body: messageBody,
                    from: aiNumber, // <--- The Dedicated AI Number
                    to: callerNumber
                });
                console.log(`✅ Sent Missed Call SMS from ${aiNumber}`);
            } catch (error) {
                console.error("Failed to send missed call SMS", error);
            }
        }
    }

    return new NextResponse("OK");
}