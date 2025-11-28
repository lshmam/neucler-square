import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { twilioClient } from "@/lib/twilio";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { name, audience, message } = await request.json();

        // 1. Get Sender Number
        const { data: agent } = await supabaseAdmin
            .from("ai_agents")
            .select("phone_number")
            .eq("merchant_id", merchantId)
            .single();

        if (!agent?.phone_number) {
            return NextResponse.json({ error: "No SMS number configured. Go to AI Agent settings." }, { status: 400 });
        }

        // 2. Get Merchant Name (For Prefix)
        const { data: merchant } = await supabaseAdmin
            .from("merchants")
            .select("business_name")
            .eq("platform_merchant_id", merchantId)
            .single();

        // 3. Fetch Audience
        let query = supabaseAdmin.from("customers").select("phone_number, first_name").eq("merchant_id", merchantId).neq("phone_number", null);
        if (audience === "vip") query = query.gt("total_spend_cents", 50000);

        const { data: customers } = await query;
        if (!customers || customers.length === 0) {
            return NextResponse.json({ error: "No valid customers found." }, { status: 400 });
        }

        // 4. Construct Message
        // "Hi John, This is Joe's Shop: [Message] Reply STOP to opt out."
        const prefix = `Hi %Name%, this is ${merchant?.business_name}.`;
        const suffix = `\n\nReply STOP to opt out.`;
        const fullTemplate = `${prefix} ${message} ${suffix}`;

        // 5. Send Loop (Simple Batch)
        let sentCount = 0;

        // We use map to fire requests in parallel (Careful with rate limits on huge lists)
        // For lists > 100, you'd want a queue system (BullMQ/Inngest).
        const promises = customers.map(async (c) => {
            if (!c.phone_number) return;

            const personalizedBody = fullTemplate.replace("%Name%", c.first_name || "there");

            try {
                await twilioClient.messages.create({
                    body: personalizedBody,
                    from: agent.phone_number,
                    to: c.phone_number
                });

                // Log to Messages table for Inbox visibility
                await supabaseAdmin.from("messages").insert({
                    merchant_id: merchantId,
                    customer_phone: c.phone_number,
                    direction: "outbound",
                    body: personalizedBody,
                    status: "sent"
                });

                sentCount++;
            } catch (err) {
                console.error(`Failed to send to ${c.phone_number}`, err);
            }
        });

        await Promise.all(promises);

        // 6. Log Campaign
        await supabaseAdmin.from("sms_campaigns").insert({
            merchant_id: merchantId,
            name: name,
            message_body: message, // Store original raw message
            audience: audience,
            status: "sent",
            recipient_count: sentCount
        });

        return NextResponse.json({ success: true, count: sentCount });

    } catch (error: any) {
        console.error("Broadcast Error:", error);
        return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
    }
}