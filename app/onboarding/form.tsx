"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Globe, Phone, Building2, Palette, Image as ImageIcon, Loader2 } from "lucide-react";
import { saveOnboardingData } from "@/app/actions/onboarding";

export function OnboardingForm({ merchantId, initialData, businessName }: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // --- STATE ---
    const [formData, setFormData] = useState({
        // Step 1: Identity
        businessName: businessName || initialData?.business_name || "",
        logoUrl: initialData?.logo_url || "",
        brandColor: initialData?.brand_color || "#000000",
        industry: initialData?.industry || "Retail",
        website: initialData?.website || "",
        phone: initialData?.phone || "",
        address: initialData?.address || "",

        // Step 2: Hours
        hours: initialData?.business_hours || {
            Mon: { isOpen: true, open: "09:00", close: "17:00" },
            Tue: { isOpen: true, open: "09:00", close: "17:00" },
            Wed: { isOpen: true, open: "09:00", close: "17:00" },
            Thu: { isOpen: true, open: "09:00", close: "17:00" },
            Fri: { isOpen: true, open: "09:00", close: "17:00" },
            Sat: { isOpen: false, open: "10:00", close: "14:00" },
            Sun: { isOpen: false, open: "10:00", close: "14:00" },
        },

        // Step 3: Knowledge
        services: initialData?.services_summary || "",
        faqs: initialData?.faq_list || [{ question: "", answer: "" }],

        // Hidden AI defaults (We save these in background)
        timezone: initialData?.timezone || "UTC"
    });

    const handleGoogleSelect = (googleData: any) => {
        setFormData((prev: any) => ({
            ...prev,
            phone: googleData.phone || prev.phone,
            website: googleData.website || prev.website,
            industry: googleData.industry || prev.industry,
            address: googleData.address || prev.address,
            hours: googleData.hours || prev.hours,
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveOnboardingData(merchantId, formData);
            // Redirect handled by server action
        } catch (error) {
            console.error("Save failed", error);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-8">
                <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                ></div>
            </div>

            {/* STEP 1: BRAND IDENTITY */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold">Confirm Brand Identity</h3>
                        <p className="text-sm text-muted-foreground">We pulled this from Square. Does it look right?</p>
                    </div>


                    {/* Logo & Color Section */}
                    <div className="flex gap-6 items-start">
                        {/* Logo Preview */}
                        <div className="shrink-0 space-y-2 text-center">
                            <div className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                                {formData.logoUrl ? (
                                    <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                )}
                            </div>
                            <Label className="text-xs text-muted-foreground">Logo</Label>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <Label>Business Name</Label>
                                <Input
                                    value={formData.businessName}
                                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Brand Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            className="w-10 h-10 p-1 cursor-pointer shrink-0"
                                            value={formData.brandColor}
                                            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                                        />
                                        <Input
                                            value={formData.brandColor}
                                            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                                            className="font-mono uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    <Select onValueChange={(v) => setFormData({ ...formData, industry: v })} defaultValue={formData.industry}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
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

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => setStep(2)}>Next: Operations</Button>
                    </div>
                </div>
            )}

            {/* STEP 2: HOURS */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <h3 className="text-lg font-semibold">Operating Hours</h3>
                        <p className="text-sm text-muted-foreground">The AI will use this to answer "Are you open?" calls.</p>
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
                                                className="w-24 h-8 text-sm bg-white"
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
                                                className="w-24 h-8 text-sm bg-white"
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
                        <Button onClick={() => setStep(3)}>Next: Services</Button>
                    </div>
                </div>
            )}

            {/* STEP 3: KNOWLEDGE & FINISH */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <h3 className="text-lg font-semibold">Services & Pricing</h3>
                        <p className="text-sm text-muted-foreground">What do you sell? This trains the AI on your menu.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Service Menu</Label>
                        <Textarea
                            className="h-48 font-mono text-sm bg-slate-50"
                            placeholder="- Men's Haircut: $40 (30 mins)&#10;- Women's Cut: $60&#10;- Full Color: Starting at $120"
                            value={formData.services}
                            onChange={e => setFormData({ ...formData, services: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Tip: Square users, this was auto-filled from your catalog.</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                        <Label>Common Questions (Optional)</Label>
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
                                        variant="ghost"
                                        onClick={() => {
                                            const newFaqs = formData.faqs.filter((_: any, idx: number) => idx !== i);
                                            setFormData({ ...formData, faqs: newFaqs });
                                        }}
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-white border"
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

                    <div className="flex justify-between pt-8">
                        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                        <Button className="flex-1 ml-4 bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Setup & Launch Dashboard"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}