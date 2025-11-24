import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: {
    rideId?: string;
    deliveryId?: string;
    type?: 'ride' | 'delivery';
    status?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, data } = await req.json() as NotificationRequest;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: In a production app, you would:
    // 1. Retrieve the user's FCM/APNS token from your database
    // 2. Use Firebase Cloud Messaging (FCM) for Android
    // 3. Use Apple Push Notification service (APNS) for iOS
    // 4. Send the notification using the appropriate service
    
    // For now, we'll log the notification
    console.log('Push notification request:', {
      userId,
      title,
      body,
      data,
    });

    // Store notification in database for in-app display
    const { error: dbError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: 'push',
        subject: title,
        recipient_email: '', // Would be populated from user profile
        status: 'sent',
        metadata: {
          title,
          body,
          data,
        },
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notification processed successfully',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
