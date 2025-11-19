-- 1) Add account_number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_number text UNIQUE;

-- 2) Create wallet_accounts table
CREATE TABLE public.wallet_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('driver', 'courier')),
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_accounts
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_accounts
CREATE POLICY "Drivers and couriers can view their own wallet"
ON public.wallet_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
ON public.wallet_accounts
FOR SELECT
USING (has_role(auth.uid(), 'kx_admin'));

CREATE POLICY "Admins can insert wallets"
ON public.wallet_accounts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'kx_admin'));

CREATE POLICY "Admins can update wallets"
ON public.wallet_accounts
FOR UPDATE
USING (has_role(auth.uid(), 'kx_admin'));

-- 3) Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('load', 'deduct', 'adjust')),
  reference text,
  related_ride_id uuid REFERENCES public.rides(id),
  related_delivery_id uuid REFERENCES public.delivery_orders(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions
FOR SELECT
USING (has_role(auth.uid(), 'kx_admin'));

CREATE POLICY "Admins can insert transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'kx_admin'));

-- 4) Create wallet_apply_transaction function
CREATE OR REPLACE FUNCTION public.wallet_apply_transaction(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_reference text DEFAULT NULL,
  p_ride_id uuid DEFAULT NULL,
  p_delivery_id uuid DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
  v_user_role text;
BEGIN
  -- Get user role from profiles
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
  
  -- Ensure user is driver or courier
  IF v_user_role NOT IN ('driver', 'courier') THEN
    RAISE EXCEPTION 'User must be a driver or courier';
  END IF;

  -- Ensure wallet_accounts row exists
  INSERT INTO public.wallet_accounts (user_id, role, balance)
  VALUES (p_user_id, v_user_role, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current balance
  SELECT balance INTO v_current_balance 
  FROM public.wallet_accounts 
  WHERE user_id = p_user_id;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Check for insufficient funds on deduction
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    user_id, amount, type, reference, 
    related_ride_id, related_delivery_id, created_by
  ) VALUES (
    p_user_id, p_amount, p_type, p_reference,
    p_ride_id, p_delivery_id, p_actor_user_id
  );

  -- Update wallet balance
  UPDATE public.wallet_accounts 
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_new_balance;
END;
$$;

-- 5) Update trigger for wallet_accounts
CREATE OR REPLACE FUNCTION public.update_wallet_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER wallet_accounts_updated_at
BEFORE UPDATE ON public.wallet_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_updated_at();

-- 6) Enable realtime for wallet_accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_accounts;