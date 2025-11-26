import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { mg, DOMAIN } from "@/lib/mailgun";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { subject, content, audience, title } = body;
        const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL;
        const mailgunDomain = DOMAIN;

        if (!fromEmail || !mailgunDomain) {
            return NextResponse.json({ error: "Server misconfiguration: Missing Mailgun config." }, { status: 500 });
        }

        // 1. Fetch Merchant Info (For Reply-To)
        const { data: merchant } = await supabaseAdmin
            .from("merchants")
            .select("business_name, email")
            .eq("platform_merchant_id", merchantId)
            .single();

        if (!merchant) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });

        // 2. Fetch Audience
        let query = supabaseAdmin.from("customers").select("email, first_name").eq("merchant_id", merchantId).neq("email", null);

        // Add filtering logic
        if (audience === "vip") query = query.gt("total_spend_cents", 50000);

        const { data: customers } = await query;

        if (!customers || customers.length === 0) {
            return NextResponse.json({ error: "No customers found for this audience." }, { status: 400 });
        }

        // 3. Prepare Batch Sending for Mailgun
        // Mailgun allows sending to multiple recipients in one API call using "Recipient Variables"
        // This is much faster/cheaper than a loop.

        const recipients: string[] = [];
        const recipientVariables: Record<string, any> = {};

        customers.forEach(c => {
            if (c.email) {
                recipients.push(c.email);
                // Map email to { id: 1, name: "John" } so we can use %recipient.name% in the body
                recipientVariables[c.email] = { name: c.first_name || "there" };
            }
        });

        if (recipients.length === 0) return NextResponse.json({ error: "No valid emails found" }, { status: 400 });

        // 4. Send via Mailgun
        const messageData = {
            from: `${merchant.business_name} via VoiceIntel <${fromEmail}>`,
            to: recipients, // Array of emails
            'recipient-variables': JSON.stringify(recipientVariables), // Magic mapping
            'h:Reply-To': merchant.email, // <--- CRITICAL: Replies go to the merchant!
            subject: subject,
            // We use %recipient.name% which Mailgun replaces per person
            html: `
          <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.5;">
            <p>Hi %recipient.name%,</p> 
            <div style="margin: 20px 0; white-space: pre-wrap;">${content}</div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888;">
              ${merchant.business_name} • Powered by VoiceIntel
              <br/>
              <a href="%unsubscribe_url%" style="color: #888;">Unsubscribe</a>
            </p>
          </div>
        `
        };

        const msg = await mg.messages.create(mailgunDomain, messageData);
        console.log(`✅ Mailgun Sent: ${msg.id}`);

        // 5. Log Campaign to Database
        await supabaseAdmin.from("email_campaigns").insert({
            merchant_id: merchantId,
            name: title,
            subject: subject,
            body: content,
            audience: audience,
            status: "sent",
            sent_count: recipients.length
        });

        return NextResponse.json({ success: true, count: recipients.length });

    } catch (error: any) {
        console.error("❌ Mailgun Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send emails" }, { status: 500 });
    }
}