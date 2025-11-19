-- Add fare negotiation columns to rides table
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS proposed_top_up_fare numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'none' CHECK (negotiation_status IN ('none', 'pending', 'accepted', 'rejected')),
ADD COLUMN IF NOT EXISTS negotiation_notes text;