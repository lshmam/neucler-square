"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, User, Phone, FileText, ArrowRight, Loader2 } from "lucide-react";
import { saveAgentConfig } from "@/app/actions/agent";

export function VoiceSetupWizard({ merchantId, businessProfile }: { merchantId: string, businessProfile: any }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        agentName: "Alex",
        voiceGender: "female", // 'male', 'female'
        voiceVibe: "friendly", // 'professional', 'energetic', 'calm'
        handoffNumber: businessProfile?.phone || "", // Where to transfer calls
        areaCode: "415",
        specialInstructions: "",
        greeting: `Thanks for calling ${businessProfile?.business_name}, how can I help?`
    });

    // --- SUBMIT HANDLER ---
    const handleSubmit = async () => {
        setLoading(true);
        try {
            // We construct a "Request" config. 
            // We set status to 'pending_setup' so you know you have work to do.
            const config = {
                name: formData.agentName,
                // We map the vibe to a voice ID later manually
                voiceId: formData.voiceGender === 'female' ? '11labs-Sarah' : '11labs-Adrian',
                openingGreeting: formData.greeting,
                phone_number: "Pending Provisioning...", // Placeholder
                phone_mode: "generated",
                // We save the instructions into the prompt so you see them
                systemPrompt: `
                HANDOFF NUMBER: ${formData.handoffNumber}
                REQUESTED AREA CODE: ${formData.areaCode}
                VIBE: ${formData.voiceVibe}
                INSTRUCTIONS: ${formData.specialInstructions}
            `,
                status: 'pending_setup' // New status flag
            };

            // Save to Supabase (No Retell API calls here)
            await saveAgentConfig(merchantId, config);

            setStep(4); // Show Success Screen
        } catch (error) {
            alert("Failed to save request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">

            {/* Progress */}
            <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-2 rounded-full transition-all ${step === i ? "bg-primary w-12" : "bg-muted w-2"}`} />
                ))}
            </div>

            {/* STEP 1: VOICE PREFERENCE */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Design your Agent</CardTitle>
                        <CardDescription>What should your AI receptionist sound like?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Agent Name</Label>
                            <Input value={formData.agentName} onChange={e => setFormData({ ...formData, agentName: e.target.value })} />
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

            {/* STEP 2: ROUTING & PHONE */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Call Handling</CardTitle>
                        <CardDescription>Where do we send calls the AI can't handle?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Handoff Phone Number</Label>
                            <Input
                                placeholder="Your personal cell or back office line"
                                value={formData.handoffNumber}
                                onChange={e => setFormData({ ...formData, handoffNumber: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">If the AI gets stuck, it will transfer the caller here.</p>
                        </div>

                        <div className="space-y-3">
                            <Label>Preferred Area Code for AI Number</Label>
                            <Input
                                placeholder="e.g. 415"
                                maxLength={3}
                                value={formData.areaCode}
                                onChange={e => setFormData({ ...formData, areaCode: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">We will purchase a dedicated line for you in this area.</p>
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
                        Our team is provisioning your AI Agent ({formData.agentName}) now.
                        <br /><br />
                        We will email you at <strong>{businessProfile?.email}</strong> when your number is live (typically within 2 hours).
                    </p>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
                </div>
            )}

        </div>
    );
}