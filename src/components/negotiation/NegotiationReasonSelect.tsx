import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NEGOTIATION_REASONS = [
  { value: 'traffic', label: 'Heavy traffic conditions' },
  { value: 'weather', label: 'Bad weather (rain/storm)' },
  { value: 'distance', label: 'Distance too far' },
  { value: 'late_night', label: 'Late night hours' },
  { value: 'peak_hours', label: 'Peak/rush hour' },
  { value: 'road_conditions', label: 'Poor road conditions/detour' },
  { value: 'high_demand', label: 'High demand period' },
  { value: 'other', label: 'Other (specify in notes)' }
];

interface NegotiationReasonSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const NegotiationReasonSelect = ({ value, onValueChange }: NegotiationReasonSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select reason" />
      </SelectTrigger>
      <SelectContent>
        {NEGOTIATION_REASONS.map((reason) => (
          <SelectItem key={reason.value} value={reason.value}>
            {reason.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
