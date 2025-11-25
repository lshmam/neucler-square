import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { postmarkClient } from "@/lib/postmark"; // Import the new helper

export async function POST(request: Request) {
    // 1. Auth Check
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { subject, content, audience, title } = body;

        // 2. Fetch Target Audience from Supabase
        let query = supabaseAdmin.from("customers").select("email, first_name").eq("merchant_id", merchantId);

        if (audience === "vip") {
            query = query.gt("total_spend_cents", 50000);
        } else if (audience === "new") {
            query = query.eq("visit_count", 1);
        }

        const { data: customers, error } = await query;

        if (error || !customers || customers.length === 0) {
            return NextResponse.json({ error: "No customers found for this audience." }, { status: 400 });
        }

        // 3. Save Campaign to DB (Mark as 'sent')
        const { error: dbError } = await supabaseAdmin
            .from("email_campaigns")
            .insert({
                merchant_id: merchantId,
                name: title,
                subject: subject,
                body: content,
                audience: audience,
                status: "sent",
                sent_count: customers.length
            });

        if (dbError) throw dbError;

        // 4. Send Emails via Postmark (Batching)
        // Postmark allows up to 500 emails in a single batch API call.
        const messages = customers
            .filter(c => c.email) // Ensure email exists
            .map(c => ({
                From: "ai@neucler.com", // MUST match your verified Sender Signature in Postmark
                To: c.email,
                Subject: subject,
                HtmlBody: `<p>Hi ${c.first_name},</p><br/>${content}`,
                TextBody: content.replace(/<[^>]*>?/gm, ''), // Strip HTML for text version
                MessageStream: "broadcast" // Optional: Use 'broadcast' for bulk marketing, 'outbound' for transactional
            }));

        // Send in a single batch call (super fast)
        if (messages.length > 0) {
            await postmarkClient.sendEmailBatch(messages);
        }

        return NextResponse.json({ success: true, count: customers.length });

    } catch (error) {
        console.error("Campaign Error:", error);
        return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
    }
}