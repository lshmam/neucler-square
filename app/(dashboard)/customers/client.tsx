"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Search, Filter, Download, MoreHorizontal,
    Users, TrendingUp, UserPlus, AlertCircle,
    MessageSquare, Tag, Trash2, Sparkles, Plus
} from "lucide-react";

// Helper for status logic
const getStatus = (visits: number, spend: number) => {
    if (spend > 500) return { label: "VIP", color: "bg-purple-100 text-purple-800 border-purple-200" };
    if (visits === 1) return { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (visits === 0) return { label: "Lead", color: "bg-gray-100 text-gray-800 border-gray-200" };
    return { label: "Active", color: "bg-green-100 text-green-800 border-green-200" };
};

export function CustomersClient({ initialCustomers }: { initialCustomers: any[] }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // 1. FILTER LOGIC
    const filteredCustomers = initialCustomers.filter((c) => {
        const matchesSearch =
            c.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === "vip") return (c.total_spend_cents / 100) > 500;
        if (activeTab === "new") return c.visit_count === 1;
        if (activeTab === "at_risk") {
            // Mock logic for At Risk (e.g., not visited in 60 days)
            const last = new Date(c.last_visit_date).getTime();
            const now = new Date().getTime();
            const days = (now - last) / (1000 * 60 * 60 * 24);
            return days > 60;
        }
        return true; // "all"
    });

    // 2. SELECTION LOGIC
    const handleSelectAll = () => {
        if (selectedIds.length === filteredCustomers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCustomers.map(c => c.id));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // 3. METRICS CALCULATION
    const totalCustomers = initialCustomers.length;
    const newCustomers = initialCustomers.filter(c => c.visit_count === 1).length;
    const vipCount = initialCustomers.filter(c => (c.total_spend_cents / 100) > 500).length;
    const atRiskCount = initialCustomers.length - (newCustomers + vipCount); // Mock math

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 relative min-h-screen bg-gray-50/50">

            {/* --- NEW PROFESSIONAL HEADING --- */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center border shadow-sm">
                        <Users className="h-6 w-6 text-[#906CDD]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your relationships, track loyalty, and prevent churn.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="outline" className="bg-white border-slate-200 shadow-sm hover:bg-slate-50">
                        <Download className="mr-2 h-4 w-4 text-slate-500" /> Export
                    </Button>
                    <Button className="bg-[#906CDD] hover:bg-[#7a5bb5] text-white shadow-md shadow-purple-100">
                        <Plus className="mr-2 h-4 w-4" /> Add Customer
                    </Button>
                </div>
            </div>

            {/* --- A. CRM SNAPSHOT CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Active</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{totalCustomers}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
                        <UserPlus className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{newCustomers}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">VIP Clients</CardTitle>
                        <Sparkles className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{vipCount}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-orange-100 bg-orange-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">At Risk</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{atRiskCount}</div>
                        <p className="text-xs text-orange-600/80">Needs attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- B. ACTIONS & FILTERS --- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-1 rounded-lg border shadow-sm">
                <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
                    <TabsList className="bg-transparent p-0">
                        <TabsTrigger value="all" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-md px-4 py-2">All Customers</TabsTrigger>
                        <TabsTrigger value="vip" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md px-4 py-2">VIP</TabsTrigger>
                        <TabsTrigger value="new" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md px-4 py-2">New</TabsTrigger>
                        <TabsTrigger value="at_risk" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 rounded-md px-4 py-2">At Risk</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full sm:w-auto p-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name or email..."
                            className="pl-8 bg-slate-50 border-slate-200 focus-visible:ring-[#906CDD]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* --- C. DATA TABLE --- */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                                    onCheckedChange={handleSelectAll}
                                    className="border-slate-300 data-[state=checked]:bg-[#906CDD] data-[state=checked]:border-[#906CDD]"
                                />
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Visit</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visits</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spend</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loyalty</TableHead>
                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => {
                            const status = getStatus(customer.visit_count || 0, customer.total_spend_cents || 0);
                            return (
                                <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(customer.id)}
                                            onCheckedChange={() => toggleSelection(customer.id)}
                                            className="border-slate-300 data-[state=checked]:bg-[#906CDD] data-[state=checked]:border-[#906CDD]"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link href={`/customers/${customer.id}`} className="font-semibold text-slate-900 hover:text-[#906CDD] transition-colors">
                                                {customer.first_name} {customer.last_name}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">{customer.email || customer.phone_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`${status.color} font-medium border`}>
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {customer.last_visit_date ? new Date(customer.last_visit_date).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">{customer.visit_count || 0}</TableCell>
                                    <TableCell className="font-medium text-slate-900">
                                        ${((customer.total_spend_cents || 0) / 100).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">{Math.floor((customer.total_spend_cents || 0) / 100)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Users className="h-10 w-10 text-slate-300" />
                                        <p>No customers found matching your filters.</p>
                                        <Button variant="link" onClick={() => { setSearchQuery(""); setActiveTab("all") }} className="text-[#906CDD]">Clear Filters</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- D. FLOATING BULK ACTION BAR --- */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-slate-900 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-4 fade-in duration-200 ring-1 ring-white/10">
                    <div className="flex items-center gap-4 pl-2">
                        <div className="bg-[#906CDD] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {selectedIds.length} Selected
                        </div>
                        <span className="text-sm text-slate-300 border-l border-slate-700 pl-4">Actions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" className="hover:bg-slate-200 h-8 text-xs">
                            <MessageSquare className="h-3 w-3 mr-2" /> Send SMS
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-xs">
                            <Tag className="h-3 w-3 mr-2" /> Add Tag
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20 hover:text-red-300 h-8 px-2">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}