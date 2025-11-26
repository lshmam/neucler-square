"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    Bot,
    Mail,
    Globe,
    Sparkles,
    Smartphone,
    LogOut // Import the LogOut icon
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Customers",
        icon: Users,
        href: "/customers",
        color: "text-pink-500",
    },
    // {
    //     label: "Communications",
    //     icon: MessageSquare,
    //     href: "/communications",
    //     color: "text-[#906CDD]",
    // },
    {
        label: "AI Voice Agent",
        icon: Bot,
        href: "/ai-agent",
        color: "text-orange-500",
    },
    {
        label: "Automations",
        icon: Sparkles, // Or CircuitBoard/Zap
        href: "/automations",
        color: "text-purple-500",
    },
    {
        label: "SMS Marketing",
        icon: Smartphone,
        href: "/sms",
        color: "text-green-500",
    },
    {
        label: "Email Marketing",
        icon: Mail,
        href: "/email",
        color: "text-blue-500",
    },
    {
        label: "Site Widgets",
        icon: Globe,
        href: "/site-widgets",
        color: "text-indigo-500",
    },
    {
        label: "Loyalty",
        icon: Users,
        href: "/loyalty",
        color: "text-pink-500",
    },
    {
        label: "Analytics", // Added Analytics based on previous request
        icon: LayoutDashboard, // You can use BarChart3 if imported
        href: "/analytics",
        color: "text-emerald-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        color: "text-gray-400",
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="space-y-4 py-4 flex flex-col h-full bg-[#0F172A] text-white border-r border-gray-800">
            {/* TOP SECTION: Logo & Nav Links */}
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <div className="relative h-8 w-8 mr-4">
                        <Sparkles className="h-8 w-8 text-[#906CDD]" />
                    </div>
                    <h1 className="text-2xl font-bold">neucler</h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname.startsWith(route.href) ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* BOTTOM SECTION: Logout */}
            <div className="px-3 py-2">
                <Link
                    href="/auth/logout" // Hits the route handler we made
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-5 w-5 mr-3 text-red-500" />
                        Sign Out
                    </div>
                </Link>
            </div>
        </aside>
    );
}