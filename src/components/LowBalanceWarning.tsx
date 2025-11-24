import { AlertTriangle } from 'lucide-react';
import { ThemedCard } from './ui/ThemedCard';

interface LowBalanceWarningProps {
  transactionCapacity: number;
  platformFee: number;
  onLoadBalance?: () => void;
}

export function LowBalanceWarning({ transactionCapacity, platformFee, onLoadBalance }: LowBalanceWarningProps) {
  if (transactionCapacity >= 5) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-start justify-center px-4 pt-20">
      <ThemedCard className="w-full max-w-md bg-warning/10 border-warning shadow-lg animate-in slide-in-from-top duration-300">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-warning/20 p-3">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-lg text-warning">Low Balance Warning</h3>
            <div className="text-sm text-foreground space-y-1">
              <p>
                <strong>Transaction Capacity:</strong> {Math.floor(transactionCapacity)} job(s) remaining
              </p>
              <p>
                <strong>System Fee:</strong> ₱{platformFee.toFixed(2)} per completed job
              </p>
              <p className="text-warning font-semibold mt-3">
                ⚠️ You have less than 5 transactions remaining. Please reload your balance to continue accepting jobs without interruption.
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                If your balance reaches zero, you will not be able to accept new jobs until you reload.
              </p>
            </div>
          </div>
        </div>
      </ThemedCard>
    </div>
  );
}
