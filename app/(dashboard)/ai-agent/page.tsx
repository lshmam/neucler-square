import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getVoices } from "@/lib/retell";
import { AgentClientView } from "./client-view";

export default async function AIAgentPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // 1. Fetch existing agent config
    const { data: agent } = await supabaseAdmin
        .from("ai_agents")
        .select("*")
        .eq("merchant_id", merchantId)
        .single();

    // 2. Fetch available voices
    const voices = await getVoices();

    return (
        <AgentClientView
            initialData={agent || null}
            voices={voices}
        />
    );
}