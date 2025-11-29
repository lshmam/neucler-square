"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveOnboardingData(merchantId: string, formData: any) {

    const { error } = await supabaseAdmin
        .from("business_profiles")
        .upsert({
            merchant_id: merchantId,
            // Identity
            logo_url: formData.logoUrl,
            brand_color: formData.brandColor,
            website: formData.website,
            phone: formData.phone,
            industry: formData.industry,

            // Operations
            timezone: formData.timezone,
            business_hours: formData.hours,

            // Knowledge
            services_summary: formData.services,
            faq_list: formData.faqs,

            // Defaults for the AI (Since we removed the step, we set sensible defaults)
            ai_name: "Alex",
            ai_tone: "friendly",

            is_onboarding_completed: true
        }, { onConflict: "merchant_id" });

    if (error) throw error;

    // We still generate the prompt in the background so the AI works immediately
    const masterPrompt = `
    You are the AI assistant for ${formData.businessName || "this business"}.
    Industry: ${formData.industry}
    Phone: ${formData.phone}
    Hours: ${JSON.stringify(formData.hours)}
    Services: ${formData.services}
    FAQs: ${JSON.stringify(formData.faqs)}
  `;

    await supabaseAdmin.from("ai_agents").upsert({
        merchant_id: merchantId,
        name: "Alex",
        system_prompt: masterPrompt,
        type: "hybrid"
    }, { onConflict: "merchant_id" });

    revalidatePath("/dashboard");
    redirect("/dashboard?success=onboarding_complete");
}