import { getRetellCallLogs } from "@/lib/retell";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CommunicationsClient } from "./client-view";

export default async function CommunicationsPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch Data in Parallel
    const callsPromise = getRetellCallLogs(20);

    // 1. Fetch SMS/Automation Logs
    const logsPromise = supabaseAdmin
        .from("automation_logs")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(50);

    // 2. Fetch Email Campaigns (NEW)
    const campaignsPromise = supabaseAdmin
        .from("email_campaigns")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(20);

    const [calls, { data: messages }, { data: campaigns }] = await Promise.all([
        callsPromise,
        logsPromise,
        campaignsPromise
    ]);

    return (
        <CommunicationsClient
            calls={calls}
            messages={messages || []}
            campaigns={campaigns || []} // Pass the real campaigns here
        />
    );
}