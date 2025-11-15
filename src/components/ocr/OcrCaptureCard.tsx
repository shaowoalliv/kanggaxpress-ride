import { useState, useRef } from 'react';
import { Camera, Upload, X, Edit2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { performOcr, isConfidenceAcceptable } from '@/lib/ocrProvider';
import { DocType, ParsedData, KycStatus } from '@/types/kyc';
import { useToast } from '@/hooks/use-toast';

interface OcrCaptureCardProps {
  docType: DocType;
  label: string;
  onCapture: (data: ParsedData, confidence: number, imageDataUrl: string) => void;
  required?: boolean;
}

export function OcrCaptureCard({ docType, label, onCapture, required }: OcrCaptureCardProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [status, setStatus] = useState<KycStatus>('PENDING');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Using file upload instead.',
        variant: 'destructive',
      });
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    stopCamera();
    processImage(imageDataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      processImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setPreview(imageDataUrl);

    try {
      const result = await performOcr(imageDataUrl, docType);
      setConfidence(result.confidence);
      
      const acceptable = isConfidenceAcceptable(result.confidence);
      setStatus(acceptable ? 'PENDING' : 'REVIEW');

      onCapture(result.parsed, result.confidence, imageDataUrl);

      toast({
        title: 'Document Scanned',
        description: acceptable 
          ? 'Document processed successfully'
          : 'Low confidence - please review fields',
      });
    } catch (error: any) {
      toast({
        title: 'OCR Failed',
        description: error.message || 'Could not process document',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRescan = () => {
    setPreview(null);
    setConfidence(null);
    setStatus('PENDING');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">{label}</h4>
            {required && <span className="text-xs text-destructive">Required</span>}
          </div>
          {confidence !== null && (
            <Badge variant={isConfidenceAcceptable(confidence) ? 'default' : 'destructive'}>
              {status}
            </Badge>
          )}
        </div>

        {showCamera ? (
          <div className="space-y-2">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <div className="flex gap-2">
              <Button onClick={captureFromCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
              <Button onClick={stopCamera} variant="outline">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt={label}
              className="w-full h-32 object-cover rounded-lg"
            />
            {confidence !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Confidence</span>
                  <span>{Math.round(confidence * 100)}%</span>
                </div>
                <Progress value={confidence * 100} />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleRescan} variant="outline" size="sm" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Rescan
              </Button>
              <Button variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={startCamera}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Capture {label}
                </>
              )}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              or Upload File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
