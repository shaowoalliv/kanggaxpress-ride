import { AlertTriangle, X } from 'lucide-react';
import { ThemedCard } from './ui/ThemedCard';
import { useState } from 'react';

interface LowBalanceWarningProps {
  transactionCapacity: number;
  platformFee: number;
  onLoadBalance?: () => void;
}

export function LowBalanceWarning({ transactionCapacity, platformFee, onLoadBalance }: LowBalanceWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (transactionCapacity >= 5 || isDismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center px-4 pb-6">
      <ThemedCard className="w-full max-w-md bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-500 shadow-xl animate-in slide-in-from-bottom duration-500">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-amber-500 p-3">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg text-amber-900">Low Balance Warning</h3>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-full hover:bg-amber-200 transition-colors"
                aria-label="Dismiss warning"
              >
                <X className="h-5 w-5 text-amber-700" />
              </button>
            </div>
            <div className="text-sm text-amber-900 space-y-2">
              <p>
                <strong>Transaction Capacity:</strong> {Math.floor(transactionCapacity)} job(s) remaining
              </p>
              <p>
                <strong>System Fee:</strong> ₱{platformFee.toFixed(2)} per completed job
              </p>
              <p className="text-amber-800 font-semibold mt-3 bg-amber-100 p-2 rounded">
                ⚠️ You have less than 5 transactions remaining. Please reload your balance to continue accepting jobs without interruption.
              </p>
              <p className="text-amber-700 mt-2 text-xs">
                If your balance reaches zero, you will not be able to accept new jobs until you reload.
              </p>
            </div>
          </div>
        </div>
      </ThemedCard>
    </div>
  );
}
