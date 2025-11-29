import { Sidebar } from "@/components/Sidebar";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;

    if (!merchantId) redirect("/");

    // Fetch Merchant Branding
    const { data: profile } = await supabaseAdmin
        .from("business_profiles")
        .select("logo_url, brand_color")
        .eq("merchant_id", merchantId)
        .single();

    const { data: merchant } = await supabaseAdmin
        .from("merchants")
        .select("business_name")
        .eq("platform_merchant_id", merchantId)
        .single();

    const branding = {
        name: merchant?.business_name || "My Business",
        logo: profile?.logo_url || null,
        color: profile?.brand_color || "#ffffff"
    };

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80]">
                <Sidebar branding={branding} />
            </div>
            {/* Dynamic padding logic handled in client or simple generic padding */}
            <main className="md:pl-20 lg:pl-64 h-full bg-slate-50 transition-all duration-300" id="main-content">
                {children}
            </main>
        </div>
    );
}