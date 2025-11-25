"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// --- POINTS MANAGEMENT (Existing) ---
export async function adjustCustomerPoints(
    merchantId: string,
    customerId: string,
    points: number,
    reason: string
) {
    const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("loyalty_balance")
        .eq("id", customerId)
        .eq("merchant_id", merchantId)
        .single();

    if (!customer) throw new Error("Customer not found");

    const newBalance = (customer.loyalty_balance || 0) + points;
    if (newBalance < 0) throw new Error("Insufficient points");

    await supabaseAdmin
        .from("customers")
        .update({ loyalty_balance: newBalance })
        .eq("id", customerId)
        .eq("merchant_id", merchantId);

    await supabaseAdmin.from("loyalty_ledger").insert({
        merchant_id: merchantId,
        customer_id: customerId,
        program_id: null, // Optional: link to active program if needed
        points_change: points,
        reason: reason
    });

    revalidatePath("/loyalty");
    return { success: true, newBalance };
}

// --- PROGRAM MANAGEMENT ---

export async function archiveProgram(programId: string) {
    const { error } = await supabaseAdmin
        .from("loyalty_programs")
        .update({ status: "archived" })
        .eq("id", programId);

    if (error) throw error;
    revalidatePath("/loyalty");
}

// NEW: Create a brand new program (and archive others)
export async function createLoyaltyProgram(merchantId: string, programData: any, rewardsData: any[]) {
    // 1. Archive ANY currently active programs for this merchant
    await supabaseAdmin
        .from("loyalty_programs")
        .update({ status: "archived" })
        .eq("merchant_id", merchantId)
        .eq("status", "active");

    // 2. Insert NEW Program
    const { data: newProgram, error: progError } = await supabaseAdmin
        .from("loyalty_programs")
        .insert({
            merchant_id: merchantId,
            terminology: programData.terminology,
            accrual_type: programData.accrualType,
            accrual_rule: { spend: programData.spendAmount, earn: programData.earnAmount },
            status: "active"
        })
        .select()
        .single();

    if (progError) throw progError;

    // 3. Insert Rewards
    const rewards = rewardsData.map(r => ({
        program_id: newProgram.id,
        name: r.name,
        discount_type: r.type,
        discount_value: r.value,
        points_required: r.points
    }));

    const { error: rewardError } = await supabaseAdmin
        .from("loyalty_rewards")
        .insert(rewards);

    if (rewardError) throw rewardError;

    revalidatePath("/loyalty");
    return { success: true };
}