import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { postmarkClient } from "@/lib/postmark";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { subject, content, audience, title } = body;
        const fromEmail = process.env.NEXT_PUBLIC_POSTMARK_FROM_EMAIL;

        if (!fromEmail) {
            console.error("❌ Missing NEXT_PUBLIC_POSTMARK_FROM_EMAIL in .env");
            return NextResponse.json({ error: "Server misconfiguration: Missing sender email." }, { status: 500 });
        }

        // 1. Fetch Audience
        let query = supabaseAdmin.from("customers").select("email, first_name").eq("merchant_id", merchantId).neq("email", null);

        if (audience === "vip") query = query.gt("total_spend_cents", 50000);
        // Add logic for 'new' or 'loyal' here if needed

        const { data: customers } = await query;

        if (!customers || customers.length === 0) {
            return NextResponse.json({ error: "No customers found for this audience." }, { status: 400 });
        }

        // 2. Prepare Messages
        const messages = customers.map(c => ({
            From: fromEmail,
            To: c.email,
            Subject: subject,
            HtmlBody: `
          <div style="font-family: sans-serif; color: #333;">
            <p>Hi ${c.first_name || "there"},</p>
            <div style="margin: 20px 0;">
              ${content}
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 40px;">
              ${title} • <a href="#">Unsubscribe</a>
            </p>
          </div>
        `,
            MessageStream: "broadcast"
        }));

        // 3. Send via Postmark
        if (messages.length > 0) {
            // Send in batches of 500 if list is huge (Postmark limit), strictly simpler here:
            try {
                await postmarkClient.sendEmailBatch(messages);
                console.log(`✅ Sent ${messages.length} emails via Postmark.`);
            } catch (postmarkError: any) {
                console.error("❌ Postmark API Error:", postmarkError.message);
                return NextResponse.json({ error: `Email Provider Error: ${postmarkError.message}` }, { status: 502 });
            }
        }

        // 4. Log Campaign to DB
        await supabaseAdmin.from("email_campaigns").insert({
            merchant_id: merchantId,
            name: title,
            subject: subject,
            body: content,
            audience: audience,
            status: "sent",
            sent_count: customers.length
        });

        return NextResponse.json({ success: true, count: customers.length });
    } catch (error: any) {
        console.error("❌ Campaign Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}