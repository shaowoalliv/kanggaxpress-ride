import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstallPrompt } from '@/hooks/usePWAInstallPrompt';

export function InstallPromptBanner() {
  const { showPrompt, isIOS, handleInstall, handleDismiss } = usePWAInstallPrompt();

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <Download className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base mb-1.5">
              Install KanggaXpress
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {isIOS
                ? "Install KanggaXpress: tap the Share icon and choose 'Add to Home Screen'."
                : "Add KanggaXpress to your home screen for faster access to rides and deliveries."}
            </p>
            <div className="flex gap-2">
              {!isIOS && (
                <Button
                  size="default"
                  onClick={handleInstall}
                  className="flex-1 h-11"
                >
                  Install app
                </Button>
              )}
              <Button
                size="default"
                variant="outline"
                onClick={handleDismiss}
                className={isIOS ? "flex-1 h-11" : "h-11"}
              >
                {isIOS ? 'Got it' : 'Not now'}
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 -mt-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
