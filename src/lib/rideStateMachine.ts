// Centralized Ride State Machine

export type RideState =
    | 'requested'
    | 'accepted'
    | 'arrived'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export const RideStateMachine: Record<RideState, RideState[]> = {
    requested: ['accepted', 'cancelled'],
    accepted: ['arrived', 'cancelled'],
    arrived: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export function canTransition(
    from: RideState,
    to: RideState
): boolean {
    return RideStateMachine[from]?.includes(to) ?? false;
}