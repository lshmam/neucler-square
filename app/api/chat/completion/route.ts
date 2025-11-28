import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { merchantId, message, history } = body;

        if (!merchantId || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch the System Prompt from Database
        // We try to find a custom prompt in 'ai_agents', otherwise fall back to 'business_profiles'
        const { data: agent } = await supabaseAdmin
            .from("ai_agents")
            .select("system_prompt, name")
            .eq("merchant_id", merchantId)
            .single();

        // Default "Backup" Prompt if database is empty
        let systemPrompt = agent?.system_prompt || "You are a helpful customer support AI for a local business. Be concise and friendly.";

        // 2. Prepare Messages for OpenAI
        // We take the last 5 messages to save costs/tokens, plus the new user message
        const previousMessages = Array.isArray(history) ? history.slice(-5) : [];

        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...previousMessages.map((m: any) => ({
                role: m.role,
                content: m.content
            })),
            { role: "user", content: message }
        ];

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast, cheap, and smart
            messages: apiMessages as any,
            max_tokens: 200, // Limit response length
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("❌ Chat API Error:", error);

        // Check specifically for missing API Key
        if (error.message?.includes("API key")) {
            console.error("💡 TIP: Did you add OPENAI_API_KEY to your .env.local file?");
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}