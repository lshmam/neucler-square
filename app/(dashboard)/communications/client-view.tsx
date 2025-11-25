"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Phone, Mail, MessageSquare, PlayCircle, Clock,
    Search, Send, Plus, MoreVertical,
    Bot, Filter, Loader2, Radio
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
type CallLog = any;
type SmsLog = any;
type EmailCampaign = any;

interface CommunicationsClientProps {
    calls: CallLog[];
    messages: SmsLog[];
    campaigns: EmailCampaign[]; // Added campaigns prop
}

export function CommunicationsClient({ calls, messages, campaigns }: CommunicationsClientProps) {
    const router = useRouter();

    // UI State
    const [selectedSmsId, setSelectedSmsId] = useState<string | null>(messages[0]?.id || null);
    const [activeTab, setActiveTab] = useState("calls");
    const [isCampaignSheetOpen, setIsCampaignSheetOpen] = useState(false);
    const [sending, setSending] = useState(false);

    // Campaign Form State
    const [campaignTitle, setCampaignTitle] = useState("");
    const [campaignSubject, setCampaignSubject] = useState("");
    const [campaignAudience, setCampaignAudience] = useState("all");
    const [campaignContent, setCampaignContent] = useState("");

    // Helper to format dates consistently (prevents Hydration errors)
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
        });
    };

    const handleSendCampaign = async () => {
        setSending(true);
        try {
            const res = await fetch("/api/campaigns/send", {
                method: "POST",
                body: JSON.stringify({
                    title: campaignTitle,
                    subject: campaignSubject,
                    audience: campaignAudience,
                    content: campaignContent
                })
            });

            if (res.ok) {
                alert("Campaign Sent Successfully!");
                setIsCampaignSheetOpen(false);
                // Reset form
                setCampaignTitle("");
                setCampaignSubject("");
                setCampaignContent("");
                // Refresh the page to show the new campaign in the list
                router.refresh();
            } else {
                alert("Failed to send.");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred.");
        }
        setSending(false);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Communications</h2>
                    <p className="text-muted-foreground">
                        Central command for Calls, SMS, Email, and AI interactions.
                    </p>
                </div>
                <Button className="bg-[#906CDD] hover:bg-[#7a5bb5]">
                    <Plus className="mr-2 h-4 w-4" /> New Message
                </Button>
            </div>

            <Tabs defaultValue="calls" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="shrink-0">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                        <TabsTrigger value="calls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#906CDD] px-6 py-3">AI Calls</TabsTrigger>
                        <TabsTrigger value="sms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#906CDD] px-6 py-3">SMS Conversations</TabsTrigger>
                        <TabsTrigger value="email" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#906CDD] px-6 py-3">Email Campaigns</TabsTrigger>
                        <TabsTrigger value="broadcasts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#906CDD] px-6 py-3">Broadcasts</TabsTrigger>
                        <TabsTrigger value="ai-chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#906CDD] px-6 py-3">AI Chat Assistant</TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB 1: AI CALLS --- */}
                <TabsContent value="calls" className="flex-1 overflow-auto p-1">
                    <Card className="h-full border-none shadow-none">
                        <div className="flex items-center gap-4 py-4">
                            <Input placeholder="Search calls..." className="max-w-sm" />
                            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Transcript Preview</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calls.map((call) => (
                                        <TableRow key={call.call_id}>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">Inbound</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{call.customer_phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={call.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                                    {call.call_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                                {call.transcript || "No transcript available..."}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(call.start_timestamp)}
                                            </TableCell>
                                            <TableCell>
                                                {Math.round(call.duration_ms / 1000)}s
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Sheet>
                                                    <SheetTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-[#906CDD]">View Details</Button>
                                                    </SheetTrigger>
                                                    <SheetContent className="w-[400px] sm:w-[540px]">
                                                        <SheetHeader>
                                                            <SheetTitle>Call Details</SheetTitle>
                                                            <SheetDescription>
                                                                Recorded on {formatDate(call.start_timestamp)}
                                                            </SheetDescription>
                                                        </SheetHeader>
                                                        <div className="py-6 space-y-6">
                                                            {/* Audio Player Mock */}
                                                            <div className="bg-slate-50 p-4 rounded-lg border">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-medium">Audio Recording</span>
                                                                    <span className="text-xs text-muted-foreground">{Math.round(call.duration_ms / 1000)}s</span>
                                                                </div>
                                                                <div className="h-8 bg-slate-200 rounded-full w-full relative overflow-hidden">
                                                                    <div className="absolute left-0 top-0 bottom-0 bg-[#906CDD] w-1/3 opacity-50"></div>
                                                                    <PlayCircle className="absolute left-2 top-1.5 h-5 w-5 text-slate-700" />
                                                                </div>
                                                            </div>

                                                            {/* Transcript */}
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Transcript</h4>
                                                                <ScrollArea className="h-[300px] w-full rounded-md border p-4 text-sm text-muted-foreground">
                                                                    {call.transcript ? call.transcript : "Transcript generating..."}
                                                                </ScrollArea>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex gap-2">
                                                                <Button className="flex-1 bg-[#906CDD]"><MessageSquare className="mr-2 h-4 w-4" /> Send SMS Follow-up</Button>
                                                                <Button variant="outline" className="flex-1">Flag for Review</Button>
                                                            </div>
                                                        </div>
                                                    </SheetContent>
                                                </Sheet>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 2: SMS CONVERSATIONS --- */}
                <TabsContent value="sms" className="flex-1 overflow-hidden border rounded-lg">
                    <div className="grid grid-cols-12 h-full bg-white">
                        {/* LEFT PANEL: List */}
                        <div className="col-span-4 border-r flex flex-col">
                            <div className="p-4 border-b">
                                <Input placeholder="Search messages..." />
                            </div>
                            <ScrollArea className="flex-1">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => setSelectedSmsId(msg.id)}
                                        className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${selectedSmsId === msg.id ? 'bg-purple-50 border-l-4 border-l-[#906CDD]' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold">Customer</span>
                                            <span className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{msg.description}</p>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No messages found.
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* RIGHT PANEL: Chat View */}
                        <div className="col-span-8 flex flex-col h-full">
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback className="bg-slate-200">JD</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-sm">Jane Doe</h3>
                                        <p className="text-xs text-muted-foreground">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </div>

                            <ScrollArea className="flex-1 p-4 bg-slate-50/30">
                                <div className="space-y-4">
                                    <div className="flex justify-end">
                                        <div className="bg-[#906CDD] text-white rounded-l-lg rounded-tr-lg p-3 max-w-[70%] text-sm">
                                            Hi Jane! It looks like it's been 4 weeks since your last cut. Want to book for this week?
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-white border text-gray-800 rounded-r-lg rounded-tl-lg p-3 max-w-[70%] text-sm shadow-sm">
                                            Yes, please reschedule my appointment to next Tuesday at 2pm.
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-white">
                                <div className="flex gap-2 mb-2 overflow-x-auto">
                                    <Badge variant="outline" className="cursor-pointer hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">Confirm Appointment</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Textarea placeholder="Type a message..." className="min-h-[60px]" />
                                    <Button className="h-auto bg-[#906CDD] hover:bg-[#7a5bb5]"><Send className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB 3: EMAIL CAMPAIGNS --- */}
                <TabsContent value="email" className="space-y-4 overflow-auto p-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Recent Campaigns</h3>

                        {/* CREATE CAMPAIGN SHEET */}
                        <Sheet open={isCampaignSheetOpen} onOpenChange={setIsCampaignSheetOpen}>
                            <SheetTrigger asChild>
                                <Button className="bg-[#906CDD] hover:bg-[#7a5bb5]">
                                    <Plus className="mr-2 h-4 w-4" /> Create Campaign
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>New Email Campaign</SheetTitle>
                                    <SheetDescription>
                                        Design and send a broadcast to your customers.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-6 py-6">
                                    <div className="space-y-2">
                                        <Label>Campaign Name (Internal)</Label>
                                        <Input
                                            placeholder="e.g. October Newsletter"
                                            value={campaignTitle}
                                            onChange={(e) => setCampaignTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Audience</Label>
                                        <Select value={campaignAudience} onValueChange={setCampaignAudience}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select audience" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Customers</SelectItem>
                                                <SelectItem value="vip">VIPs (&gt; $500 spend)</SelectItem>
                                                <SelectItem value="new">New Customers (1 visit)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label>Subject Line</Label>
                                        <Input
                                            placeholder="e.g. You deserve a treat!"
                                            value={campaignSubject}
                                            onChange={(e) => setCampaignSubject(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email Content (HTML)</Label>
                                        <Textarea
                                            className="min-h-[200px] font-mono text-sm"
                                            placeholder="<p>Hey there,</p>..."
                                            value={campaignContent}
                                            onChange={(e) => setCampaignContent(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Basic HTML tags are supported.</p>
                                    </div>

                                    <Button
                                        className="w-full bg-[#906CDD] hover:bg-[#7a5bb5]"
                                        onClick={handleSendCampaign}
                                        disabled={sending}
                                    >
                                        {sending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                                        {sending ? "Sending..." : "Send Campaign Now"}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Campaign Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {campaigns.length === 0 && (
                            <div className="col-span-3 text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                                No campaigns sent yet. Create one to get started.
                            </div>
                        )}

                        {campaigns.map((c) => (
                            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Badge variant={c.status === 'sent' ? 'default' : 'outline'} className={c.status === 'sent' ? 'bg-green-600' : ''}>
                                            {c.status}
                                        </Badge>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </div>
                                    <CardTitle className="text-lg">{c.name}</CardTitle>
                                    <CardDescription>
                                        Sent {formatDate(c.created_at)} • {c.sent_count} Recipients
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div>
                                            <div className="text-xl font-bold">--%</div>
                                            <div className="text-xs text-muted-foreground">Open Rate</div>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold">--%</div>
                                            <div className="text-xs text-muted-foreground">Click Rate</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- TAB 4: BROADCASTS --- */}
                <TabsContent value="broadcasts" className="space-y-4 overflow-auto p-1">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Broadcast History</CardTitle>
                                    <CardDescription>Mass announcements sent via SMS, Email, or Voice.</CardDescription>
                                </div>
                                <Button><Radio className="mr-2 h-4 w-4" /> Create Broadcast</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Channel</TableHead>
                                        <TableHead>Audience</TableHead>
                                        <TableHead>Sent Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Holiday Hours Update</TableCell>
                                        <TableCell><div className="flex items-center gap-2"><MessageSquare className="h-3 w-3" /> SMS</div></TableCell>
                                        <TableCell>All Customers (540)</TableCell>
                                        <TableCell>Dec 20, 2024</TableCell>
                                        <TableCell><Badge className="bg-green-100 text-green-800">Completed</Badge></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 5: AI CHAT ASSISTANT --- */}
                <TabsContent value="ai-chat" className="flex-1 overflow-hidden border rounded-lg bg-slate-50">
                    <div className="grid grid-cols-12 h-full">
                        <div className="col-span-3 border-r bg-white p-4 space-y-4">
                            <h3 className="font-semibold mb-4">AI Chat Logs</h3>
                            <div className="space-y-2">
                                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-medium text-sm">Booking Inquiry</span>
                                        <span className="text-[10px] text-muted-foreground">2m ago</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">Customer asked about availability...</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-9 p-8 flex flex-col items-center justify-center text-center">
                            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">Select a conversation</h3>
                            <p className="text-muted-foreground max-w-md">
                                Review how your AI Assistant interacts with customers. You can flag responses to improve training.
                            </p>
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}