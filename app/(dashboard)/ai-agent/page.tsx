import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { VoiceSetupWizard } from "./setup-wizard";
import { AgentConfigForm } from "./agent-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Mic, Settings, PhoneForwarded, Hash } from "lucide-react";
import Link from "next/link";

export default async function AIAgentPage({ searchParams }: { searchParams: { action?: string, id?: string } }) {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    const { action, id: agentId } = await searchParams;

    // 1. Fetch Context
    const { data: merchant } = await supabaseAdmin.from("merchants").select("business_name").eq("platform_merchant_id", merchantId).single();
    const { data: profile } = await supabaseAdmin.from("business_profiles").select("*").eq("merchant_id", merchantId).single();

    // 2. Fetch ALL Agents
    const { data: agents } = await supabaseAdmin
        .from("ai_agents")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });

    if (!profile) redirect("/onboarding");

    // --- VIEW 1: CREATE NEW AGENT (Wizard) ---
    if (action === "new") {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="p-4">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/ai-agent">← Back to Dashboard</Link>
                    </Button>
                </div>
                <VoiceSetupWizard
                    merchantId={merchantId}
                    businessProfile={{ ...profile, business_name: merchant?.business_name }}
                />
            </div>
        );
    }

    // --- VIEW 2: EDIT AGENT (Studio) ---
    if (agentId) {
        const selectedAgent = agents?.find(a => a.id === agentId);
        if (!selectedAgent) redirect("/ai-agent"); // Invalid ID

        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Voice Agent Studio</h2>
                        <p className="text-muted-foreground">Editing: {selectedAgent.name}</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/ai-agent">Close Studio</Link>
                    </Button>
                </div>
                <AgentConfigForm
                    merchantId={merchantId}
                    initialData={selectedAgent}
                    businessProfile={{ ...profile, business_name: merchant?.business_name }}
                    agentId={selectedAgent.id}
                />
            </div>
        );
    }

    // --- VIEW 3: AGENT LIST (Dashboard) ---
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI Voice Agents</h2>
                    <p className="text-muted-foreground">Manage your phone receptionists.</p>
                </div>
                <Button asChild>
                    <Link href="/ai-agent?action=new"><Plus className="mr-2 h-4 w-4" /> Create Agent</Link>
                </Button>
            </div>

            {(!agents || agents.length === 0) ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border-dashed border-2">
                    <Mic className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Agents Deployed</h3>
                    <p className="text-muted-foreground mb-6">Set up your first AI receptionist to handle calls.</p>
                    <Button asChild>
                        <Link href="/ai-agent?action=new">Launch Setup Wizard</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => (
                        <Link key={agent.id} href={`/ai-agent?id=${agent.id}`}>
                            <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                                    {agent.phone_mode === 'forwarding'
                                        ? <PhoneForwarded className="h-4 w-4 text-blue-500" />
                                        : <Hash className="h-4 w-4 text-green-500" />
                                    }
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {agent.opening_greeting}
                                    </p>
                                    <div className="flex items-center justify-between text-xs font-mono bg-muted p-2 rounded">
                                        <span>{agent.phone_number || "No # Assigned"}</span>
                                        <span className="uppercase text-muted-foreground">{agent.phone_mode}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {/* Quick Add Card */}
                    <Link href="/ai-agent?action=new">
                        <Card className="h-full border-dashed flex flex-col items-center justify-center p-6 hover:bg-muted/50 transition-colors">
                            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="font-medium text-muted-foreground">Add Another Agent</span>
                        </Card>
                    </Link>
                </div>
            )}
        </div>
    );
}