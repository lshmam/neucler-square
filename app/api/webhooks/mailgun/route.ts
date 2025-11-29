import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from 'crypto';

const SIGNING_KEY = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

const verifyMailgunSignature = (token: string, timestamp: string, signature: string) => {
    if (!SIGNING_KEY) return true;
    const encodedToken = crypto.createHmac('sha256', SIGNING_KEY).update(timestamp.concat(token)).digest('hex');
    return encodedToken === signature;
};

// --- HELPER FUNCTION TO CHECK FOR RECENT DELIVERY ---
async function isBotOpen(campaignId: string, recipientEmail: string): Promise<boolean> {
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

    const { data, error } = await supabaseAdmin
        .from('email_deliveries_log')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('recipient_email', recipientEmail)
        .gte('delivered_at', fiveSecondsAgo) // Was delivered in the last 5 seconds?
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (no rows found)
        console.error("Bot check error:", error);
        return false; // Fail safe, assume it's a real open
    }

    return !!data; // If data exists, it's a recent delivery, so it's a bot open.
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { signature, 'event-data': eventData } = body;

        if (!verifyMailgunSignature(signature.token, signature.timestamp, signature.signature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const campaignId = eventData['user-variables']?.campaign_id;
        const recipientEmail = eventData.recipient;
        const eventType = eventData.event;

        if (!campaignId || !recipientEmail) {
            return NextResponse.json({ status: "ignored" });
        }

        let columnToIncrement = "";
        let requiresUniqueness = false;

        switch (eventType) {
            case 'delivered':
                columnToIncrement = 'delivered_count';
                // Log the delivery time for the bot check
                await supabaseAdmin.from('email_deliveries_log').upsert({
                    campaign_id: campaignId,
                    recipient_email: recipientEmail,
                    delivered_at: new Date().toISOString()
                });
                break;
            case 'opened':
                columnToIncrement = 'open_count';
                requiresUniqueness = true;
                // --- BOT CHECK ---
                if (await isBotOpen(campaignId, recipientEmail)) {
                    console.log(`🤖 Bot open ignored for ${recipientEmail}`);
                    return NextResponse.json({ status: "bot_open_ignored" });
                }
                break;
            case 'clicked':
                columnToIncrement = 'click_count';
                requiresUniqueness = true;
                break;
            // ... other cases (complained, bounced, etc.)
            case 'unsubscribed':
                await supabaseAdmin.from('customers').update({ is_subscribed: false }).eq('email', recipientEmail);
                return NextResponse.json({ status: "unsubscribed" });
        }

        if (columnToIncrement) {
            if (requiresUniqueness) {
                const { error: logError } = await supabaseAdmin.from('email_events_log').insert({
                    campaign_id: campaignId,
                    recipient_email: recipientEmail,
                    event_type: eventType
                });
                if (logError && logError.code === '23505') {
                    return NextResponse.json({ status: "duplicate_ignored" });
                }
            }
            await supabaseAdmin.rpc('increment_campaign_stat', {
                row_id: campaignId,
                column_name: columnToIncrement
            });
        }

        return NextResponse.json({ status: "success" });

    } catch (error) {
        console.error("Webhook Error", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}