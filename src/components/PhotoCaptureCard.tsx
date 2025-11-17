import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoCaptureCardProps {
  title: string;
  description: string;
  onCapture: (imageBlob: Blob, imageUrl: string) => void;
  captured?: boolean;
}

export function PhotoCaptureCard({ title, description, onCapture, captured }: PhotoCaptureCardProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
    onCapture(file, imageUrl);
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {captured && <CheckCircle className="w-5 h-5 text-green-600" />}
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Captured" className="w-full h-48 object-cover rounded-lg border" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleClear}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Take or upload a photo</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id={`file-input-${title.replace(/\s+/g, '-')}`}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12"
              aria-label={`Capture ${title.toLowerCase()}`}
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
