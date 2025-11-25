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
import { Send, Mail, Loader2, Sparkles, CheckCircle2, MoreVertical } from "lucide-react";

// Email Templates
const TEMPLATES = [
    {
        label: "Weekly Newsletter",
        subject: "This Week's Specials at VoiceIntel",
        body: "<p>Hi {name},</p><p>We have some exciting updates for you this week...</p>"
    },
    {
        label: "VIP Invite",
        subject: "Exclusive VIP Access",
        body: "<p>Hi {name},</p><p>As one of our top clients, we want to invite you to..."
    },
    {
        label: "We Miss You",
        subject: "It's been a while!",
        body: "<p>Hi {name},</p><p>We noticed you haven't visited in a while. Here is a <strong>10% Off</strong> coupon for your next visit.</p>"
    },
];

export function EmailClient({ campaigns }: { campaigns: any[] }) {
    const router = useRouter();
    const [sending, setSending] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [audience, setAudience] = useState("all");
    const [content, setContent] = useState(TEMPLATES[0].body);

    const handleSend = async () => {
        if (!title || !subject || !content) return alert("Please fill out all fields");
        setSending(true);
        try {
            const res = await fetch("/api/campaigns/send", {
                method: "POST",
                body: JSON.stringify({ title, subject, audience, content })
            });
            if (res.ok) {
                alert("Email Campaign Sent!");
                setTitle("");
                setSubject("");
                router.refresh();
            } else {
                const err = await res.json();
                alert("Error: " + err.error);
            }
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const applyTemplate = (t: typeof TEMPLATES[0]) => {
        setSubject(t.subject);
        setContent(t.body);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Email Marketing</h2>
                    <p className="text-muted-foreground">Design and send broadcasts to your customer base.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT: CONFIGURATION --- */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-[#906CDD]" /> Compose Email
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Campaign Name (Internal)</Label>
                                    <Input placeholder="e.g. Oct Newsletter" value={title} onChange={e => setTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Audience</Label>
                                    <Select value={audience} onValueChange={setAudience}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Customers</SelectItem>
                                            <SelectItem value="vip">VIPs ($500+ Spend)</SelectItem>
                                            <SelectItem value="new">New Customers (1 visit)</SelectItem>
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
                                            onClick={() => applyTemplate(t)}
                                        >
                                            {t.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject Line</Label>
                                <Input placeholder="Subject..." value={subject} onChange={e => setSubject(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Email Body (HTML)</Label>
                                <Textarea
                                    className="min-h-[200px] font-mono text-sm"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tip: Use <strong>{`{name}`}</strong> to insert the customer's name. Basic HTML tags (&lt;p&gt;, &lt;br&gt;, &lt;strong&gt;) work.
                                </p>
                            </div>

                            <Button
                                className="w-full bg-[#906CDD] hover:bg-[#7a5bb5] h-12 text-lg"
                                onClick={handleSend}
                                disabled={sending}
                            >
                                {sending ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                {sending ? "Sending..." : "Blast Campaign"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* HISTORY */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">Recent Campaigns</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {campaigns.map(c => (
                                <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant={c.status === 'sent' ? 'default' : 'outline'} className={c.status === 'sent' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                {c.status}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-4 w-4" /></Button>
                                        </div>
                                        <CardTitle className="text-base mt-2">{c.name}</CardTitle>
                                        <CardDescription>
                                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {c.sent_count} Recipients
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground truncate">
                                            Sub: {c.subject}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {campaigns.length === 0 && <p className="text-muted-foreground">No emails sent yet.</p>}
                    </div>
                </div>

                {/* --- RIGHT: EMAIL PREVIEW --- */}
                <div className="hidden lg:block">
                    <div className="sticky top-6">
                        <div className="bg-white rounded-xl border shadow-lg overflow-hidden h-[600px] flex flex-col">
                            {/* Fake Browser Header */}
                            <div className="bg-slate-100 border-b p-3 flex gap-2 items-center">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="bg-white flex-1 mx-4 rounded-md h-6 text-[10px] flex items-center px-2 text-muted-foreground shadow-sm">
                                    https://mail.google.com/...
                                </div>
                            </div>

                            {/* Email UI */}
                            <div className="flex-1 p-6 overflow-y-auto bg-white">
                                <div className="border-b pb-4 mb-6 space-y-2">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {subject || "New Message"}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[#906CDD] flex items-center justify-center text-white font-bold">V</div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">VoiceIntel <span className="text-slate-400 font-normal">&lt;admin@voiceintel.com&gt;</span></p>
                                            <p className="text-xs text-slate-500">to me</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Body Preview */}
                                <div
                                    className="prose prose-sm max-w-none text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: content.replace("{name}", "Sarah") }}
                                />
                            </div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-4">Desktop Preview</p>
                    </div>
                </div>

            </div>
        </div>
    );
}