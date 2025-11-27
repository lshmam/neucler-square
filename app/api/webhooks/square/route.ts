import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { twilioClient } from "@/lib/twilio";
import { getCustomerFromOrder } from "@/lib/square";

export async function POST(request: Request) {
    try {
        const bodyText = await request.text();
        const event = JSON.parse(bodyText);

        if (event.type !== "payment.updated") return NextResponse.json({ ok: true });

        const payment = event.data.object.payment;
        if (payment.status !== "COMPLETED") return NextResponse.json({ ok: true });

        const orderId = payment.order_id;
        if (!orderId) return NextResponse.json({ ok: true });

        // Check Duplicates
        const { data: existing } = await supabaseAdmin
            .from("review_requests")
            .select("id")
            .eq("order_id", orderId)
            .single();

        if (existing) return NextResponse.json({ ok: true });

        const squareMerchantId = event.merchant_id;

        // Fetch Context
        const { data: merchant } = await supabaseAdmin.from("merchants").select("*").eq("platform_merchant_id", squareMerchantId).single();
        if (!merchant) return NextResponse.json({ ok: true });

        const { data: automation } = await supabaseAdmin.from("automations").select("*").eq("merchant_id", merchant.platform_merchant_id).eq("type", "review_booster").single();
        if (!automation?.is_active) return NextResponse.json({ ok: true });

        const { data: agent } = await supabaseAdmin.from("ai_agents").select("phone_number").eq("merchant_id", merchant.platform_merchant_id).single();
        if (!agent?.phone_number) return NextResponse.json({ ok: true });

        // Send
        const customer = await getCustomerFromOrder(orderId, merchant.access_token);

        if (customer?.phoneNumber) {
            const gateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${orderId}`;
            let message = automation.config?.message || "Thanks for visiting! Please rate your experience: [Link]";
            message = message.replace("[Link]", gateUrl);

            const prefix = `Hi ${customer.firstName || 'there'}, this is ${merchant.business_name}.`;
            const fullMessage = `${prefix} ${message}`;

            // 1. Send SMS
            await twilioClient.messages.create({
                body: fullMessage,
                from: agent.phone_number,
                to: customer.phoneNumber
            });

            // 2. Track Review Request (For Stats)
            await supabaseAdmin.from("review_requests").insert({
                merchant_id: merchant.platform_merchant_id,
                order_id: orderId,
                customer_phone: customer.phoneNumber,
                status: "sent"
            });

            // 3. NEW: Save to Messages Table (For Inbox Visibility)
            await supabaseAdmin.from("messages").insert({
                merchant_id: merchant.platform_merchant_id,
                customer_phone: customer.phoneNumber,
                direction: "outbound", // It came from us
                body: fullMessage,
                status: "sent"
            });

            console.log(`✅ Sent and Logged Review SMS for ${customer.phoneNumber}`);
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}