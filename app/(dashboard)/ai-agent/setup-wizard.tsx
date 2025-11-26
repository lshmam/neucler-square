"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mic, Phone, Sparkles, Play, Pause, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Hash } from "lucide-react";
import { saveAgentConfig, purchaseNumber } from "@/app/actions/agent";

// Voices Constant
const VOICES = [
    { id: "11labs-Sarah", name: "Sarah", gender: "Female", style: "Soft & Friendly", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/sarah.wav" },
    { id: "11labs-Adrian", name: "Adrian", gender: "Male", style: "Deep & Professional", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/adrian.wav" },
    { id: "openai-Alloy", name: "Alloy", gender: "Neutral", style: "Clear & Efficient", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/alloy.wav" },
    { id: "openai-Nova", name: "Nova", gender: "Female", style: "Energetic", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/nova.wav" },
];

export function VoiceSetupWizard({ merchantId, businessProfile }: { merchantId: string, businessProfile: any }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [playingVoice, setPlayingVoice] = useState<HTMLAudioElement | null>(null);

    // Phone Provisioning State
    const [buyingNumber, setBuyingNumber] = useState(false);
    const [areaCode, setAreaCode] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    const [config, setConfig] = useState({
        name: businessProfile?.ai_name || "Alex",
        voiceId: "11labs-Sarah",
        phoneNumber: "",
        openingGreeting: `Thanks for calling ${businessProfile?.business_name || 'us'}, how can I help?`,
        pickupBehavior: "immediate",
        systemPrompt: "" // User custom instructions
    });

    // --- HANDLERS ---

    const toggleAudio = (sampleUrl: string) => {
        if (playingVoice) {
            playingVoice.pause();
            setPlayingVoice(null);
        } else {
            const audio = new Audio(sampleUrl);
            audio.play();
            setPlayingVoice(audio);
            audio.onended = () => setPlayingVoice(null);
        }
    };

    const handleBuyNumber = async () => {
        if (areaCode.length !== 3) return alert("Enter a 3-digit area code");
        setBuyingNumber(true);
        try {
            // We pass a dummy agentId here because we haven't created one yet. 
            // In a real flow, you might create the agent first in background, 
            // or modify purchaseNumber to support "unassigned" numbers. 
            // For this demo, let's assume purchaseNumber handles logic to hold it.
            // NOTE: Ideally, create agent in Step 4, then assign number. 
            // We will just simulate getting the number string for UI here.
            const res = await purchaseNumber(merchantId, parseInt(areaCode));
            if (!res.success) throw new Error(res.error);

            setConfig(prev => ({ ...prev, phoneNumber: res.number }));
            setDialogOpen(false);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setBuyingNumber(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const res = await saveAgentConfig(merchantId, config);
            if (!res.success) throw new Error(res.error);
            router.refresh(); // Refresh to show Dashboard/Studio view
        } catch (e: any) {
            alert(e.message);
            setLoading(false);
        }
    };

    // --- STEPS ---

    // Header Helper
    const WizardHeader = ({ title, icon: Icon }: any) => (
        <div className="mb-6">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Step {step} of 4</div>
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg"><Icon className="h-6 w-6 text-primary" /></div>
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">

            {/* STEP 1: IDENTITY */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <WizardHeader title="Choose Your Voice" icon={User} />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Agent Name</Label>
                            <Input
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                placeholder="e.g. Alex"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {VOICES.map((voice) => (
                                <Card
                                    key={voice.id}
                                    onClick={() => setConfig({ ...config, voiceId: voice.id })}
                                    className={`cursor-pointer transition-all hover:shadow-md ${config.voiceId === voice.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold">{voice.name}</div>
                                            <div className="text-sm text-muted-foreground">{voice.style}</div>
                                        </div>
                                        <Button
                                            size="icon" variant="ghost" className="rounded-full"
                                            onClick={(e) => { e.stopPropagation(); toggleAudio(voice.sample); }}
                                        >
                                            {playingVoice && playingVoice.src === voice.sample ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: BEHAVIOR */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <WizardHeader title="Call Handling" icon={Phone} />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Opening Greeting</Label>
                            <Textarea
                                value={config.openingGreeting}
                                onChange={(e) => setConfig({ ...config, openingGreeting: e.target.value })}
                                className="resize-none h-24 text-lg"
                            />
                            <p className="text-xs text-muted-foreground">The very first thing the AI says when picking up.</p>
                        </div>

                        <Card className="bg-slate-50">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">Phone Number</div>
                                    <div className="text-sm text-muted-foreground">
                                        {config.phoneNumber || "No number assigned yet"}
                                    </div>
                                </div>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant={config.phoneNumber ? "outline" : "default"}>
                                            {config.phoneNumber ? "Change Number" : "Get Number"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Get a dedicated line</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Area Code</Label>
                                                <Input placeholder="e.g. 415" value={areaCode} onChange={e => setAreaCode(e.target.value)} maxLength={3} />
                                            </div>
                                            <Button className="w-full" onClick={handleBuyNumber} disabled={buyingNumber}>
                                                {buyingNumber ? <Loader2 className="animate-spin mr-2" /> : "Purchase ($1/mo)"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-between border rounded-lg p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Pickup Delay</Label>
                                <p className="text-xs text-muted-foreground">Wait 15s to let you answer first?</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Instant</span>
                                <Switch
                                    checked={config.pickupBehavior === 'delay_15s'}
                                    onCheckedChange={(c) => setConfig({ ...config, pickupBehavior: c ? 'delay_15s' : 'immediate' })}
                                />
                                <span className="text-xs font-medium">Wait 15s</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: KNOWLEDGE */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <WizardHeader title="Train the Brain" icon={Sparkles} />

                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                            <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
                            <div className="text-sm text-blue-800">
                                <strong>Auto-Training Active:</strong> We have automatically fed your business hours, services, and website info into the AI.
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Custom Instructions</Label>
                            <Textarea
                                className="min-h-[200px] font-mono text-sm"
                                placeholder="e.g. If someone asks for parking, tell them we have a validation lot in the back..."
                                value={config.systemPrompt}
                                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Add specific rules or edge cases here.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <div className="text-center mb-8">
                        <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold">Ready to Deploy</h2>
                        <p className="text-muted-foreground mt-2">Review your settings before going live.</p>
                    </div>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Agent Name</span>
                                <span className="font-medium">{config.name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Voice Model</span>
                                <span className="font-medium">{config.voiceId}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Phone Number</span>
                                <span className="font-medium font-mono">{config.phoneNumber || "Not Assigned"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-muted-foreground">Greeting</span>
                                <span className="font-medium italic truncate max-w-[200px]">{config.openingGreeting}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* FOOTER NAV */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:static md:bg-transparent md:border-0 md:p-0 md:mt-10">
                <div className="max-w-3xl mx-auto flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 1}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    {step < 4 ? (
                        <Button onClick={() => setStep(s => s + 1)}>
                            Next Step <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button size="lg" onClick={handleFinish} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Deploy Agent
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}