const RETELL_BASE_URL = "https://api.retellai.com";

// --- MOCK DATA (Fallback) ---
const MOCK_CALLS = [
    {
        call_id: "mock_1",
        agent_id: "agent_123",
        customer_phone: "+15550101",
        call_status: "ended",
        start_timestamp: Date.now() - 100000,
        duration_ms: 120000,
        transcript: "Hello, I'd like to book an appointment for next Tuesday.",
        recording_url: "#",
        sentiment: "positive"
    },
    {
        call_id: "mock_2",
        agent_id: "agent_123",
        customer_phone: "+15550199",
        call_status: "ended",
        start_timestamp: Date.now() - 500000,
        duration_ms: 45000,
        transcript: "Please remove me from your list.",
        recording_url: "#",
        sentiment: "negative"
    },
    {
        call_id: "mock_3",
        agent_id: "agent_123",
        customer_phone: "+15550200",
        call_status: "ongoing",
        start_timestamp: Date.now() - 1000,
        duration_ms: 1000,
        transcript: "Hi there, are you open today?",
        recording_url: "#",
        sentiment: "neutral"
    }
];


// --- FUNCTIONS ---

export async function getRetellCallLogs(limit = 20) {
    // 1. Check for API Key
    if (!process.env.RETELL_API_KEY) {
        console.warn("⚠️ Missing RETELL_API_KEY in .env.local. Using Mock Data.");
        return MOCK_CALLS;
    }

    try {
        // 2. Use POST method (Retell V2 Requirement)
        const res = await fetch(`${RETELL_BASE_URL}/v2/list-calls`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RETELL_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                limit: limit,
                sort_order: "descending"
            }),
            next: { revalidate: 60 }
        });

        // 3. Handle API Errors Gracefully
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ Retell API Error (${res.status}):`, errorText);
            return MOCK_CALLS; // Return mock data so page doesn't crash
        }

        const data = await res.json();
        return data;

    } catch (error) {
        console.error("❌ Network Error in getRetellCallLogs:", error);
        return MOCK_CALLS;
    }
}

// 1. FETCH REAL VOICES
export async function getVoices() {
    if (!process.env.RETELL_API_KEY) {
        return [
            { voice_id: "11labs-Adrian", voice_name: "Adrian (Mock)", provider: "11labs" },
            { voice_id: "openai-Alloy", voice_name: "Alloy (Mock)", provider: "openai" }
        ];
    }

    try {
        const res = await fetch(`${RETELL_BASE_URL}/list-voices`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${process.env.RETELL_API_KEY}` },
            next: { revalidate: 86400 } // Cache for 24 hours
        });

        if (!res.ok) throw new Error("Failed to fetch voices");
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error fetching voices:", error);
        return [];
    }
}

// 2. FETCH USER'S PHONE NUMBERS (To find a "From" number)
export async function getRetellPhoneNumbers() {
    if (!process.env.RETELL_API_KEY) return [];

    try {
        const res = await fetch(`${RETELL_BASE_URL}/list-phone-numbers`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${process.env.RETELL_API_KEY}` },
            cache: "no-store"
        });
        const data = await res.json();
        return data; // Array of objects containing .phone_number
    } catch (e) {
        return [];
    }
}

// 3. MAKE OUTBOUND CALL
export async function makeOutboundCall(to: string, agentId: string) {
    if (!process.env.RETELL_API_KEY) throw new Error("No API Key");

    // A. Find a number to call FROM
    const numbers = await getRetellPhoneNumbers();
    if (!numbers || numbers.length === 0) {
        throw new Error("No Phone Numbers found in Retell account. Please buy one in the Retell Dashboard.");
    }
    const fromNumber = numbers[0].phone_number; // Use the first available number

    // B. Make the call
    const res = await fetch(`${RETELL_BASE_URL}/v2/create-phone-call`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.RETELL_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from_number: fromNumber,
            to_number: to,
            agent_id: agentId,
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
    }

    return await res.json();
}

// 4. CREATE/UPDATE AGENT
export async function createOrUpdateRetellAgent(agentData: any, existingAgentId?: string) {
    // Note: In a real app, you create an LLM first, then the Agent.
    // For this simplified demo, we assume you are updating an existing agent 
    // OR we accept that creating a raw agent without an LLM might return an error in strict mode.

    if (!process.env.RETELL_API_KEY) return { agent_id: "mock_agent_id" };

    const method = existingAgentId ? "PATCH" : "POST";
    const endpoint = existingAgentId
        ? `${RETELL_BASE_URL}/update-agent/${existingAgentId}`
        : `${RETELL_BASE_URL}/create-agent`;

    const payload = {
        agent_name: agentData.name,
        voice_id: agentData.voice_id,
        // Ideally, we pass the LLM ID here. For now, we just update voice/name.
    };

    const res = await fetch(endpoint, {
        method: method,
        headers: {
            "Authorization": `Bearer ${process.env.RETELL_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        // If update fails (common if LLM setup is complex), return mock so DB saves anyway
        console.error("Retell Agent Update Failed:", await res.text());
        return { agent_id: existingAgentId || "agent_manual_setup_needed" };
    }

    return res.json();
}