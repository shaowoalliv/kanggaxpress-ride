import { useEffect, useMemo, useState } from 'react';

const MANILA_LAUNCH_TIMESTAMP = Date.UTC(2026, 3, 29, 16, 0, 0);

interface LaunchCountdownProps {
  targetTimestamp?: number;
  launchLabel?: string;
  liveMessage?: string;
  className?: string;
}

interface CountdownState {
  isLive: boolean;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

function getCountdownState(targetTimestamp: number): CountdownState {
  const difference = targetTimestamp - Date.now();

  if (difference <= 0) {
    return {
      isLive: true,
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isLive: false,
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export function LaunchCountdown({
  targetTimestamp = MANILA_LAUNCH_TIMESTAMP,
  launchLabel = 'Launching on April 30, 2026 • 12:00 AM (PH Time)',
  liveMessage = 'We’re live! KanggaXpress has officially launched.',
  className = '',
}: LaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<CountdownState>(() => getCountdownState(targetTimestamp));

  useEffect(() => {
    setTimeLeft(getCountdownState(targetTimestamp));

    const intervalId = window.setInterval(() => {
      setTimeLeft(getCountdownState(targetTimestamp));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [targetTimestamp]);

  const countdownUnits = useMemo(
    () => [
      { label: 'Days', value: timeLeft.days },
      { label: 'Hours', value: timeLeft.hours },
      { label: 'Minutes', value: timeLeft.minutes },
      { label: 'Seconds', value: timeLeft.seconds },
    ],
    [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds],
  );

  return (
    <div
      className={[
        'w-full rounded-[2rem] border border-secondary/15 bg-card/14 p-4 shadow-2xl backdrop-blur-xl',
        'animate-in fade-in duration-700',
        className,
      ].join(' ')}
    >
      <div className="rounded-[1.6rem] border border-secondary/15 bg-primary/70 p-4 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)] sm:p-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary/80 sm:text-xs">
          {launchLabel}
        </p>

        {timeLeft.isLive ? (
          <div
            aria-live="polite"
            className="mt-5 rounded-[1.4rem] border border-secondary/15 bg-card/30 px-5 py-8 text-center shadow-lg"
          >
            <p className="text-balance text-xl font-heading font-bold text-secondary sm:text-2xl">
              {liveMessage}
            </p>
          </div>
        ) : (
          <div
            aria-live="polite"
            className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 animate-pulse"
            style={{ animationDuration: '5s' }}
          >
            {countdownUnits.map((unit) => (
              <div
                key={unit.label}
                className="rounded-[1.35rem] border border-secondary/15 bg-card/32 px-3 py-4 text-center shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="text-[clamp(2rem,8vw,4rem)] font-heading font-extrabold leading-none tracking-tight text-secondary">
                  {unit.value}
                </div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary/70 sm:text-xs">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}