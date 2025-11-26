import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
// import { createOrUpdateRetellAgent } from "@/lib/retell";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { name, voice_id, system_prompt, type } = body;

        // 1. Check if we already have an agent for this merchant
        const { data: existing } = await supabaseAdmin
            .from("ai_agents")
            .select("*")
            .eq("merchant_id", merchantId)
            .single();

        // 2. Call Retell API to create/update the agent
        // (In a full implementation, you'd create the LLM first with the prompt, then the Agent)
        // For now, we assume success and generate a mock ID if Retell setup isn't perfect yet
        let retellAgentId = existing?.retell_agent_id || `agent_${Math.random().toString(36).substring(7)}`;

        // Uncomment this when ready to really hit Retell
        // const retellResponse = await createOrUpdateRetellAgent({ name, voice_id }, retellAgentId);
        // retellAgentId = retellResponse.agent_id;

        // 3. Save to Supabase
        const { error } = await supabaseAdmin
            .from("ai_agents")
            .upsert({
                merchant_id: merchantId,
                retell_agent_id: retellAgentId,
                name,
                voice_id,
                system_prompt,
                type
            }, { onConflict: "merchant_id" });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save agent" }, { status: 500 });
    }
}