import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FareNegotiationAlertProps {
  open: boolean;
  baseFare: number;
  proposedFare: number;
  topUpAmount: number;
  reason: string;
  notes?: string;
  driverName?: string;
  onAccept: () => void;
  onReject: () => void;
  onCounterOffer: () => void;
}

export const FareNegotiationAlert = ({
  open,
  baseFare,
  proposedFare,
  topUpAmount,
  reason,
  notes,
  driverName,
  onAccept,
  onCounterOffer,
  onReject
}: FareNegotiationAlertProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>🚗 Driver Counter-Offer</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Original Fare:</span>
                <span className="font-semibold">₱{baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Proposed Fare:</span>
                <span className="text-2xl font-bold text-primary">₱{proposedFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Additional:</span>
                <span className="text-amber-600">+₱{topUpAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="text-sm">
                  <span className="font-semibold">Reason:</span> {reason}
                </div>
                {notes && (
                  <div className="text-sm mt-2">
                    <span className="font-semibold">Notes:</span> {notes}
                  </div>
                )}
                {driverName && (
                  <div className="text-sm mt-2 text-muted-foreground">
                    Driver: {driverName}
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReject}>Reject</AlertDialogCancel>
          <AlertDialogAction onClick={onCounterOffer}>Counter-Offer</AlertDialogAction>
          <AlertDialogAction onClick={onAccept}>Accept ₱{proposedFare.toFixed(2)}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
