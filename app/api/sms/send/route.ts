import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { name, message, audience } = body;

        // 1. Select Audience
        let query = supabaseAdmin.from("customers").select("phone_number, first_name").eq("merchant_id", merchantId);

        if (audience === "vip") {
            query = query.gt("total_spend_cents", 50000); // Spent > $500
        } else if (audience === "recent") {
            // Visited in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = query.gt("last_visit_date", sevenDaysAgo.toISOString());
        }

        const { data: customers, error } = await query;

        if (error || !customers || customers.length === 0) {
            return NextResponse.json({ error: "No customers found for this audience." }, { status: 400 });
        }

        // 2. Filter valid phones
        const validTargets = customers.filter(c => c.phone_number && c.phone_number.length > 9);

        // 3. Send Batch (In production, use a Queue. For MVP, `Promise.all` is fine for <50 ppl)
        const sendPromises = validTargets.map(c => {
            // Personalize message
            const personalizedMsg = message.replace("{name}", c.first_name);

            return client.messages.create({
                body: personalizedMsg,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: c.phone_number
            }).catch(err => console.error(`Failed to send to ${c.phone_number}:`, err));
        });

        await Promise.all(sendPromises);

        // 4. Log Campaign
        await supabaseAdmin.from("sms_campaigns").insert({
            merchant_id: merchantId,
            name: name,
            message_body: message,
            audience: audience,
            recipient_count: validTargets.length,
            status: "sent"
        });

        return NextResponse.json({ success: true, count: validTargets.length });

    } catch (error) {
        console.error("SMS Error:", error);
        return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }
}