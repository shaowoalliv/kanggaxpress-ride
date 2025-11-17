import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const handler = async (req: Request): Promise<Response> => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  console.log("[Password Reset Hook] Request received");

  try {
    // Get environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!resendApiKey) {
      console.error("[Password Reset Hook] RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email service is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!hookSecret) {
      console.error("[Password Reset Hook] SEND_EMAIL_HOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Hook secret is not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Resend client inside the handler
    const resend = new Resend(resendApiKey);

    // Verify webhook signature
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token_hash, redirect_to },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    console.log("[Password Reset Hook] Verified webhook for:", user.email);

    // Construct password reset URL
    const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${redirect_to}`;

    // Send password reset email via Resend
    const { data, error } = await resend.emails.send({
      from: "KanggaXpress <onboarding@resend.dev>",
      to: [user.email],
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
    });

    if (error) {
      console.error("[Password Reset Hook] Resend error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || "Failed to send password reset email",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Password Reset Hook] Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Password Reset Hook] Error:", error);
    console.error("[Password Reset Hook] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to process password reset request",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
