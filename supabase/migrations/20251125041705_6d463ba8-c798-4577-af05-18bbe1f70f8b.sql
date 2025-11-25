-- Fix infinite recursion in driver_profiles and courier_profiles RLS policies

-- Drop problematic policies on driver_profiles
DROP POLICY IF EXISTS "Authenticated users can view driver profiles (test-wide)" ON driver_profiles;
DROP POLICY IF EXISTS "Authenticated users can view available drivers" ON driver_profiles;

-- Drop problematic policies on courier_profiles  
DROP POLICY IF EXISTS "Authenticated users can view courier profiles (test-wide)" ON courier_profiles;