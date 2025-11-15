import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstallPrompt } from '@/hooks/usePWAInstallPrompt';

export function InstallPromptBanner() {
  const { showPrompt, isIOS, handleInstall, handleDismiss } = usePWAInstallPrompt();

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm mb-1">
              Install KanggaXpress?
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {isIOS
                ? "To install KanggaXpress, tap the Share button and select 'Add to Home Screen'."
                : "Get quicker access by installing the KanggaXpress app on your device."}
            </p>
            <div className="flex gap-2">
              {!isIOS && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="text-xs"
                >
                  Install
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="text-xs"
              >
                {isIOS ? 'Got it' : 'Maybe later'}
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
