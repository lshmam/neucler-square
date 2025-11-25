import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { getPrimaryLocation, getCatalogSummary } from "@/lib/square";
import { OnboardingForm } from "./form";

// --- HELPER: Transform Square Hours to App Format ---
function transformSquareHours(periods: any[]) {
    // Default State: All Closed
    const result: any = {
        Mon: { isOpen: false, open: "09:00", close: "17:00" },
        Tue: { isOpen: false, open: "09:00", close: "17:00" },
        Wed: { isOpen: false, open: "09:00", close: "17:00" },
        Thu: { isOpen: false, open: "09:00", close: "17:00" },
        Fri: { isOpen: false, open: "09:00", close: "17:00" },
        Sat: { isOpen: false, open: "10:00", close: "14:00" },
        Sun: { isOpen: false, open: "10:00", close: "14:00" },
    };

    if (!periods || periods.length === 0) return result;

    const dayMap: Record<string, string> = {
        "MON": "Mon", "TUE": "Tue", "WED": "Wed", "THU": "Thu",
        "FRI": "Fri", "SAT": "Sat", "SUN": "Sun"
    };

    periods.forEach((p: any) => {
        const dayName = dayMap[p.day_of_week];
        if (dayName && result[dayName]) {
            result[dayName].isOpen = true;
            // Square returns 24h format (e.g. "09:00:00" or "09:00")
            // We slice to ensure HH:MM format
            result[dayName].open = p.start_local_time.slice(0, 5);
            result[dayName].close = p.end_local_time.slice(0, 5);
        }
    });

    return result;
}

// --- MAIN PAGE COMPONENT ---
export default async function OnboardingPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // 1. Fetch Merchant Credentials (Token needed for Square API)
    const { data: merchant } = await supabaseAdmin
        .from("merchants")
        .select("business_name, access_token, email")
        .eq("platform_merchant_id", merchantId)
        .single();

    if (!merchant) redirect("/");

    // 2. Check if Profile Already Exists in DB (Priority 1)
    // If they started onboarding but didn't finish, we want to load that state.
    const { data: existingProfile } = await supabaseAdmin
        .from("business_profiles")
        .select("*")
        .eq("merchant_id", merchantId)
        .single();

    let initialData = existingProfile;

    // 3. IF NO PROFILE EXISTS -> FETCH FRESH DATA FROM SQUARE (Priority 2)
    if (!initialData) {
        console.log(`⚡ Auto-Syncing Square Data for ${merchant.business_name}...`);

        try {
            const [location, catalogServices] = await Promise.all([
                getPrimaryLocation(merchant.access_token),
                getCatalogSummary(merchant.access_token)
            ]);

            if (location) {
                initialData = {
                    website: location.website || "",
                    phone: location.phone || "",
                    address: location.address || "",
                    services_summary: catalogServices || "", // Auto-generated menu summary
                    business_hours: transformSquareHours(location.raw_hours),
                    timezone: location.timezone || "UTC",
                    // Defaults for fields Square doesn't provide
                    ai_name: "Alex",
                    ai_tone: "friendly",
                    industry: "Retail", // User will have to select this
                    faq_list: []
                };
            }
        } catch (error) {
            console.error("⚠️ Failed to auto-sync Square data:", error);
            // Fallback to empty state if API fails
            initialData = null;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* LOGO / BRANDING */}
                <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-primary"
                    >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                </div>

                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                    Welcome to VoiceIntel
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Setting up AI for <strong>{merchant.business_name}</strong>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">

                    {/* Show a badge if data was auto-synced */}
                    {!existingProfile && initialData?.phone && (
                        <div className="mb-6 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><polyline points="3 7 12 13 21 7" /></svg>
                            <div>
                                <strong>Data Auto-Synced from Square!</strong>
                                <p className="mt-1 opacity-90">
                                    We pulled your hours, phone number, and service menu automatically. Please review them below.
                                </p>
                            </div>
                        </div>
                    )}

                    <OnboardingForm
                        merchantId={merchantId}
                        initialData={initialData}
                        businessName={merchant.business_name}
                    />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-8">
                    VoiceIntel securely processes your business data to train your AI Agents.
                </p>
            </div>
        </div>
    );
}