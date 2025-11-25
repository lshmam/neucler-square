import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getMerchantInfo, getDailyStats } from "@/lib/square";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DollarSign,
    Users,
    Mic,
    Mail,
    MessageSquare,
    ArrowRight,
    Activity
} from "lucide-react";
import { SyncButton } from "@/components/SyncButton";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    const { data: profile } = await supabaseAdmin
        .from("business_profiles")
        .select("is_onboarding_completed")
        .eq("merchant_id", merchantId)
        .single();

    // If no profile OR onboarding is false -> Force Redirect
    if (!profile || !profile.is_onboarding_completed) {
        redirect("/onboarding");
    }

    // 1. Fetch Merchant Credentials
    const { data: merchant } = await supabaseAdmin
        .from("merchants")
        .select("access_token, business_name")
        .eq("platform_merchant_id", merchantId)
        .single();

    if (!merchant) redirect("/");

    const accessToken = merchant.access_token;

    // 2. Fetch Real Data in Parallel (Square + Supabase Stats)
    const [squareStats, customerCount, agentCount, campaignStats] = await Promise.all([
        // A. Real Daily Revenue from Square
        getDailyStats(merchantId, accessToken),

        // B. Total CRM Customers from Supabase
        supabaseAdmin
            .from("customers")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", merchantId),

        // C. Active AI Agents
        supabaseAdmin
            .from("ai_agents")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", merchantId),

        // D. Recent Email Campaign Stats
        supabaseAdmin
            .from("email_campaigns")
            .select("sent_count")
            .eq("merchant_id", merchantId)
            .eq("status", "sent")
    ]);

    const totalCustomers = customerCount.count || 0;
    const activeAgents = agentCount.count || 0;
    const totalEmailsSent = campaignStats.data?.reduce((acc, curr) => acc + (curr.sent_count || 0), 0) || 0;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* HEADER */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Welcome back, {merchant.business_name || "Merchant"}
                    </h2>
                    <p className="text-muted-foreground">
                        Here is what's happening with your business today.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <SyncButton />
                </div>
            </div>

            {/* TOP ROW: KEY METRICS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Revenue - Real Data */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${squareStats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {squareStats.count} orders processed today
                        </p>
                    </CardContent>
                </Card>

                {/* Customers - Real DB Count */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            Synced from Square
                        </p>
                    </CardContent>
                </Card>

                {/* AI Agent Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Receptionist</CardTitle>
                        <Mic className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeAgents > 0 ? "Active" : "Inactive"}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeAgents} Voice Agent(s) configured
                        </p>
                    </CardContent>
                </Card>

                {/* Campaign Reach */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campaign Reach</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEmailsSent}</div>
                        <p className="text-xs text-muted-foreground">
                            Emails sent this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* MIDDLE ROW: FEATURE SNAPSHOTS / NAVIGATION */}
            <h3 className="text-lg font-semibold mt-6">Quick Access</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {/* 1. AI AGENT CARD */}
                <Link href="/ai-agent">
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-indigo-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">AI Voice Agent</CardTitle>
                                <Mic className="h-5 w-5 text-indigo-500" />
                            </div>
                            <CardDescription>
                                Manage your phone receptionist, update system prompts, and view call logs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="w-full justify-start pl-0 hover:bg-transparent text-indigo-600">
                                Configure Agent <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* 2. SMS CAMPAIGNS CARD */}
                <Link href="/communications">
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-green-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">SMS Marketing</CardTitle>
                                <MessageSquare className="h-5 w-5 text-green-500" />
                            </div>
                            <CardDescription>
                                Send text blasts to loyal customers or automate appointment reminders.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="w-full justify-start pl-0 hover:bg-transparent text-green-600">
                                View Inbox & Campaigns <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                {/* 3. EMAIL MARKETING CARD */}
                <Link href="/communications">
                    <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Email Campaigns</CardTitle>
                                <Mail className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardDescription>
                                Create newsletters and promotional offers for your VIP customers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" className="w-full justify-start pl-0 hover:bg-transparent text-blue-600">
                                Create Campaign <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}