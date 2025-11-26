"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { upsertRetellLLM, upsertRetellAgent, buyPhoneNumber } from "@/lib/retell";
import { revalidatePath } from "next/cache";

// --- MAIN SAVE ACTION ---
export async function saveAgentConfig(merchantId: string, config: any, agentId?: string) {
    try {
        // 1. Determine if we are Updating or Creating
        let currentAgent = null;

        if (agentId) {
            const { data } = await supabaseAdmin
                .from("ai_agents")
                .select("*")
                .eq("id", agentId)
                .single();
            currentAgent = data;
        }

        // 2. Fetch Business Profile for Context
        const { data: profile } = await supabaseAdmin
            .from("business_profiles")
            .select("*")
            .eq("merchant_id", merchantId)
            .single();

        // 3. Construct System Prompt
        const systemPrompt = `
      You are ${config.name}, the AI receptionist.
      Your tone is ${profile?.ai_tone || "friendly"}.
      
      ## OPENING GREETING
      Start every call with: "${config.openingGreeting}"

      ## BUSINESS INFO
      Hours: ${JSON.stringify(profile?.business_hours)}
      Services: ${profile?.services_summary}
      
      ## INSTRUCTIONS
      ${config.systemPrompt || ""} 
    `;

        // 4. SYNC TO RETELL
        const retellLlm = await upsertRetellLLM(
            currentAgent?.retell_llm_id,
            systemPrompt
        );

        const retellAgent = await upsertRetellAgent(
            currentAgent?.retell_agent_id,
            retellLlm.llm_id,
            config.voiceId,
            config.name,
            config.openingGreeting
        );

        // 5. UPDATE/INSERT DATABASE
        const payload = {
            merchant_id: merchantId,
            name: config.name,
            voice_id: config.voiceId,
            opening_greeting: config.openingGreeting,
            pickup_behavior: config.pickupBehavior,
            system_prompt: config.systemPrompt,
            phone_mode: config.phoneMode || 'generated',
            retell_agent_id: retellAgent.agent_id,
            retell_llm_id: retellLlm.llm_id,
            type: "voice",
            status: "active"
        };

        let result;
        if (agentId) {
            result = await supabaseAdmin.from("ai_agents").update(payload).eq("id", agentId).select().single();
        } else {
            result = await supabaseAdmin.from("ai_agents").insert(payload).select().single();
        }

        if (result.error) throw result.error;

        // 6. Handle "Use Existing Number" (Provision a number if they don't have one yet)
        // Even if they use their existing number, we need a Retell number to forward TO.
        if (config.phoneMode === 'forwarding' && !currentAgent?.phone_number) {
            // Auto-buy a number so they have something to forward to
            // Defaulting to 415 (San Francisco) or you can ask for area code in wizard
            try {
                const numRes = await buyPhoneNumber(415, retellAgent.agent_id);
                await supabaseAdmin.from("ai_agents").update({ phone_number: numRes.phone_number }).eq("id", result.data.id);
            } catch (e) {
                console.error("Auto-provision failed", e);
            }
        }

        revalidatePath("/ai-agent");
        return { success: true, agentId: result.data.id };
    } catch (error: any) {
        console.error("Agent Sync Failed:", error);
        return { success: false, error: error.message };
    }
}

// --- NEW ACTION: PURCHASE NUMBER ---
export async function purchaseNumber(merchantId: string, areaCode: number) {
    try {
        // 1. Find existing agent for this merchant
        let { data: agent } = await supabaseAdmin
            .from("ai_agents")
            .select("*")
            .eq("merchant_id", merchantId)
            .single();

        let retellAgentId = agent?.retell_agent_id;

        // 2. If no agent exists, create a placeholder one
        // Retell requires an agent_id to buy a number
        if (!retellAgentId) {
            const llm = await upsertRetellLLM(null, "Initial setup placeholder");
            const retellAgent = await upsertRetellAgent(
                null,
                llm.llm_id,
                "11labs-Sarah",
                "New Agent",
                "Hello, how can I help?"
            );
            retellAgentId = retellAgent.agent_id;

            // Save to DB so we don't lose this reference
            const { data: newAgent } = await supabaseAdmin.from("ai_agents").insert({
                merchant_id: merchantId,
                retell_agent_id: retellAgentId,
                retell_llm_id: llm.llm_id,
                name: "New Agent",
                status: "setup",
                type: "voice"
            }).select().single();

            agent = newAgent;
        }

        // 3. Buy the number
        const phoneRes = await buyPhoneNumber(areaCode, retellAgentId);

        // 4. Update DB with the new number
        if (agent) {
            await supabaseAdmin.from("ai_agents").update({
                phone_number: phoneRes.phone_number
            }).eq("id", agent.id);
        }

        return { success: true, number: phoneRes.phone_number };
    } catch (e: any) {
        console.error("Purchase Number Failed:", e);
        return { success: false, error: e.message };
    }
}