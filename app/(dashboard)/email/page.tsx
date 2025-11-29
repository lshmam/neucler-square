import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { EmailClientView } from "./client-view"; // Import the file you just made

export default async function EmailMarketingPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch Past Campaigns
    const { data: campaigns } = await supabaseAdmin
        .from("email_campaigns")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });

    return (
        <EmailClientView
            initialCampaigns={campaigns || []}
            merchantId={merchantId}
        />
    );
}