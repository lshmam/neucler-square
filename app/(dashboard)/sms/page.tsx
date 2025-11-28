import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus, Users, Smartphone } from "lucide-react";
import Link from "next/link";

export default async function SMSPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    const { data: campaigns } = await supabaseAdmin
        .from("sms_campaigns")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">SMS Marketing</h2>
                    <p className="text-muted-foreground">Send flash sales and updates directly to phones.</p>
                </div>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/sms/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Text Blast
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {(!campaigns || campaigns.length === 0) ? (
                    <div className="text-center py-20 bg-muted/20 rounded-xl border-dashed border-2">
                        <Smartphone className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No SMS campaigns yet</h3>
                        <p className="text-muted-foreground mb-6">Text messages have a 98% open rate. Try one now!</p>
                        <Button asChild variant="outline">
                            <Link href="/sms/new">Draft Message</Link>
                        </Button>
                    </div>
                ) : (
                    campaigns.map((c) => (
                        <Card key={c.id}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-lg">{c.name}</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-1">"{c.message_body}"</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-700">{c.recipient_count}</div>
                                    <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                        <Users className="h-3 w-3" /> Delivered
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