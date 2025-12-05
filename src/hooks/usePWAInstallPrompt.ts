import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the deferred prompt globally so hamburger menu can access it
declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed recently (reset after 7 days)
    const dismissedAt = localStorage.getItem('kx_pwa_install_prompt_dismissed_at');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Still within 7-day cooldown
      }
      // Clear old dismissal after 7 days
      localStorage.removeItem('kx_pwa_install_prompt_dismissed');
      localStorage.removeItem('kx_pwa_install_prompt_dismissed_at');
    }

    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if mobile viewport (width < 768px)
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      // Show iOS hint once after delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return;
    }

    // Handle beforeinstallprompt for other browsers (with delay)
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Also store on window for hamburger menu access
      window.deferredPrompt = promptEvent;
      setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install prompt outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    window.deferredPrompt = null;
    setShowPrompt(false);
    localStorage.setItem('kx_pwa_install_prompt_dismissed', 'true');
    localStorage.setItem('kx_pwa_install_prompt_dismissed_at', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('kx_pwa_install_prompt_dismissed', 'true');
    localStorage.setItem('kx_pwa_install_prompt_dismissed_at', Date.now().toString());
  };

  return {
    showPrompt,
    isIOS,
    handleInstall,
    handleDismiss,
  };
}
