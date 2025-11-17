import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Home, Smartphone, User as UserIcon, LogOut, LogIn, HelpCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { KanggaLogo } from '@/components/KanggaLogo';
import { useAuth } from '@/contexts/AuthContext';

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-primary-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-center mb-4">
            <KanggaLogo width={120} height={120} className="w-24 h-24" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 mt-6">
          {/* Home */}
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigation('/')}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Button>

          {/* Install App */}
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12 text-base"
            onClick={() => {
              setOpen(false);
              // Trigger PWA install prompt if available
              const installPromptEvent = (window as any).deferredPrompt;
              if (installPromptEvent) {
                installPromptEvent.prompt();
              }
            }}
          >
            <Smartphone className="h-5 w-5" />
            <span>Install App</span>
          </Button>

          {/* Choose Role */}
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12 text-base"
            onClick={() => handleNavigation('/choose-role')}
          >
            <UserIcon className="h-5 w-5" />
            <span>Choose Role</span>
          </Button>

          {/* How It Works */}
          <Button
            variant="ghost"
            className="justify-start gap-3 h-12 text-base"
            onClick={() => {
              setOpen(false);
              navigate('/');
              setTimeout(() => {
                const howItWorksSection = document.getElementById('how-it-works');
                howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            <HelpCircle className="h-5 w-5" />
            <span>How It Works</span>
          </Button>

          <Separator className="my-4" />

          {/* Conditional Auth Section */}
          {user ? (
            <>
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{profile?.full_name}</span>
              </div>
              <Button
                variant="ghost"
                className="justify-start gap-3 h-12 text-base"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="justify-start gap-3 h-12 text-base"
              onClick={() => handleNavigation('/auth')}
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
