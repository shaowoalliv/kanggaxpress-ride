import { PageLayout } from '@/components/layout/PageLayout';
import { KanggaLogo } from '@/components/KanggaLogo';
import { LaunchCountdown } from '@/components/launch/LaunchCountdown';

export default function Landing() {
  return (
    <PageLayout showHeader={false} className="relative overflow-hidden bg-background">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.5),_transparent_42%),radial-gradient(circle_at_bottom_left,_hsl(var(--primary)/0.3),_transparent_30%),linear-gradient(135deg,_hsl(var(--background))_0%,_hsl(var(--primary)/0.96)_38%,_hsl(var(--primary)/0.9)_58%,_hsl(var(--secondary)/0.58)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_hsl(var(--primary)/0.12)_0%,_hsl(var(--secondary)/0.16)_52%,_hsl(var(--secondary)/0.42)_100%)]" />

        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-16 top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center">
          <div className="w-full max-w-4xl rounded-[2rem] border border-primary-foreground/15 bg-card/10 px-4 py-8 shadow-2xl backdrop-blur-[8px] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center animate-in fade-in duration-700">
              <div className="inline-flex items-center justify-center rounded-full border border-primary-foreground/15 bg-card/14 p-3 shadow-lg backdrop-blur-md">
                <KanggaLogo width={132} height={132} className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32" />
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-secondary">
                Launching Soon
              </p>
              <h1 className="mt-4 text-balance font-heading text-4xl font-extrabold leading-[0.95] text-secondary sm:text-5xl lg:text-7xl">
                KanggaXpress
              </h1>
              <p className="mt-4 max-w-2xl text-balance text-base font-medium text-secondary/90 sm:text-lg lg:text-xl">
                Rooted in Tradition. Ready to Launch.
              </p>
              <p className="mt-3 max-w-xl text-balance text-sm text-secondary/80 sm:text-base">
                Mindoro’s community-first mobility platform is arriving soon.
              </p>
            </div>

            <div className="mx-auto mt-8 w-full max-w-3xl lg:mt-10">
              <LaunchCountdown />
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

