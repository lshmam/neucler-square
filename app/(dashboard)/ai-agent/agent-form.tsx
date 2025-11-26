"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, Phone, Clock, User, Mic, Save, Loader2, Sparkles, Hash } from "lucide-react";
import { saveAgentConfig, purchaseNumber } from "@/app/actions/agent";
import { toast } from "sonner"; // Use toast for feedback

// Production Voices (11Labs IDs usually supported by Retell)
// Ensure these IDs exist in your Retell Dashboard or 11Labs account linked to Retell
const VOICES = [
    { id: "11labs-Adrian", name: "Adrian", gender: "Male", style: "Deep & Professional", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/adrian.wav" },
    { id: "11labs-Sarah", name: "Sarah", gender: "Female", style: "Soft & Friendly", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/sarah.wav" },
    { id: "openai-Alloy", name: "Alloy", gender: "Neutral", style: "Clear & Efficient", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/alloy.wav" },
    { id: "openai-Nova", name: "Nova", gender: "Female", style: "Energetic", sample: "https://retell-utils-public.s3.us-west-2.amazonaws.com/nova.wav" },
];

export function AgentConfigForm({ merchantId, initialData, businessProfile }: any) {
    const [loading, setLoading] = useState(false);
    const [buyingNumber, setBuyingNumber] = useState(false);
    const [areaCode, setAreaCode] = useState("");
    const [playingVoice, setPlayingVoice] = useState<HTMLAudioElement | null>(null);

    const [config, setConfig] = useState({
        name: initialData?.name || businessProfile?.ai_name || "Alex",
        voiceId: initialData?.voice_id || "11labs-Sarah",
        phoneNumber: initialData?.phone_number || "", // Fetched from DB
        openingGreeting: initialData?.opening_greeting || `Thanks for calling ${businessProfile?.business_name || 'us'}, how can I help?`,
        pickupBehavior: initialData?.pickup_behavior || "immediate",
        systemPrompt: initialData?.system_prompt || ""
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await saveAgentConfig(merchantId, config);
            if (!res.success) throw new Error(res.error);
            alert("Agent Synced with Retell successfully!");
        } catch (e: any) {
            console.error(e);
            alert(`Sync Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNumber = async () => {
        if (areaCode.length !== 3) return alert("Please enter a 3-digit area code");
        setBuyingNumber(true);
        try {
            const res = await purchaseNumber(merchantId, parseInt(areaCode));
            if (!res.success) throw new Error(res.error);

            setConfig(prev => ({ ...prev, phoneNumber: res.number }));
            alert(`Success! Acquired ${res.number}`);
        } catch (e: any) {
            alert(`Failed to buy number: ${e.message}`);
        } finally {
            setBuyingNumber(false);
        }
    };

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

    return (
        <div className="grid gap-6 lg:grid-cols-2 pb-12">

            {/* LEFT COLUMN: IDENTITY & VOICE */}
            <div className="space-y-6">
                <Card className="border-t-4 border-t-indigo-500 shadow-sm">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="h-5 w-5 text-indigo-600" />
                            <h3 className="font-bold text-lg">Agent Persona</h3>
                        </div>

                        <div className="space-y-2">
                            <Label>Agent Name</Label>
                            <Input
                                value={config.name}
                                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Select Voice</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {VOICES.map((voice) => (
                                    <div
                                        key={voice.id}
                                        onClick={() => setConfig({ ...config, voiceId: voice.id })}
                                        className={`cursor-pointer border rounded-lg p-3 flex items-center justify-between transition-all ${config.voiceId === voice.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'hover:bg-slate-50'}`}
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{voice.name}</div>
                                            <div className="text-xs text-muted-foreground">{voice.style}</div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full hover:bg-white"
                                            onClick={(e) => { e.stopPropagation(); toggleAudio(voice.sample); }}
                                        >
                                            {playingVoice && playingVoice.src === voice.sample ? <Pause className="h-4 w-4 text-indigo-600" /> : <Play className="h-4 w-4 text-slate-600" />}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-5 w-5 text-emerald-600" />
                            <h3 className="font-bold text-lg">Phone Line</h3>
                        </div>

                        <div className="space-y-2">
                            <Label>Assigned Number</Label>
                            <div className="flex gap-2">
                                <Input
                                    disabled
                                    value={config.phoneNumber || "No number assigned"}
                                    className="font-mono bg-slate-50"
                                />

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="shrink-0">
                                            <Hash className="mr-2 h-4 w-4" />
                                            {config.phoneNumber ? "Change" : "Get Number"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Provision Phone Number</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <p className="text-sm text-muted-foreground">
                                                This will purchase a real phone number from Retell/Twilio and link it to this AI Agent.
                                            </p>
                                            <div className="space-y-2">
                                                <Label>Preferred Area Code</Label>
                                                <Input
                                                    placeholder="e.g. 415"
                                                    value={areaCode}
                                                    onChange={(e) => setAreaCode(e.target.value)}
                                                    maxLength={3}
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={handleBuyNumber}
                                                disabled={buyingNumber || areaCode.length < 3}
                                            >
                                                {buyingNumber ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Purchase & Assign ($1/mo)"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: BRAIN */}
            <div className="space-y-6">
                <Card className="h-full flex flex-col border-t-4 border-t-amber-500 shadow-sm">
                    <CardContent className="pt-6 flex-1 flex flex-col space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                            <h3 className="font-bold text-lg">Knowledge & Script</h3>
                        </div>

                        <div className="space-y-2">
                            <Label>Opening Greeting</Label>
                            <Textarea
                                className="h-24 resize-none"
                                value={config.openingGreeting}
                                onChange={(e) => setConfig({ ...config, openingGreeting: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">What the AI says immediately when picking up.</p>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label className="flex justify-between items-center">
                                <span>System Prompt</span>
                                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">Live Sync Active</span>
                            </Label>

                            <div className="border rounded-md flex-1 flex flex-col bg-slate-50 overflow-hidden">
                                {/* Auto-injected context visualization */}
                                <div className="bg-slate-100 p-3 border-b text-xs text-slate-500 font-mono space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        <span>Syncing Hours from Business Profile...</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-3 w-3" />
                                        <span>Syncing Services & Pricing...</span>
                                    </div>
                                </div>

                                <Textarea
                                    className="flex-1 border-0 focus-visible:ring-0 rounded-none resize-none p-4 font-mono text-sm"
                                    placeholder="Add custom instructions here (e.g., 'If asked about parking, say we have a valet')..."
                                    value={config.systemPrompt}
                                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FOOTER */}
            <div className="lg:col-span-2 sticky bottom-4 z-10">
                <div className="bg-white/80 backdrop-blur border p-4 rounded-xl shadow-2xl flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold">Unsaved Changes</h4>
                        <p className="text-xs text-muted-foreground">Sync required to update live agent.</p>
                    </div>
                    <Button size="lg" onClick={handleSave} disabled={loading} className="shadow-lg hover:shadow-xl transition-all">
                        {loading ? (
                            <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Syncing with Retell...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Deploy to Production</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}