"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, CheckCircle2, Clock, Globe, Phone, User, Building2 } from "lucide-react";
import { saveOnboardingData } from "@/app/actions/onboarding";

interface OnboardingFormProps {
    merchantId: string;
    initialData: any;
    businessName: string;
    isSettings?: boolean;
}

export function OnboardingForm({ merchantId, initialData, businessName, isSettings = false }: OnboardingFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // --- STATE INITIALIZATION ---
    const [formData, setFormData] = useState({
        aiName: initialData?.ai_name || "Alice",
        industry: initialData?.industry || "Retail",
        tone: initialData?.ai_tone || "friendly",
        website: initialData?.website || "",
        phone: initialData?.phone || "",
        address: initialData?.address || "",
        services: initialData?.services_summary || "",
        faqs: initialData?.faq_list || [{ question: "", answer: "" }],
        hours: initialData?.business_hours || {
            Mon: { isOpen: true, open: "09:00", close: "17:00" },
            Tue: { isOpen: true, open: "09:00", close: "17:00" },
            Wed: { isOpen: true, open: "09:00", close: "17:00" },
            Thu: { isOpen: true, open: "09:00", close: "17:00" },
            Fri: { isOpen: true, open: "09:00", close: "17:00" },
            Sat: { isOpen: false, open: "10:00", close: "14:00" },
            Sun: { isOpen: false, open: "10:00", close: "14:00" },
        }
    });

    // --- HANDLERS ---

    const handleGoogleSelect = (googleData: any) => {
        setFormData((prev) => ({
            ...prev,
            phone: googleData.phone || prev.phone,
            website: googleData.website || prev.website,
            industry: googleData.industry || prev.industry,
            address: googleData.address || prev.address,
            hours: googleData.hours || prev.hours,
            // Guess tone based on industry
            tone: googleData.industry === 'Medical' ? 'professional' : prev.tone
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveOnboardingData(merchantId, formData);

            if (isSettings) {
                router.refresh(); // Reload data in settings page
                // Ideally show a toast here: toast.success("Settings updated")
            }
            // If not settings (Onboarding), the Server Action handles the redirect to dashboard
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---

    return (
        <div className="space-y-6">

            {/* Progress Bar (Only show in Onboarding Mode) */}
            {!isSettings && (
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-8">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${step * 25}%` }}
                    ></div>
                </div>
            )}

            {/* STEP 1: BASICS */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Industry</Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, industry: v })} defaultValue={formData.industry}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Salon">Salon / Spa</SelectItem>
                                    <SelectItem value="Auto">Auto Shop</SelectItem>
                                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                                    <SelectItem value="Retail">Retail Store</SelectItem>
                                    <SelectItem value="Medical">Medical / Dental</SelectItem>
                                    <SelectItem value="Services">Professional Services</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>AI Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    value={formData.aiName}
                                    onChange={e => setFormData({ ...formData, aiName: e.target.value })}
                                    placeholder="e.g. Alice"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Business Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-9" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Physical Address</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setStep(2)}>Next: Business Hours</Button>
                    </div>
                </div>
            )}

            {/* STEP 2: HOURS */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">When are you open?</h3>
                    </div>

                    <div className="space-y-1 border rounded-xl p-4 bg-slate-50/50">
                        {Object.entries(formData.hours).map(([day, val]: any) => (
                            <div key={day} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={val.isOpen}
                                        onChange={(e) => {
                                            const newHours = { ...formData.hours };
                                            // @ts-ignore
                                            newHours[day].isOpen = e.target.checked;
                                            setFormData({ ...formData, hours: newHours });
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className={`w-12 font-medium text-sm ${val.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>{day}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {val.isOpen ? (
                                        <>
                                            <Input
                                                className="w-28 h-8 text-sm"
                                                type="time"
                                                value={val.open}
                                                onChange={(e) => {
                                                    const newHours = { ...formData.hours };
                                                    // @ts-ignore
                                                    newHours[day].open = e.target.value;
                                                    setFormData({ ...formData, hours: newHours });
                                                }}
                                            />
                                            <span className="text-slate-400">-</span>
                                            <Input
                                                className="w-28 h-8 text-sm"
                                                type="time"
                                                value={val.close}
                                                onChange={(e) => {
                                                    const newHours = { ...formData.hours };
                                                    // @ts-ignore
                                                    newHours[day].close = e.target.value;
                                                    setFormData({ ...formData, hours: newHours });
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic pr-4">Closed</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={() => setStep(3)}>Next: Knowledge</Button>
                    </div>
                </div>
            )}

            {/* STEP 3: KNOWLEDGE */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <h3 className="text-lg font-medium">Services & FAQs</h3>
                        <p className="text-sm text-muted-foreground">Teach the AI about your prices and policies.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Services Menu (Pricing & Description)</Label>
                        <Textarea
                            className="h-40 font-mono text-sm bg-slate-50"
                            placeholder="- Men's Haircut: $40 (30 mins)&#10;- Women's Cut: $60&#10;- Full Color: Starting at $120"
                            value={formData.services}
                            onChange={e => setFormData({ ...formData, services: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Tip: List services line by line. Square users: this is auto-filled.</p>
                    </div>

                    <div className="space-y-3">
                        <Label>Frequently Asked Questions</Label>
                        {formData.faqs.map((faq: any, i: number) => (
                            <div key={i} className="bg-slate-50 border rounded-lg p-3 space-y-2 relative group">
                                <Input
                                    placeholder="Question (e.g. Do you accept walk-ins?)"
                                    className="bg-white"
                                    value={faq.question}
                                    onChange={e => {
                                        const newFaqs = [...formData.faqs];
                                        newFaqs[i].question = e.target.value;
                                        setFormData({ ...formData, faqs: newFaqs });
                                    }}
                                />
                                <Textarea
                                    placeholder="Answer (e.g. Yes, but appointments are preferred)"
                                    className="bg-white min-h-[60px]"
                                    value={faq.answer}
                                    onChange={e => {
                                        const newFaqs = [...formData.faqs];
                                        newFaqs[i].answer = e.target.value;
                                        setFormData({ ...formData, faqs: newFaqs });
                                    }}
                                />
                                {formData.faqs.length > 1 && (
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => {
                                            const newFaqs = formData.faqs.filter((_: any, idx: number) => idx !== i);
                                            setFormData({ ...formData, faqs: newFaqs });
                                        }}
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setFormData({ ...formData, faqs: [...formData.faqs, { question: "", answer: "" }] })}>
                            <Plus className="h-4 w-4 mr-2" /> Add FAQ
                        </Button>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                        <Button onClick={() => setStep(4)}>Next: Persona</Button>
                    </div>
                </div>
            )}

            {/* STEP 4: REVIEW & FINISH */}
            {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="text-center space-y-2">
                        {!isSettings && (
                            <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                        )}
                        <h3 className="text-2xl font-bold">{isSettings ? "Update AI Persona" : "Ready to launch?"}</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            {isSettings
                                ? "Updating these settings will instantly retrain your Voice Agent and Chatbot."
                                : `Your AI Agent "${formData.aiName}" has learned your business hours, services, and policies.`}
                        </p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                        <Label>Select AI Tone</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Professional', 'Friendly', 'Energetic'].map(t => (
                                <div
                                    key={t}
                                    onClick={() => setFormData({ ...formData, tone: t.toLowerCase() })}
                                    className={`cursor-pointer border-2 rounded-xl p-4 text-center text-sm font-semibold transition-all ${formData.tone === t.toLowerCase()
                                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                        : 'border-slate-100 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pt-8 max-w-md mx-auto w-full gap-4">
                        <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                        <Button className="flex-1" size="lg" onClick={handleSave} disabled={loading}>
                            {loading ? "Training AI..." : (isSettings ? "Save Changes" : "Finish & Go to Dashboard")}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}