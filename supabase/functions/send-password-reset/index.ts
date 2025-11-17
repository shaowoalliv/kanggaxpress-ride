import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[Password Reset] Request received");

  try {
    // Check for Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[Password Reset] RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. Please contact support." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse request body
    const { email, redirectTo }: PasswordResetRequest = await req.json();
    console.log("[Password Reset] Processing reset for:", email);

    if (!email || !redirectTo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email and redirectTo are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role to generate reset token
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Password Reset] Supabase credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Service not properly configured" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate password reset link using Supabase
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo,
      }
    });

    if (resetError || !resetData) {
      console.error("[Password Reset] Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to generate reset link" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resetUrl = resetData.properties?.action_link || '';
    console.log("[Password Reset] Reset link generated");

    // Send password reset email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KanggaXpress <onboarding@resend.dev>",
        to: [email],
        subject: "Reset Your KanggaXpress Password",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">KanggaXpress</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
                
                <p style="color: #666; font-size: 16px;">
                  You recently requested to reset your password for your KanggaXpress account. Click the button below to reset it.
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            font-weight: 600;
                            display: inline-block;
                            font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 35px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                  This link will expire in 1 hour for security reasons.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} KanggaXpress. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("[Password Reset] Resend API error:", errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorData.message || `Failed to send email: ${emailResponse.status}` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailData = await emailResponse.json();
    console.log("[Password Reset] Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[Password Reset] Error:", error);
    console.error("[Password Reset] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to send password reset email. Please try again." 
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
