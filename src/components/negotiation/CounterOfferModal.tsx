import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NegotiationReasonSelect, NEGOTIATION_REASONS } from "./NegotiationReasonSelect";

interface CounterOfferModalProps {
  open: boolean;
  onClose: () => void;
  baseFare: number;
  onSubmit: (topUpAmount: number, reason: string, notes: string) => Promise<void>;
}

export const CounterOfferModal = ({ open, onClose, baseFare, onSubmit }: CounterOfferModalProps) => {
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const proposedFare = baseFare + (parseFloat(topUpAmount) || 0);

  const handleSubmit = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || !reason) return;

    setLoading(true);
    try {
      const reasonLabel = NEGOTIATION_REASONS.find(r => r.value === reason)?.label || reason;
      await onSubmit(amount, reasonLabel, notes);
      onClose();
      setTopUpAmount('');
      setReason('');
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Counter-Offer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Base Fare</Label>
            <div className="text-2xl font-bold">₱{baseFare.toFixed(2)}</div>
          </div>

          <div>
            <Label htmlFor="topup">Top-up Amount</Label>
            <Input
              id="topup"
              type="number"
              min="1"
              step="1"
              placeholder="50"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </div>

          <div>
            <Label>Proposed Total Fare</Label>
            <div className="text-2xl font-bold text-primary">₱{proposedFare.toFixed(2)}</div>
          </div>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <NegotiationReasonSelect value={reason} onValueChange={setReason} />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Provide more details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!topUpAmount || !reason || loading}
          >
            {loading ? 'Submitting...' : 'Submit Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
