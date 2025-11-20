import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface KycApprovalRequest {
  email: string;
  driverName: string;
  documentType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, driverName, documentType }: KycApprovalRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "KanggaXpress <onboarding@resend.dev>",
      to: [email],
      subject: "Your TNVS KanggaXpress Application is Approved! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #FDB813 0%, #F59E0B 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #fff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .success-badge {
                background: #10b981;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                background: #f3f4f6;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                border-radius: 0 0 8px 8px;
              }
              .button {
                background: #FDB813;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin: 20px 0;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${driverName}</strong>,</p>
              
              <div class="success-badge">✓ APPROVED</div>
              
              <p>We are pleased to inform you that your <strong>${documentType}</strong> document has been approved!</p>
              
              <p><strong>Your TNVS KanggaXpress application status has been updated.</strong></p>
              
              <p>You are one step closer to becoming a verified KanggaXpress partner driver. Please ensure all required documents are submitted and approved to complete your registration.</p>
              
              <h3>Next Steps:</h3>
              <ul>
                <li>Check your dashboard for any remaining document requirements</li>
                <li>Complete your driver profile if not yet done</li>
                <li>Review the driver guidelines and terms</li>
              </ul>
              
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              
              <p>Thank you for choosing KanggaXpress!</p>
              
              <p>Best regards,<br>
              <strong>The KanggaXpress Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} KanggaXpress. All rights reserved.</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("KYC approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-kyc-approval function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
