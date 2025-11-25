import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SMSClient } from "./client-view";

export default async function SMSPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch history
    const { data: campaigns } = await supabaseAdmin
        .from("sms_campaigns")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(10);

    return <SMSClient campaigns={campaigns || []} />;
}