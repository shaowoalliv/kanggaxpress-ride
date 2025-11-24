import { XCircle, Wallet } from 'lucide-react';
import { ThemedCard } from './ui/ThemedCard';
import { SecondaryButton } from './ui/SecondaryButton';

interface ZeroBalanceModalProps {
  platformFee: number;
  onDismiss: () => void;
}

export function ZeroBalanceModal({ platformFee, onDismiss }: ZeroBalanceModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center px-4">
      <ThemedCard className="w-full max-w-lg bg-destructive/10 border-destructive shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/20 p-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                Insufficient Balance
              </h2>
              <p className="text-sm text-muted-foreground">
                Your wallet balance is currently ₱0.00
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 text-sm">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">System Fee Information</h3>
              </div>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Fee per job:</strong> ₱{platformFee.toFixed(2)}
              </p>
              <p className="text-muted-foreground mt-1">
                This fee is automatically deducted from your wallet when you complete a job.
              </p>
            </div>

            <div className="bg-warning/10 border border-warning rounded-lg p-4">
              <h3 className="font-bold text-warning mb-2">⚠️ Important Notice</h3>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>You can still navigate the system and view your dashboard</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>You <strong>cannot accept new jobs</strong> until you reload your balance</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warning">•</span>
                  <span>Contact KanggaXpress operator to reload your wallet</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <h3 className="font-bold text-primary mb-2">How to Reload</h3>
              <ol className="space-y-2 text-sm text-foreground list-decimal list-inside">
                <li>Contact KanggaXpress operator via support channels</li>
                <li>Provide your account number and load amount</li>
                <li>Send payment confirmation (GCash, Bank Transfer, etc.)</li>
                <li>Wait for operator to confirm and load your balance</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-center text-muted-foreground">
              This message will reappear when you refresh the page until your balance is reloaded.
            </p>
            <SecondaryButton onClick={onDismiss} className="w-full">
              Dismiss Temporarily
            </SecondaryButton>
          </div>
        </div>
      </ThemedCard>
    </div>
  );
}
