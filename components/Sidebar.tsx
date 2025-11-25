"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { Mail } from "lucide-react";
import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    Sparkles
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
        label: "Customers", // <--- NEW LINK
        icon: Users,
        href: "/customers",
        color: "text-pink-500",
    },
    {
        label: "Communications",
        icon: MessageSquare,
        href: "/communications",
        color: "text-[#906CDD]",
    },
    {
        label: "AI Voice Agent",
        icon: Bot,
        href: "/ai-agent",
        color: "text-orange-500",
    },
    {
        label: "SMS Marketing",
        icon: MessageSquare, // or Smartphone
        href: "/sms",
        color: "text-green-500",
    },
    {
        label: "Email Marketing",
        icon: Mail,
        href: "/email",
        color: "text-blue-500", // Different color to distinguish from SMS
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
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="space-y-4 py-4 flex flex-col h-full bg-[#0F172A] text-white border-r border-gray-800">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <div className="relative h-8 w-8 mr-4">
                        <Sparkles className="h-8 w-8 text-[#906CDD]" />
                    </div>
                    <h1 className="text-2xl font-bold">VoiceIntel</h1>
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
            <div className="px-3 py-2">
                <div className="bg-white/5 p-4 rounded-lg mb-4">
                    <p className="text-xs text-gray-400 mb-2">Trial Status</p>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mb-1">
                        <div className="bg-[#906CDD] h-1.5 rounded-full w-[70%]"></div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">14 days left</p>
                </div>
            </div>
        </aside>
    );
}