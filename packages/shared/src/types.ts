import { PaymentMethod, RideType, TripStatus, UserRole } from "./enums";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface FareEstimate {
  rideType: RideType;
  distanceKm: number;
  durationMin: number;
  fare: number;
  currency: string;
}

export interface RideRequestPayload {
  pickup: LatLng;
  pickupAddress: string;
  destination: LatLng;
  destinationAddress: string;
  rideType: RideType;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface TripDto {
  id: string;
  status: TripStatus;
  rideType: RideType;
  fare: number;
  pickupAddress: string;
  destinationAddress: string;
  passengerId: string;
  driverId?: string;
  createdAt: string;
}

export interface DriverLocationUpdate {
  tripId: string;
  driverId: string;
  location: LatLng;
  heading?: number;
}

export const SOCKET_EVENTS = {
  TRIP_REQUESTED: "trip:requested",
  TRIP_ACCEPTED: "trip:accepted",
  TRIP_REJECTED: "trip:rejected",
  TRIP_STATUS_UPDATED: "trip:status_updated",
  TRIP_CANCELLED: "trip:cancelled",
  DRIVER_LOCATION_UPDATE: "driver:location_update",
  DRIVER_AVAILABILITY_CHANGED: "driver:availability_changed",
} as const;
