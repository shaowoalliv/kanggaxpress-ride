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
    email: 'driver3@test.com',
    password: 'test123',
    role: 'driver',
    full_name: 'Roberto Garcia',
    phone: '09193456789',
    vehicle_type: 'car',
    vehicle_plate: 'GHI-3456',
    vehicle_model: 'Toyota Vios',
    vehicle_color: 'White',
    license_number: 'N03-14-678901',
  },
  {
    email: 'courier1@test.com',
    password: 'test123',
    role: 'courier',
    full_name: 'Pedro Ramos',
    phone: '09204567890',
    vehicle_type: 'motor',
    vehicle_plate: 'DEF-9012',
    vehicle_model: 'Yamaha Mio',
    vehicle_color: 'Black',
    license_number: 'N04-15-789012',
  },
  {
    email: 'passenger1@test.com',
    password: 'test123',
    role: 'passenger',
    full_name: 'Anna Reyes',
    phone: '09211234567',
  },
  {
    email: 'passenger2@test.com',
    password: 'test123',
    role: 'passenger',
    full_name: 'Carlos Mendoza',
    phone: '09222345678',
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

    // First, delete existing test accounts
    console.log('Deleting existing test accounts...');
    for (const account of TEST_ACCOUNTS) {
      try {
        // Get user by email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (!listError && users) {
          const existingUser = users.find(u => u.email === account.email);
          
          if (existingUser) {
            // Delete the auth user (cascades to profiles, etc.)
            await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
            console.log(`Deleted existing user: ${account.email}`);
          }
        }
      } catch (error) {
        console.log(`No existing user to delete: ${account.email}`);
      }
    }

    // Now create fresh accounts
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

          // 4. Create KYC documents with approved status
          const prefix = account.email.split('@')[0]; // e.g., "driver1", "courier1"
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 3); // 3 years from now
          
          const kycDocs = [
            {
              user_id: userId,
              doc_type: 'DRIVER_LICENSE',
              status: 'APPROVED',
              confidence: 1.0,
              image_path: `test-docs/${prefix}-license.jpg`,
              parsed: {
                licenseNumber: account.license_number,
                fullName: account.full_name,
                expiryDate: expiryDate.toISOString().split('T')[0],
              },
            },
            {
              user_id: userId,
              doc_type: 'OR',
              status: 'APPROVED',
              confidence: 1.0,
              image_path: `test-docs/${prefix}-or.jpg`,
              parsed: {
                plateNumber: account.vehicle_plate,
                vehicleModel: account.vehicle_model,
                vehicleColor: account.vehicle_color,
                vehicleType: account.vehicle_type,
                expiryDate: expiryDate.toISOString().split('T')[0],
              },
            },
            {
              user_id: userId,
              doc_type: 'CR',
              status: 'APPROVED',
              confidence: 1.0,
              image_path: `test-docs/${prefix}-cr.jpg`,
              parsed: {
                plateNumber: account.vehicle_plate,
                vehicleModel: account.vehicle_model,
                vehicleColor: account.vehicle_color,
                vehicleType: account.vehicle_type,
                expiryDate: expiryDate.toISOString().split('T')[0],
              },
            },
            {
              user_id: userId,
              doc_type: 'SELFIE',
              status: 'APPROVED',
              confidence: 1.0,
              image_path: `test-docs/${prefix}-selfie.jpg`,
              parsed: {
                fullName: account.full_name,
              },
            },
          ];

          const { error: kycError } = await supabaseAdmin
            .from('kyc_documents')
            .insert(kycDocs);

          if (kycError) throw new Error(`KYC error: ${kycError.message}`);
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
