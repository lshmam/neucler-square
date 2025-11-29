import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;

    // 1. Auth Check
    if (!merchantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { phone, message } = body;

        if (!phone || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 2. Send SMS via Twilio
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });

        // 3. Log to Supabase "messages" table
        // This makes sure the message appears in history on next refresh
        await supabaseAdmin.from("messages").insert({
            merchant_id: merchantId,
            customer_phone: phone,
            direction: "outbound", // Important for styling
            body: message, // or 'content' depending on your exact DB schema
            status: "sent"
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Reply Error:", error);
        return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }
}