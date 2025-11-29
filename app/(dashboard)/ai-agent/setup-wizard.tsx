"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, User, Phone, ArrowRight, Loader2, PhoneIncoming, PhoneOutgoing, Globe } from "lucide-react";
import { saveAgentConfig } from "@/app/actions/agent";
import { LANGUAGE_OPTIONS } from "./language-data"; // We will create this file next

export function VoiceSetupWizard({ merchantId, businessProfile }: { merchantId: string, businessProfile: any }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        agentName: "Alex",
        voiceGender: "female",
        voiceVibe: "friendly",
        language: "en-US", // Default to US English
        type: "inbound",   // 'inbound' or 'outbound'
        handoffNumber: businessProfile?.phone || "",
        areaCode: "415",
        specialInstructions: "",
        greeting: `Thanks for calling ${businessProfile?.business_name}, how can I help?`
    });

    // --- SUBMIT HANDLER ---
    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Construct the config object to match the new Server Action
            const config = {
                name: formData.agentName,
                // Map gender to a specific placeholder voice ID
                voiceId: formData.voiceGender === 'female' ? '11labs-Sarah' : '11labs-Adrian',
                openingGreeting: formData.greeting,

                // Pass raw data for the new columns
                language: formData.language,
                voiceGender: formData.voiceGender,
                voiceVibe: formData.voiceVibe,
                type: formData.type,
                handoffNumber: formData.handoffNumber,
                areaCode: formData.areaCode, // crucial for desired_area_code
                specialInstructions: formData.specialInstructions
            };

            await saveAgentConfig(merchantId, config);
            setStep(4);
        } catch (error) {
            alert("Failed to save request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">

            {/* Progress Bar */}
            <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-2 rounded-full transition-all ${step === i ? "bg-primary w-12" : "bg-muted w-2"}`} />
                ))}
            </div>

            {/* STEP 1: IDENTITY & LANGUAGE */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Identity & Language</CardTitle>
                        <CardDescription>Define the persona and language of your AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label>Agent Name</Label>
                                <Input value={formData.agentName} onChange={e => setFormData({ ...formData, agentName: e.target.value })} />
                            </div>

                            <div className="space-y-3">
                                <Label>Primary Language</Label>
                                <Select value={formData.language} onValueChange={(val) => setFormData({ ...formData, language: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {LANGUAGE_OPTIONS.map((lang) => (
                                            <SelectItem key={lang.value} value={lang.value}>
                                                <div className="flex items-center gap-2">
                                                    {lang.flag}
                                                    <span className="text-sm font-medium">{lang.label}</span>
                                                    <span className="text-xs text-muted-foreground">{lang.region}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Voice Gender</Label>
                            <RadioGroup defaultValue={formData.voiceGender} onValueChange={v => setFormData({ ...formData, voiceGender: v })} className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="female" id="female" className="peer sr-only" />
                                    <Label htmlFor="female" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer">
                                        <User className="mb-2 h-6 w-6 text-pink-500" />
                                        Female
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="male" id="male" className="peer sr-only" />
                                    <Label htmlFor="male" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer">
                                        <User className="mb-2 h-6 w-6 text-blue-500" />
                                        Male
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label>Personality Vibe</Label>
                            <RadioGroup defaultValue={formData.voiceVibe} onValueChange={v => setFormData({ ...formData, voiceVibe: v })} className="grid grid-cols-3 gap-4">
                                {['friendly', 'professional', 'energetic'].map((vibe) => (
                                    <div key={vibe}>
                                        <RadioGroupItem value={vibe} id={vibe} className="peer sr-only" />
                                        <Label htmlFor={vibe} className="block text-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer capitalize">
                                            {vibe}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={() => setStep(2)}>Next Step <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                </Card>
            )}

            {/* STEP 2: TYPE, ROUTING & PHONE */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Call Handling</CardTitle>
                        <CardDescription>How should this agent interact with calls?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* INBOUND VS OUTBOUND */}
                        <div className="space-y-3">
                            <Label>Agent Function</Label>
                            <RadioGroup defaultValue={formData.type} onValueChange={v => setFormData({ ...formData, type: v })} className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="inbound" id="inbound" className="peer sr-only" />
                                    <Label htmlFor="inbound" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer">
                                        <PhoneIncoming className="mb-2 h-6 w-6 text-green-600" />
                                        Inbound Receptionist
                                        <span className="text-[10px] text-muted-foreground mt-1 text-center font-normal">Answers calls, books appointments, answers FAQs.</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="outbound" id="outbound" className="peer sr-only" />
                                    <Label htmlFor="outbound" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer">
                                        <PhoneOutgoing className="mb-2 h-6 w-6 text-blue-600" />
                                        Outbound Caller
                                        <span className="text-[10px] text-muted-foreground mt-1 text-center font-normal">Calls leads, confirms bookings, follows up.</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label>Preferred Area Code</Label>
                            <Input
                                placeholder="e.g. 415"
                                maxLength={3}
                                value={formData.areaCode}
                                onChange={e => setFormData({ ...formData, areaCode: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                We will purchase a dedicated line for your AI in this area code.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label>Fallback Number</Label>
                            <Input
                                placeholder="Your personal cell or back office line"
                                value={formData.handoffNumber}
                                onChange={e => setFormData({ ...formData, handoffNumber: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                If the AI cannot help the user, it will attempt to transfer the call here.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={() => setStep(3)}>Next Step <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                </Card>
            )}

            {/* STEP 3: SCRIPTING */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Final Touches</CardTitle>
                        <CardDescription>Customize what the agent says.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Opening Greeting</Label>
                            <Textarea
                                className="h-20"
                                value={formData.greeting}
                                onChange={e => setFormData({ ...formData, greeting: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.type === 'inbound'
                                    ? "What the AI says immediately when it picks up."
                                    : "What the AI says immediately when the customer answers."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label>Special Instructions (Optional)</Label>
                            <Textarea
                                className="h-32"
                                placeholder="e.g. We are closed for lunch from 12-1pm. Don't book appointments then."
                                value={formData.specialInstructions}
                                onChange={e => setFormData({ ...formData, specialInstructions: e.target.value })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Submit Request
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
                <div className="text-center py-10 space-y-6">
                    <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold">Request Received!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        We are provisioning your <strong>{formData.language}</strong> speaking <strong>{formData.type}</strong> agent now.
                        <br /><br />
                        You will be notified when your dedicated number ({formData.areaCode}-XXX-XXXX) is live.
                    </p>
                    <Button variant="outline" onClick={() => router.push('/ai-agent')}>Return to Dashboard</Button>
                </div>
            )}

        </div>
    );
}