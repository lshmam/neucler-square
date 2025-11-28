import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function EmailMarketingPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // Fetch Past Campaigns
    const { data: campaigns } = await supabaseAdmin
        .from("email_campaigns")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Email Marketing</h2>
                    <p className="text-muted-foreground">Keep your customers engaged with newsletters and offers.</p>
                </div>
                <Button asChild>
                    <Link href="/email/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Campaign
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {campaigns?.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-xl border-dashed border-2">
                        <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No campaigns yet</h3>
                        <p className="text-muted-foreground mb-6">Send your first email blast to your customers.</p>
                        <Button asChild>
                            <Link href="/email/new">Draft Email</Link>
                        </Button>
                    </div>
                ) : (
                    campaigns?.map((campaign) => (
                        <Card key={campaign.id} className="hover:bg-slate-50 transition-colors">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-lg">{campaign.name}</h4>
                                    <p className="text-sm text-muted-foreground">Subject: {campaign.subject}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800">
                                            {campaign.status}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            {new Date(campaign.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{campaign.sent_count}</div>
                                    <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                        <Users className="h-3 w-3" /> Recipients
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}