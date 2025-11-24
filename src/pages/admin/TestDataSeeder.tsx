import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ThemedCard } from '@/components/ui/ThemedCard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';

export default function TestDataSeeder() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const seedTestData = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-accounts');
      
      if (error) throw error;
      
      setResults(data.results || []);
      
      const successCount = data.results.filter((r: any) => r.success).length;
      toast.success(`Successfully created ${successCount} test accounts with ₱30 each!`);
    } catch (error: any) {
      console.error('Seeding error:', error);
      toast.error('Failed to seed test data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold">Test Data Seeder</h1>
            <p className="text-muted-foreground mt-2">
              Create test driver and courier accounts with complete profiles and wallet balance
            </p>
          </div>

          <ThemedCard>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Database className="w-5 h-5" />
                <h2 className="text-xl font-heading font-semibold">Test Accounts</h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">Driver 1</p>
                  <p className="text-muted-foreground">Email: driver1@test.com | Password: test123</p>
                  <p className="text-muted-foreground">Juan Dela Cruz | Motorbike (ABC-1234) | ₱30 wallet</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">Driver 2</p>
                  <p className="text-muted-foreground">Email: driver2@test.com | Password: test123</p>
                  <p className="text-muted-foreground">Maria Santos | Tricycle (XYZ-5678) | ₱30 wallet</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">Driver 3</p>
                  <p className="text-muted-foreground">Email: driver3@test.com | Password: test123</p>
                  <p className="text-muted-foreground">Roberto Garcia | Car (GHI-3456) | ₱30 wallet</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">Courier 1</p>
                  <p className="text-muted-foreground">Email: courier1@test.com | Password: test123</p>
                  <p className="text-muted-foreground">Pedro Ramos | Motorcycle (DEF-9012) | ₱30 wallet</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">Passenger 1</p>
                  <p className="text-muted-foreground">Email: passenger1@test.com | Password: test123</p>
                  <p className="text-muted-foreground">Anna Reyes | No wallet needed</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">Passenger 2</p>
                  <p className="text-muted-foreground">Email: passenger2@test.com | Password: test123</p>
                  <p className="text-muted-foreground">Carlos Mendoza | No wallet needed</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>⚠️ Testing Only:</strong> Creates 3 drivers (motor/tricycle/car) + 1 courier (motor) with approved KYC & ₱30 wallet + 2 passengers.
                  All accounts use password: <code className="bg-muted px-2 py-1 rounded">test123</code>
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  Note: KYC verification is automatically bypassed for test driver/courier accounts so you can start testing immediately.
                </p>
              </div>

              <PrimaryButton
                onClick={seedTestData}
                isLoading={loading}
                className="w-full"
              >
                {loading ? 'Creating Test Accounts...' : 'Create All Test Accounts'}
              </PrimaryButton>
            </div>
          </ThemedCard>

          {results.length > 0 && (
            <ThemedCard>
              <div className="space-y-3">
                <h3 className="text-lg font-heading font-semibold">Results</h3>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{result.email}</p>
                        {result.success ? (
                          <>
                            <p className="text-sm text-muted-foreground capitalize">
                              Role: {result.role}
                            </p>
                            {result.account_number && (
                              <p className="text-sm text-muted-foreground">
                                Account Number: {result.account_number}
                              </p>
                            )}
                            {result.balance > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Wallet Balance: ₱{result.balance}
                              </p>
                            )}
                            {result.role !== 'passenger' && (
                              <p className="text-xs text-blue-600 mt-1">
                                ✓ KYC bypassed for testing
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-red-500">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ThemedCard>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
