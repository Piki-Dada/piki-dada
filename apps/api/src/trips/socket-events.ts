export const SOCKET_EVENTS = {
  TRIP_REQUESTED: 'trip:requested',
  TRIP_ACCEPTED: 'trip:accepted',
  TRIP_REJECTED: 'trip:rejected',
  TRIP_STATUS_UPDATED: 'trip:status_updated',
  TRIP_CANCELLED: 'trip:cancelled',
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  DRIVER_AVAILABILITY_CHANGED: 'driver:availability_changed',
} as const;
