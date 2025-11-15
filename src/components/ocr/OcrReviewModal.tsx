import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DocType, ParsedData } from '@/types/kyc';
import { getFieldLabel } from '@/lib/ocr/fieldMaps';
import { AlertCircle } from 'lucide-react';

const OCR_MIN = Number(import.meta.env.VITE_OCR_CONFIDENCE_MIN ?? 0.65);

interface OcrReviewModalProps {
  open: boolean;
  onClose: () => void;
  docType: DocType;
  imageUrl: string;
  parsed: ParsedData;
  avgConfidence: number;
  onAccept: (finalParsed: ParsedData) => void;
}

export function OcrReviewModal({
  open,
  onClose,
  docType,
  imageUrl,
  parsed,
  avgConfidence,
  onAccept,
}: OcrReviewModalProps) {
  const [editedData, setEditedData] = useState<ParsedData>(parsed);
  const isBelowThreshold = docType !== 'SELFIE' && avgConfidence < OCR_MIN;

  useEffect(() => {
    setEditedData(parsed);
  }, [parsed]);

  const handleFieldChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const handleAccept = () => {
    onAccept(editedData);
    onClose();
  };

  const renderField = (key: string, value: any) => {
    if (key === 'field_confidences') return null;
    
    return (
      <div key={key} className="space-y-1">
        <Label htmlFor={key} className="text-sm">
          {getFieldLabel(key)}
        </Label>
        <Input
          id={key}
          value={String(value || '')}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          className="text-sm"
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Scanned Document</DialogTitle>
          <DialogDescription>
            Verify the extracted data and make any corrections needed
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Captured Image</h3>
            <img
              src={imageUrl}
              alt="Scanned document"
              className="w-full rounded-lg border border-border"
            />
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Extracted Data</h3>
              <div className="flex items-center gap-2">
                <Badge variant={isBelowThreshold ? 'destructive' : 'default'}>
                  {(avgConfidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Confidence Score</span>
                <span>{(avgConfidence * 100).toFixed(1)}%</span>
              </div>
              <Progress value={avgConfidence * 100} className="h-2" />
            </div>

            {isBelowThreshold && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-xs text-destructive">
                  Below confidence threshold ({(OCR_MIN * 100).toFixed(0)}%). Please review and correct the fields, or rescan for better quality.
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(editedData).map(([key, value]) => renderField(key, value))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Rescan
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleAccept}
                    disabled={isBelowThreshold}
                  >
                    Accept & Autofill
                  </Button>
                </span>
              </TooltipTrigger>
              {isBelowThreshold && (
                <TooltipContent>
                  Below confidence threshold - rescan or edit fields
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
