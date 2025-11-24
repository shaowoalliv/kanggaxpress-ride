import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful assistant for KanggaXpress, a Filipino ride-hailing and delivery service app.

IMPORTANT LANGUAGE RULES:
- Detect if the user is speaking in English or Tagalog
- Respond in the SAME language the user uses
- If user switches languages, switch with them
- Be natural and conversational in both languages

YOU CAN HELP WITH:
1. App Navigation & How-To:
   - How to book a ride (motor, tricycle, car)
   - How to become a driver or courier
   - How to create deliveries
   - How to view ride/delivery history
   - How to manage wallet and add funds
   - How to request withdrawals

2. Pricing & Services:
   - Vehicle types available: Motor, Tricycle, Car
   - Package sizes: Small, Medium, Large
   - Fare negotiation process
   - How pricing works (base fare + per km/min)

3. KanggaXpress Features:
   - Real-time ride tracking
   - Cash on Delivery (COD) for packages
   - Driver/Courier ratings
   - KYC verification process
   - Wallet system

4. General FAQ:
   - What is KanggaXpress
   - Service areas
   - How to contact support
   - Safety features

YOU CANNOT AND SHOULD NOT:
- Show passwords or login credentials
- Display personal user data (phone, addresses, emails)
- Show wallet balances or transaction amounts
- Provide specific ride/delivery details
- Access any confidential information
- Make database queries or modifications

Keep responses concise, friendly, and helpful. Use Filipino culture references when appropriate (e.g., "pamasahe" for fare, "kuya/ate" for drivers).`;

    console.log("Chatbot request received with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});