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

        if (!fromEmail || !DOMAIN) {
            return NextResponse.json({ error: "Server config error" }, { status: 500 });
        }

        // --- STEP 1: CREATE CAMPAIGN IN DB FIRST (MOVED TO TOP) ---
        // This creates the record and gives us an ID to track.
        const { data: campaign, error: insertError } = await supabaseAdmin
            .from("email_campaigns")
            .insert({
                merchant_id: merchantId,
                name: title,
                subject: subject,
                body: content,
                audience: audience,
                status: "sending", // Start with a "sending" status
                sent_count: 0 // Will be updated later
            })
            .select()
            .single();

        // If this fails, we can't proceed.
        if (insertError) {
            console.error("DB Insert Error:", insertError);
            throw new Error("Could not create campaign record in database.");
        }

        // --- STEP 2: Fetch Merchant Info ---
        const { data: merchant } = await supabaseAdmin
            .from("merchants")
            .select("business_name, email")
            .eq("platform_merchant_id", merchantId)
            .single();

        if (!merchant) throw new Error("Merchant not found");

        // --- STEP 3: Fetch Audience ---
        let query = supabaseAdmin
            .from("customers")
            .select("email, first_name")
            .eq("merchant_id", merchantId)
            .neq("email", null)
            .or('is_subscribed.is.null,is_subscribed.eq.true');

        if (audience === "vip") {
            query = query.gt("total_spend_cents", 50000);
        }

        const { data: customers } = await query;

        if (!customers || customers.length === 0) {
            // Update status to failed since no one was found
            await supabaseAdmin.from("email_campaigns").update({ status: 'failed', sent_count: 0 }).eq('id', campaign.id);
            return NextResponse.json({ error: "No subscribed recipients found." }, { status: 400 });
        }

        // --- STEP 4: Prepare Mailgun Data ---
        const recipients: string[] = [];
        const recipientVariables: Record<string, any> = {};

        customers.forEach(c => {
            if (c.email) {
                recipients.push(c.email);
                recipientVariables[c.email] = { name: c.first_name || "there" };
            }
        });

        const messageData = {
            from: `${merchant.business_name} <${fromEmail}>`,
            to: recipients,
            'recipient-variables': JSON.stringify(recipientVariables),
            'h:Reply-To': merchant.email,
            subject: subject,
            // Now this is guaranteed to exist
            'v:campaign_id': campaign.id,
            'o:tracking': 'yes',
            'o:tracking-opens': 'yes',
            'o:tracking-clicks': 'yes',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; color: #333; line-height: 1.6;">
                    <p>Hi %recipient.name%,</p> 
                    
                    <!-- This div now correctly uses the 'content' variable -->
                    <div style="margin: 20px 0; white-space: pre-wrap; font-size: 16px;">${content}</div>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                    
                    <p style="font-size: 12px; color: #888;">
                      Sent by ${merchant.business_name} • Powered by VoiceIntel
                      <br/>
                      <a href="%unsubscribe_url%" style="color: #888; text-decoration: underline;">Unsubscribe</a>
                    </p>
                </div>
            `
        };

        // --- STEP 5: Send via Mailgun ---
        await mg.messages.create(DOMAIN, messageData as any);

        // --- STEP 6: Update Campaign Status and Count ---
        await supabaseAdmin
            .from("email_campaigns")
            .update({ status: 'sent', sent_count: recipients.length })
            .eq('id', campaign.id);

        return NextResponse.json({ success: true, count: recipients.length });

    } catch (error: any) {
        console.error("Email Error:", error);
        return NextResponse.json({ error: error.message || "Failed to send" }, { status: 500 });
    }
}