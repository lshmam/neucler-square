import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmailClient } from "./client-view";

export default async function EmailPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch campaign history from Supabase
    const { data: campaigns } = await supabaseAdmin
        .from("email_campaigns")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(10);

    return <EmailClient campaigns={campaigns || []} />;
}