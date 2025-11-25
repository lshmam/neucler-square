import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar is fixed width and full height */}
            <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <Sidebar />
            </div>

            {/* Main Content pushes over to the right */}
            <main className="flex-1 md:pl-64 flex flex-col h-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}