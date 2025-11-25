import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WebIntegrationClient } from "./client-view";

export default async function WebIntegrationPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch existing widget configs
    const { data: widgets } = await supabaseAdmin
        .from("web_widgets")
        .select("*")
        .eq("merchant_id", merchantId);

    return <WebIntegrationClient widgets={widgets || []} merchantId={merchantId} />;
}