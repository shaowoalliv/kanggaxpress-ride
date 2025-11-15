import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { KanggaLogo } from '@/components/KanggaLogo';
import { Helmet } from 'react-helmet';

export default function HeroAnim() {
  const [amplitude, setAmplitude] = useState(8);
  const [duration, setDuration] = useState(3.4);
  const [reduceMotion, setReduceMotion] = useState(false);

  const handleReset = () => {
    setAmplitude(8);
    setDuration(3.4);
    setReduceMotion(false);
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-background p-8" data-testid="qa-hero-anim">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Carabao Logo Animation QA
            </h1>
            <p className="text-muted-foreground">
              Test and adjust the KanggaXpress logo animation parameters
            </p>
          </div>

          {/* Logo Preview */}
          <Card className="p-12 bg-card flex flex-col items-center justify-center">
            <div 
              className={reduceMotion ? 'reduce-motion-wrapper' : ''}
              style={{
                ['--carabao-amplitude' as string]: `${amplitude}px`,
                ['--carabao-duration' as string]: `${duration}s`,
              }}
            >
              <KanggaLogo width={200} height={200} className="w-48 h-48" />
            </div>
            <div className="mt-6 text-center">
              <h2 className="font-heading font-bold text-xl text-foreground">
                KanggaXpress
              </h2>
              <p className="text-sm text-muted-foreground">
                Rooted in Tradition
              </p>
            </div>
          </Card>

          {/* Controls */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Animation Controls
            </h2>

            {/* Reduce Motion Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduce-motion" className="text-base">
                  Reduce Motion
                </Label>
                <p className="text-sm text-muted-foreground">
                  Simulate prefers-reduced-motion setting
                </p>
              </div>
              <Switch
                id="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={setReduceMotion}
                data-testid="qa-hero-reduce-motion"
              />
            </div>

            {/* Amplitude Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amplitude" className="text-base">
                  Amplitude
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {amplitude}px
                </span>
              </div>
              <Slider
                id="amplitude"
                min={2}
                max={12}
                step={0.5}
                value={[amplitude]}
                onValueChange={(value) => setAmplitude(value[0])}
                data-testid="qa-hero-amplitude"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Range: 2–12 px (default: 8 px)
              </p>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="duration" className="text-base">
                  Duration
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {duration.toFixed(1)}s
                </span>
              </div>
              <Slider
                id="duration"
                min={2.8}
                max={4.2}
                step={0.1}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                data-testid="qa-hero-duration"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Range: 2.8–4.2 s (default: 3.4 s)
              </p>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-border">
              <Button onClick={handleReset} variant="outline" className="w-full">
                Reset to Defaults
              </Button>
            </div>
          </Card>

          {/* Current Values Display */}
          <Card className="p-6 bg-muted/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Current Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Amplitude:</span>{' '}
                <span className="text-foreground font-semibold">{amplitude}px</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>{' '}
                <span className="text-foreground font-semibold">{duration.toFixed(1)}s</span>
              </div>
              <div>
                <span className="text-muted-foreground">Motion:</span>{' '}
                <span className="text-foreground font-semibold">
                  {reduceMotion ? 'Reduced' : 'Normal'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <style>{`
          .reduce-motion-wrapper .carabao-anim {
            animation: none !important;
            transform: translateY(0) !important;
          }
        `}</style>
      </div>
    </>
  );
}
