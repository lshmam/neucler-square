import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CustomersClient } from "./client"; // Import the new component

export default async function CustomersPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch ALL customers for this merchant
    const { data: customers } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("last_name", { ascending: true })
        .limit(100); // Increase limit for better demo

    return (
        // We pass the data to the client component
        <CustomersClient initialCustomers={customers || []} />
    );
}