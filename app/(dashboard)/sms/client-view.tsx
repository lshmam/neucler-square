"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Smartphone, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

// Templates to make it easy
const TEMPLATES = [
    { label: "Review Request", text: "Hi {name}, thanks for visiting! We'd love to hear about your experience. Leave a review here: bit.ly/review-us" },
    { label: "Win-Back Offer", text: "Hi {name}, we miss you! Show this text for 15% off your next visit this week." },
    { label: "Appointment Reminder", text: "Hi {name}, just a friendly reminder to book your next appointment soon to keep your spot!" },
];

export function SMSClient({ campaigns }: { campaigns: any[] }) {
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [name, setName] = useState("");
    const [audience, setAudience] = useState("all");
    const [message, setMessage] = useState(TEMPLATES[0].text);

    const handleSend = async () => {
        if (!name || !message) return alert("Please fill out all fields");
        setSending(true);
        try {
            const res = await fetch("/api/sms/send", {
                method: "POST",
                body: JSON.stringify({ name, audience, message })
            });
            if (res.ok) {
                alert("SMS Blast Sent!");
                setName("");
                router.refresh();
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (e) { console.error(e); }
        setSending(false);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">SMS Marketing</h2>
                    <p className="text-muted-foreground">Send bulk text messages to drive immediate revenue.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT: CONFIGURATION --- */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5 text-[#906CDD]" /> Create Campaign
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Campaign Name</Label>
                                    <Input placeholder="e.g. Weekend Promo" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Audience</Label>
                                    <Select value={audience} onValueChange={setAudience}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Customers</SelectItem>
                                            <SelectItem value="vip">VIPs ($500+ Spend)</SelectItem>
                                            <SelectItem value="recent">Recent Visitors (7 days)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Load a Template</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {TEMPLATES.map(t => (
                                        <Badge
                                            key={t.label}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-purple-50 hover:border-purple-200 py-2"
                                            onClick={() => setMessage(t.text)}
                                        >
                                            {t.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Message Body</Label>
                                <Textarea
                                    className="min-h-[120px] text-base"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tip: Use <strong>{`{name}`}</strong> to insert the customer's first name automatically.
                                </p>
                            </div>

                            <Button
                                className="w-full bg-[#906CDD] hover:bg-[#7a5bb5] h-12 text-lg"
                                onClick={handleSend}
                                disabled={sending}
                            >
                                {sending ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                {sending ? "Sending..." : "Launch Campaign"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* HISTORY */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">Past Campaigns</h3>
                        {campaigns.map(c => (
                            <Card key={c.id} className="flex items-center justify-between p-4">
                                <div>
                                    <h4 className="font-bold">{c.name}</h4>
                                    <p className="text-sm text-muted-foreground">{c.message_body}</p>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-green-100 text-green-700 mb-1 hover:bg-green-200">Sent</Badge>
                                    <p className="text-xs text-muted-foreground">{c.recipient_count} Recipients</p>
                                </div>
                            </Card>
                        ))}
                        {campaigns.length === 0 && <p className="text-muted-foreground">No campaigns sent yet.</p>}
                    </div>
                </div>

                {/* --- RIGHT: PHONE PREVIEW --- */}
                <div className="hidden lg:block">
                    <div className="sticky top-6">
                        <div className="bg-slate-900 rounded-[3rem] p-4 w-[320px] h-[600px] border-8 border-slate-800 shadow-2xl mx-auto relative">
                            {/* Dynamic Island */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-24 bg-black rounded-b-xl z-10"></div>

                            {/* Screen */}
                            <div className="bg-white w-full h-full rounded-[2rem] overflow-hidden flex flex-col relative">
                                {/* Fake Header */}
                                <div className="bg-slate-100 p-4 pt-10 border-b text-center text-xs font-medium text-slate-500">
                                    Messages • Now
                                </div>

                                {/* Message Bubble */}
                                <div className="flex-1 p-4 space-y-4">
                                    <div className="flex flex-col items-start space-y-1">
                                        <div className="bg-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-sm text-slate-800">
                                            {message.replace("{name}", "Sarah")}
                                        </div>
                                        <span className="text-[10px] text-slate-400 ml-1">Delivered</span>
                                    </div>
                                </div>

                                {/* Fake Keyboard Area */}
                                <div className="bg-slate-100 h-16 w-full border-t flex items-center justify-center text-slate-400 text-xs">
                                    Text Message
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-4">Live Preview</p>
                    </div>
                </div>

            </div>
        </div>
    );
}