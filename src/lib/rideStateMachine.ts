// Centralized Ride State Machine

export type RideStatus = 
| 'requested'
| 'accepted'
| 'arrived'
| 'in_progress'
| 'completed'
| 'cancelled';

export const RideStateMachine: Record<RideStatus, RideStatus[]> = {
    requested: ['accepted', 'cancelled'],
    accepted: ['arrived', 'cancelled'],
    arrived: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export function canTransition(
    from: RideStatus,
    to: RideStatus
): boolean {
    return RideStateMachine[from]?.includes(to) ?? false;
}