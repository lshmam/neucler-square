import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { ChatInterface } from "./chat-interface"; // We will create this next

export default async function CommunicationsPage() {
    const cookieStore = await cookies();
    const merchantId = cookieStore.get("session_merchant_id")?.value;
    if (!merchantId) redirect("/");

    // 1. Fetch All Messages
    const { data: messages } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: true });

    // 2. Fetch Customers (To map Phone -> Name)
    const { data: customers } = await supabaseAdmin
        .from("customers")
        .select("phone_number, first_name, last_name")
        .eq("merchant_id", merchantId);

    // 3. Group Messages by Conversation (Phone Number)
    const conversations: Record<string, any> = {};

    messages?.forEach((msg) => {
        const phone = msg.customer_phone;
        if (!conversations[phone]) {
            // Find name
            const cust = customers?.find(c => c.phone_number === phone);
            conversations[phone] = {
                phone,
                name: cust ? `${cust.first_name} ${cust.last_name}` : "Unknown Customer",
                messages: []
            };
        }
        conversations[phone].messages.push(msg);
    });

    return (
        <div className="flex-1 h-[calc(100vh-4rem)]">
            <ChatInterface
                merchantId={merchantId}
                initialConversations={Object.values(conversations)}
            />
        </div>
    );
}