"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveOnboardingData(merchantId: string, formData: any) {

    // 1. Save the structured data to business_profiles
    const { error } = await supabaseAdmin
        .from("business_profiles")
        .upsert({
            merchant_id: merchantId,
            timezone: formData.timezone,
            business_hours: formData.hours,
            website: formData.website,
            phone: formData.phone,
            industry: formData.industry,
            services_summary: formData.services,
            faq_list: formData.faqs,
            ai_tone: formData.tone,
            ai_name: formData.aiName,
            is_onboarding_completed: true
        }, { onConflict: "merchant_id" });

    if (error) throw error;

    // 2. CONSTRUCT THE MASTER AI PROMPT
    // This is the "Brain" that will be fed to OpenAI and Retell
    const masterPrompt = `
    You are ${formData.aiName}, the AI assistant for a ${formData.industry} business.
    Your tone is ${formData.tone}.
    
    BUSINESS INFO:
    Website: ${formData.website}
    Phone: ${formData.phone}
    Address: ${formData.address || "Main Location"}
    
    HOURS OF OPERATION:
    ${formatHours(formData.hours)}

    SERVICES & PRICING:
    ${formData.services}

    FREQUENTLY ASKED QUESTIONS:
    ${formData.faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n")}

    INSTRUCTIONS:
    - Be helpful and brief.
    - If you don't know an answer, ask the user to call ${formData.phone}.
    - Do not make up prices not listed here.
  `;

    // 3. Update the AI AGENT (Voice & Chat)
    // We upsert into ai_agents so the Chatbot API and Retell API can read this prompt.
    await supabaseAdmin.from("ai_agents").upsert({
        merchant_id: merchantId,
        name: formData.aiName,
        system_prompt: masterPrompt,
        type: "hybrid" // Indicates it powers both voice and text
    }, { onConflict: "merchant_id" });

    revalidatePath("/dashboard");
    redirect("/dashboard?success=onboarding_complete");
}

// Helper to format hours JSON to text
function formatHours(hours: any) {
    if (!hours) return "Standard Business Hours";
    return Object.entries(hours).map(([day, time]: any) =>
        `${day}: ${time.isOpen ? `${time.open} - ${time.close}` : "Closed"}`
    ).join("\n");
}