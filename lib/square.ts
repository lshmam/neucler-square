import { supabaseAdmin } from "@/lib/supabase";

const IS_SANDBOX = process.env.SQUARE_ENVIRONMENT === "sandbox";
const BASE_URL = IS_SANDBOX
    ? "https://connect.squareupsandbox.com/v2"
    : "https://connect.squareup.com/v2";

// --- 1. Get Merchant Profile ---
export async function getMerchantInfo(accessToken: string) {
    try {
        const res = await fetch(`${BASE_URL}/merchants/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            console.error("❌ Square API Error (Merchant):", res.statusText);
            return { name: "Square Merchant" };
        }

        const data = await res.json();
        return { name: data.merchant.business_name || "My Business" };
    } catch (error) {
        console.error("❌ Failed to fetch merchant info:", error);
        return { name: "Square Merchant" };
    }
}

// --- 2. Sync Customers from Square to Supabase ---
export async function syncCustomers(merchantId: string, accessToken: string) {
    console.log("🔄 Syncing Square Customers for:", merchantId);

    try {
        const res = await fetch(`${BASE_URL}/customers`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Square API Error: ${JSON.stringify(errorData)}`);
        }

        const data = await res.json();
        const squareCustomers = data.customers || [];

        if (squareCustomers.length === 0) return 0;

        // Map Square data to our Supabase Schema
        const customersToUpsert = squareCustomers.map((c: any) => ({
            id: c.id,
            merchant_id: merchantId, // Links to merchants.platform_merchant_id
            first_name: c.given_name || "",
            last_name: c.family_name || "",
            email: c.email_address || null,
            phone_number: c.phone_number || null,
            total_spend_cents: 0, // We can enhance this later with an Orders sync
            visit_count: 1,
        }));

        // Upsert to Supabase (Update if exists, Insert if new)
        const { error } = await supabaseAdmin
            .from("customers")
            .upsert(customersToUpsert, { onConflict: "id, merchant_id" });

        if (error) {
            console.error("Supabase Upsert Error:", error);
            throw error;
        }

        return customersToUpsert.length;
    } catch (error) {
        console.error("❌ Sync failed:", error);
        throw error;
    }
}

// --- 3. Get Real Daily Revenue & Stats ---
export async function getDailyStats(merchantId: string, accessToken: string) {
    try {
        // Step A: We need a Location ID to search orders. 
        // Square transactions are tied to locations, not just the merchant.
        const locationRes = await fetch(`${BASE_URL}/locations`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            next: { revalidate: 3600 }, // Cache location ID for 1 hour
        });

        const locData = await locationRes.json();
        // Grab the first active location (most single-location businesses)
        const locationId = locData.locations?.find((l: any) => l.status === "ACTIVE")?.id;

        if (!locationId) {
            console.warn("⚠️ No active location found for this merchant.");
            return { total: "0.00", count: 0 };
        }

        // Step B: Calculate Start of Day (UTC)
        // In a polished app, you'd use the merchant's timezone from locData.timezone
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        // Step C: Search Orders
        const ordersRes = await fetch(`${BASE_URL}/orders/search`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                location_ids: [locationId],
                query: {
                    filter: {
                        date_time_filter: {
                            created_at: {
                                start_at: startOfDay.toISOString() // e.g., 2023-10-27T00:00:00Z
                            }
                        },
                        state_filter: {
                            states: ["COMPLETED"] // Only count actual sales, not open tickets
                        }
                    }
                }
            }),
            cache: "no-store",
        });

        if (!ordersRes.ok) {
            console.error("❌ Failed to search orders:", await ordersRes.text());
            return { total: "0.00", count: 0 };
        }

        const ordersData = await ordersRes.json();
        const orders = ordersData.orders || [];

        // Step D: Calculate Totals
        let totalCents = 0;

        orders.forEach((order: any) => {
            // Square returns money objects: { amount: 100, currency: "USD" }
            if (order.total_money?.amount) {
                totalCents += Number(order.total_money.amount);
            }
        });

        return {
            total: (totalCents / 100).toFixed(2), // Convert 1250 cents -> "12.50"
            count: orders.length
        };

    } catch (error) {
        console.error("❌ Error fetching daily stats:", error);
        return { total: "0.00", count: 0 };
    }
}