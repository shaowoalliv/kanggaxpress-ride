import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WithdrawalRequest {
  userId: string;
  amount: number;
  accountNumber: string;
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

    const { userId, amount, accountNumber } = await req.json() as WithdrawalRequest;

    if (!userId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid withdrawal request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has sufficient balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (wallet.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create withdrawal transaction record with negative amount (pending status)
    const { error: txnError } = await supabaseClient
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'deduct',
        reference: `Withdrawal request - ${accountNumber} - Pending admin approval`,
      });

    if (txnError) {
      console.error('Transaction error:', txnError);
      return new Response(
        JSON.stringify({ error: 'Failed to create withdrawal request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update wallet balance (deduct withdrawal amount)
    const { error: updateError } = await supabaseClient
      .from('wallet_accounts')
      .update({ 
        balance: wallet.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to process withdrawal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log notification for admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    await supabaseClient
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: 'withdrawal_request',
        subject: 'New Withdrawal Request',
        recipient_email: profile?.email || '',
        status: 'pending',
        metadata: {
          amount,
          accountNumber,
          userName: profile?.full_name,
        },
      });

    console.log(`Withdrawal request processed: ${userId} - ₱${amount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Withdrawal request submitted successfully',
        newBalance: wallet.balance - amount,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing withdrawal request:', error);
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
