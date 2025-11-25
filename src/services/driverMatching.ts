import { supabase } from '@/integrations/supabase/client';

export interface DriverProposal {
  driverId: string;
  driverName: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  distance: number;
  proposedTopUpFare: number;
  totalFare: number;
  proposedAt: string;
}

export interface BeamingConfig {
  initialRadius: number; // meters
  maxRadius: number; // meters
  radiusIncrement: number; // meters
  timeoutPerRadius: number; // milliseconds
  maxDriversPerBeam: number;
}

export const DEFAULT_BEAMING_CONFIG: BeamingConfig = {
  initialRadius: 200,
  maxRadius: 10000, // 10km
  radiusIncrement: 200,
  timeoutPerRadius: 45000, // 45 seconds
  maxDriversPerBeam: 3,
};

export const driverMatchingService = {
  // Find available drivers within radius
  async findDriversInRadius(
    pickupLat: number,
    pickupLng: number,
    radius: number,
    rideType: string,
    excludeDriverIds: string[] = []
  ) {
    // For now, use fallback since RPC might not exist yet
    return this.findDriversFallback(pickupLat, pickupLng, radius, rideType, excludeDriverIds);
  },

  // Fallback method using client-side filtering with secure view
  async findDriversFallback(
    pickupLat: number,
    pickupLng: number,
    radius: number,
    rideType: string,
    excludeDriverIds: string[] = []
  ) {
    // Use the secure view that only exposes safe driver data
    const { data: drivers, error } = await supabase
      .from('available_drivers_safe')
      .select('*');

    if (error) throw error;

    // Calculate distances and filter by radius using approximate coordinates
    const driversWithDistance = (drivers || [])
      .map((driver: any) => {
        const distance = this.calculateDistance(
          pickupLat,
          pickupLng,
          driver.approximate_lat,
          driver.approximate_lng
        );
        return { 
          id: driver.id,
          user_id: driver.user_id,
          vehicle_type: driver.vehicle_type,
          rating: driver.rating,
          distance 
        };
      })
      .filter((driver: any) => 
        driver.distance <= radius && 
        !excludeDriverIds.includes(driver.id)
      )
      .sort((a: any, b: any) => a.distance - b.distance);

    return driversWithDistance.slice(0, DEFAULT_BEAMING_CONFIG.maxDriversPerBeam);
  },

  // Calculate distance using Haversine formula (in meters)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadius = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  // Start beaming process for a ride
  async startBeaming(
    rideId: string,
    pickupLat: number,
    pickupLng: number,
    rideType: string,
    config: BeamingConfig = DEFAULT_BEAMING_CONFIG
  ): Promise<{ success: boolean; message: string }> {
    let currentRadius = config.initialRadius;
    const notifiedDrivers: string[] = [];

    while (currentRadius <= config.maxRadius) {
      // Find drivers in current radius
      const drivers = await this.findDriversInRadius(
        pickupLat,
        pickupLng,
        currentRadius,
        rideType,
        notifiedDrivers
      );

      if (drivers.length > 0) {
        // Update ride with current search status
        await supabase
          .from('rides')
          .update({
            search_radius: currentRadius,
            drivers_notified: [...notifiedDrivers, ...drivers.map((d: any) => d.id)] as any,
            status: 'requested' as any,
          })
          .eq('id', rideId);

        // Add driver IDs to notified list
        notifiedDrivers.push(...drivers.map((d: any) => d.id));

        // Notify drivers (this would typically trigger push notifications)
        console.log(`Beamed to ${drivers.length} drivers at ${currentRadius}m radius`);

        // Wait for timeout before expanding radius
        await new Promise((resolve) => setTimeout(resolve, config.timeoutPerRadius));

        // Check if any driver has proposed
        const { data: ride } = await supabase
          .from('rides')
          .select('status, proposals')
          .eq('id', rideId)
          .single();

        if (ride?.proposals && Array.isArray(ride.proposals) && ride.proposals.length > 0) {
          return { success: true, message: 'Driver proposals received' };
        }
      }

      // Expand radius
      currentRadius += config.radiusIncrement;
    }

    // Max radius reached without proposals
    await supabase
      .from('rides')
      .update({
        max_radius_reached: true,
        status: 'cancelled' as any,
      })
      .eq('id', rideId);

    return { success: false, message: 'No drivers found within maximum search radius' };
  },

  // Driver submits proposal (drivers can see their own full profile)
  async submitProposal(
    rideId: string,
    driverId: string,
    topUpFare: number,
    notes?: string
  ) {
    // Get current ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*, proposals')
      .eq('id', rideId)
      .single();

    if (rideError) throw rideError;

    // Driver can access their own profile (RLS allows this)
    const { data: driver, error: driverError } = await supabase
      .from('driver_profiles')
      .select('*, profiles:user_id(full_name)')
      .eq('id', driverId)
      .single();

    if (driverError) throw driverError;

    // Calculate distance if driver has location
    let distance = 0;
    if (driver.current_lat && driver.current_lng && ride.pickup_lat && ride.pickup_lng) {
      distance = this.calculateDistance(
        ride.pickup_lat,
        ride.pickup_lng,
        driver.current_lat,
        driver.current_lng
      );
    }

    // Create proposal object (only include safe data for passenger to see)
    const proposal: DriverProposal = {
      driverId: driver.id,
      driverName: (driver as any).profiles?.full_name || 'Driver',
      vehicleType: driver.vehicle_type,
      vehiclePlate: driver.vehicle_plate, // Only shown after acceptance
      rating: parseFloat(driver.rating?.toString() || '5'),
      distance: Math.round(distance),
      proposedTopUpFare: topUpFare,
      totalFare: (ride.base_fare || 0) + topUpFare,
      proposedAt: new Date().toISOString(),
    };

    // Add proposal to ride
    const currentProposals = Array.isArray(ride.proposals) ? ride.proposals : [];
    const updatedProposals = [...currentProposals, proposal];

    const { error: updateError } = await supabase
      .from('rides')
      .update({
        proposals: updatedProposals as any,
        status: 'requested' as any,
        negotiation_notes: notes || null,
      })
      .eq('id', rideId);

    if (updateError) throw updateError;

    return proposal;
  },

  // Passenger accepts a proposal
  async acceptProposal(rideId: string, driverId: string) {
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('proposals')
      .eq('id', rideId)
      .single();

    if (fetchError) throw fetchError;

    // Find the selected proposal
    const proposals = Array.isArray(ride.proposals) ? ride.proposals : [];
    const selectedProposal = proposals.find((p: any) => p.driverId === driverId);

    if (!selectedProposal) {
      throw new Error('Proposal not found');
    }

    // Update ride with accepted driver
    const { data, error } = await supabase
      .from('rides')
      .update({
        driver_id: driverId,
        top_up_fare: (selectedProposal as any).proposedTopUpFare,
        total_fare: (selectedProposal as any).totalFare,
        status: 'accepted' as any,
        negotiation_status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
