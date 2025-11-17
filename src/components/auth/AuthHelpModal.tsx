import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Car, Package, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthHelpModal({ open, onOpenChange }: AuthHelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Need help with your KanggaXpress account?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Here are a few quick steps to recover access or get support based on your role.
          </p>

          {/* Passengers Section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Passengers</h3>
            </div>
            <ul className="text-sm space-y-1.5 text-foreground/90 ml-10">
              <li>• Use the same email you used when you first registered in the app.</li>
              <li>• If you forgot your password, tap 'Forgot password?', enter your email, and check your inbox (and Spam/Junk) for the reset link.</li>
              <li>• If you no longer have access to that email, contact support.</li>
            </ul>
          </div>

          {/* Drivers Section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                <Car className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Drivers</h3>
            </div>
            <ul className="text-sm space-y-1.5 text-foreground/90 ml-10">
              <li>• Make sure you're using the same email approved during driver onboarding.</li>
              <li>• If your password isn't working, use 'Forgot password?' to reset it.</li>
              <li>• For account lock, document issues, or phone changes, please contact KanggaXpress support so we can verify your identity.</li>
            </ul>
          </div>

          {/* Couriers Section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Couriers</h3>
            </div>
            <ul className="text-sm space-y-1.5 text-foreground/90 ml-10">
              <li>• Use the email registered in your courier profile.</li>
              <li>• Reset your password via 'Forgot password?' if you can still access that email.</li>
              <li>• If you changed phones or lost access to the email, reach out to support so we can help you recover your account.</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Still stuck?</p>
                <p className="text-sm text-foreground/90">
                  Contact KanggaXpress support at{' '}
                  <a 
                    href="mailto:yourit.head@gmail.com" 
                    className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    yourit.head@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="min-w-24"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
