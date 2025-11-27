import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse"; // Twilio types

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const from = data.get("From") as string; // Customer
        const to = data.get("To") as string;     // Your AI Number
        const body = data.get("Body") as string; // The Message

        // 1. Find the Merchant based on the AI Number
        const { data: agent } = await supabaseAdmin
            .from("ai_agents")
            .select("merchant_id")
            .eq("phone_number", to)
            .single();

        if (agent) {
            // 2. Save the message to DB
            await supabaseAdmin.from("messages").insert({
                merchant_id: agent.merchant_id,
                customer_phone: from,
                direction: "inbound",
                body: body,
                status: "received"
            });
            console.log(`📩 New SMS from ${from}: ${body}`);
        }

        // 3. Return XML (Twilio expects XML response)
        return new NextResponse("<Response></Response>", {
            headers: { "Content-Type": "text/xml" }
        });

    } catch (error) {
        console.error("SMS Handler Error:", error);
        return new NextResponse("Error", { status: 500 });
    }
}