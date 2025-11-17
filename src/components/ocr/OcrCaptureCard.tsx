import { useState, useRef } from 'react';
import { Camera, Upload, X, Edit2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { performOcr, isConfidenceAcceptable } from '@/lib/ocrProvider';
import { mapFieldsToSchema } from '@/lib/ocr/fieldMaps';
import { OcrReviewModal } from './OcrReviewModal';
import { DocType, ParsedData, KycStatus } from '@/types/kyc';
import { useToast } from '@/hooks/use-toast';

interface OcrCaptureCardProps {
  docType: DocType;
  label?: string;
  onCapture?: (data: ParsedData, confidence: number, imageDataUrl: string) => void;
  onOcrComplete?: (parsed: ParsedData, imageUrl: string, imageBlob: Blob, avgConfidence: number) => void;
  required?: boolean;
}

export function OcrCaptureCard({ docType, label, onCapture, onOcrComplete, required }: OcrCaptureCardProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [status, setStatus] = useState<KycStatus>('PENDING');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
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
      const normalized = mapFieldsToSchema(docType, result.parsed);
      
      setConfidence(result.confidence);
      setParsedData(normalized);
      
      const acceptable = isConfidenceAcceptable(result.confidence);
      setStatus(acceptable ? 'PENDING' : 'REVIEW');

      // Convert dataURL to Blob
      const blob = await fetch(imageDataUrl).then(r => r.blob());

      // Use onOcrComplete if provided, otherwise use legacy onCapture
      if (onOcrComplete) {
        onOcrComplete(normalized, imageDataUrl, blob, result.confidence);
      } else {
        // Open review modal for legacy usage
        setShowReviewModal(true);
      }

      toast({
        title: 'Document Scanned',
        description: onOcrComplete ? 'Review the extracted data' : 'Review and confirm the extracted data',
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

  const handleAcceptReview = (finalParsed: ParsedData) => {
    if (preview && confidence !== null && onCapture) {
      onCapture(finalParsed, confidence, preview);
      toast({
        title: 'Data Accepted',
        description: 'Fields have been autofilled',
      });
    }
  };

  const handleRescan = () => {
    setPreview(null);
    setConfidence(null);
    setStatus('PENDING');
    setParsedData(null);
  };

  return (
    <>
      {parsedData && preview && confidence !== null && (
        <OcrReviewModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          docType={docType}
          imageUrl={preview}
          parsed={parsedData}
          avgConfidence={confidence}
          onAccept={handleAcceptReview}
        />
      )}
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
              className="w-full h-12 flex items-center justify-center"
              disabled={isProcessing}
              aria-label={isProcessing ? "Processing image" : `Capture ${label}`}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Camera className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">Capture {label}</span>
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
    </>
  );
}
