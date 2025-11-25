"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bot, Mic, Save, Phone, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AgentClientView({ initialData, voices }: { initialData: any, voices: any[] }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [calling, setCalling] = useState(false);
    const [testPhone, setTestPhone] = useState("");

    // Form State
    const [name, setName] = useState(initialData?.name || "Front Desk AI");
    const [prompt, setPrompt] = useState(initialData?.system_prompt || "You are a helpful receptionist...");
    const [voice, setVoice] = useState(initialData?.voice_id || voices[0]?.voice_id);
    const [type, setType] = useState(initialData?.type || "inbound");

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/agent/save", {
                method: "POST",
                body: JSON.stringify({ name, system_prompt: prompt, voice_id: voice, type })
            });
            if (res.ok) {
                alert("Agent Saved Successfully!");
                router.refresh();
            } else {
                alert("Failed to save.");
            }
        } catch (e) { console.error(e) }
        setSaving(false);
    };

    const handleCallMe = async () => {
        if (!testPhone) return alert("Please enter a phone number");
        setCalling(true);
        try {
            const res = await fetch("/api/agent/call", {
                method: "POST",
                body: JSON.stringify({ to_number: testPhone })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Calling you now! Pick up your phone.");
            } else {
                alert(`Call Failed: ${data.error}`);
            }
        } catch (e) {
            alert("Call Failed");
        }
        setCalling(false);
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 h-full flex flex-col bg-gray-50/50">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI Voice Agent</h2>
                    <p className="text-muted-foreground">Configure how your AI speaks and behaves.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#906CDD] hover:bg-[#7a5bb5]">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-[#906CDD]" /> Agent Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Agent Name (Internal)</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>System Prompt (The Brain)</Label>
                                <p className="text-xs text-muted-foreground">
                                    Give the AI its personality, rules, and knowledge base.
                                </p>
                                <Textarea
                                    className="min-h-[200px] font-mono text-sm bg-slate-50"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="text-xs">
                                        <Sparkles className="mr-1 h-3 w-3" /> Generate Example
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mic className="h-5 w-5 text-blue-500" /> Voice Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Select Voice</Label>
                                <Select value={voice} onValueChange={setVoice}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a voice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {voices.map((v: any) => (
                                            <SelectItem key={v.voice_id} value={v.voice_id}>
                                                {v.voice_name} ({v.provider})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Call Type</Label>
                                <RadioGroup defaultValue={type} onValueChange={setType} className="flex gap-4">
                                    <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-slate-50">
                                        <RadioGroupItem value="inbound" id="r1" />
                                        <Label htmlFor="r1" className="cursor-pointer">Inbound</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md w-full cursor-pointer hover:bg-slate-50">
                                        <RadioGroupItem value="outbound" id="r2" />
                                        <Label htmlFor="r2" className="cursor-pointer">Outbound</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Preview/Testing */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none">
                        <CardHeader>
                            <CardTitle>Test Your Agent</CardTitle>
                            <CardDescription className="text-slate-400">
                                Enter your phone number to receive a test call.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="+1 555 000 0000"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                            <Button
                                onClick={handleCallMe}
                                disabled={calling}
                                className="w-full bg-white text-slate-900 hover:bg-gray-200"
                            >
                                {calling ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                        Calling...
                                    </>
                                ) : (
                                    <>
                                        <Phone className="mr-2 h-4 w-4" />
                                        Call Me Now
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-slate-500 text-center">
                                Requires a purchased number in Retell Dashboard.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• <strong>Be Specific:</strong> Tell the AI exactly what business it represents.</p>
                            <p>• <strong>Handle Errors:</strong> Tell it what to do if it doesn't know an answer.</p>
                            <p>• <strong>Goal:</strong> Define the goal of the call (e.g., "Book an appointment").</p>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}