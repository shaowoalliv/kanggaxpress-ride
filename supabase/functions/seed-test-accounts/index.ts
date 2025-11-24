import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestAccount {
  email: string;
  password: string;
  role: 'driver' | 'courier' | 'passenger';
  full_name: string;
  phone: string;
  vehicle_type?: 'motor' | 'tricycle' | 'car';
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_number?: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: 'driver1@test.com',
    password: 'test123',
    role: 'driver',
    full_name: 'Juan Dela Cruz',
    phone: '09171234567',
    vehicle_type: 'motor',
    vehicle_plate: 'ABC-1234',
    vehicle_model: 'Honda Wave 110',
    vehicle_color: 'Red',
    license_number: 'N01-12-345678',
  },
  {
    email: 'driver2@test.com',
    password: 'test123',
    role: 'driver',
    full_name: 'Maria Santos',
    phone: '09182345678',
    vehicle_type: 'tricycle',
    vehicle_plate: 'XYZ-5678',
    vehicle_model: 'Honda TMX 155',
    vehicle_color: 'Blue',
    license_number: 'N02-13-456789',
  },
  {
    email: 'courier1@test.com',
    password: 'test123',
    role: 'courier',
    full_name: 'Pedro Ramos',
    phone: '09193456789',
    vehicle_type: 'motor',
    vehicle_plate: 'DEF-9012',
    vehicle_model: 'Yamaha Mio',
    vehicle_color: 'Black',
    license_number: 'N03-14-567890',
  },
  {
    email: 'passenger1@test.com',
    password: 'test123',
    role: 'passenger',
    full_name: 'Anna Reyes',
    phone: '09201234567',
  },
  {
    email: 'passenger2@test.com',
    password: 'test123',
    role: 'passenger',
    full_name: 'Carlos Mendoza',
    phone: '09212345678',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = [];

    for (const account of TEST_ACCOUNTS) {
      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name,
            role: account.role,
          },
        });

        if (authError) throw new Error(`Auth error for ${account.email}: ${authError.message}`);
        if (!authData.user) throw new Error(`No user created for ${account.email}`);

        const userId = authData.user.id;

        // 2. Update profile (should be created by trigger, but ensure phone is set)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ phone: account.phone })
          .eq('id', userId);

        if (profileError) throw new Error(`Profile error: ${profileError.message}`);

        // 3. Create driver/courier profile (skip for passengers)
        if (account.role === 'driver' || account.role === 'courier') {
          const profileTable = account.role === 'driver' ? 'driver_profiles' : 'courier_profiles';
          const { error: vehicleError } = await supabaseAdmin
            .from(profileTable)
            .insert({
              user_id: userId,
              vehicle_type: account.vehicle_type,
              vehicle_plate: account.vehicle_plate,
              vehicle_model: account.vehicle_model,
              vehicle_color: account.vehicle_color,
              license_number: account.license_number,
              is_available: true,
            });

          if (vehicleError) throw new Error(`Vehicle profile error: ${vehicleError.message}`);

          // 4. Create mock KYC documents (APPROVED status for testing)
          const kycDocs = [
            { doc_type: 'DRIVER_LICENSE', parsed: { license_no: account.license_number } },
            { doc_type: 'OR', parsed: { plate_no: account.vehicle_plate } },
            { doc_type: 'CR', parsed: { plate_no: account.vehicle_plate, vehicle_brand: account.vehicle_model?.split(' ')[0], color: account.vehicle_color } },
            { doc_type: 'SELFIE', parsed: {} },
          ];

          for (const doc of kycDocs) {
            const { error: kycError } = await supabaseAdmin
              .from('kyc_documents')
              .insert({
                user_id: userId,
                doc_type: doc.doc_type,
                parsed: doc.parsed,
                confidence: 1.0,
                status: 'APPROVED',
                image_path: `test-docs/${account.email}/${doc.doc_type.toLowerCase()}.jpg`,
              });

            if (kycError) throw new Error(`KYC error: ${kycError.message}`);
          }
        }

        // 5. Generate account number (only for drivers/couriers)
        let accountNumber = null;
        if (account.role === 'driver' || account.role === 'courier') {
          const prefix = account.role === 'driver' ? 'KXD' : 'KXC';
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
          hash = ((hash << 5) - hash) + userId.charCodeAt(i);
          hash = hash & hash;
        }
          const num = Math.abs(hash) % 100000000;
          accountNumber = `${prefix}-${num.toString().padStart(8, '0')}`;

          // 6. Update profile with account number
          const { error: accountError } = await supabaseAdmin
            .from('profiles')
            .update({ account_number: accountNumber })
            .eq('id', userId);

          if (accountError) throw new Error(`Account number error: ${accountError.message}`);

          // 7. Create wallet account with ₱30 initial balance
          const { error: walletError } = await supabaseAdmin
            .from('wallet_accounts')
            .insert({
              user_id: userId,
              role: account.role,
              balance: 30,
            });

          if (walletError) throw new Error(`Wallet error: ${walletError.message}`);

          // 8. Create initial load transaction
          const { error: transactionError } = await supabaseAdmin
            .from('wallet_transactions')
            .insert({
              user_id: userId,
              amount: 30,
              type: 'load',
              reference: 'Initial test account load',
            });

          if (transactionError) throw new Error(`Transaction error: ${transactionError.message}`);
        }

        results.push({
          email: account.email,
          success: true,
          role: account.role,
          account_number: accountNumber,
          balance: account.role === 'passenger' ? 0 : 30,
        });
      } catch (error: any) {
        results.push({
          email: account.email,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Test accounts seeding completed',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
