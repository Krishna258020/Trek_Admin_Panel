/* ================= ENUMS ================= */

export enum CancellationPolicy {
  STANDARD = 'Standard',
  FLEXIBLE = 'Flexible'
}

export enum TrekStatus {
  UPCOMING = 'Upcoming',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NEEDS_APPROVAL = 'Needs Approval'
}

export enum CancellationRequestStatus {
  NONE = 'None',
  REQUESTED = 'Requested',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum TransportMode {
  TRAIN = 'Train',
  BUS = 'Bus',
  MINI_BUS = 'Mini Bus',
  CAR = 'Car'
}

/* ================= CORE ENTITIES ================= */

export interface Operator {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
}

export interface RouteStage {
  name: string;
  location?: string;
  date: string;
  time?: string;
  mode: TransportMode;
  point?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
}

export interface Activity {
  name: string;
  description?: string;
}

export interface TrekDetails {
  operatorContactNumber: string;
  route: {
    departureStages: RouteStage[];
    meetingPoint: RouteStage;
    trekStages: RouteStage[];
    returnStage: RouteStage;
  };
  itinerary: ItineraryDay[];
  activities: Activity[];
  inclusions: string[];
  exclusions: string[];
  otherPolicies: string[];
}

export interface ApprovalSnapshot {
  approvedBy: string;
  approvedAt: string;
  versionHash?: string;
}

/* ================= BOOKINGS ================= */

export interface Booking {
  id: string;
  date: string;
  travellerName: string;
  travellerDetails: string;
  subTravellerDetails?: string;
  slots: number;
  couponDetails?: string;
  finalBaseFare: number;
  gst5: number;
  pf: number;
  ti: number;
  tiPolicyId?: string;
  fc: number;
  fcPolicyId?: string;
  totalPaid: number;
  pendingAmount: number;
  isFullyPaid: boolean;
  comm10: number;
  platformShare: number;
  getComm18: number;
  getPF5: number;
  tcs1: number;
  tds1: number;
  taxes: number;
  vendorShare: number;
  status: 'Active' | 'Cancelled';
  supportTicket?: {
    id: string;
    status: 'OPEN' | 'CLOSED';
    date: string;
  };
  cxlId?: string;
  cxlTimeSlab?: string;
  refundAmount?: number;
  deductionAmount?: number;
  cxlReason?: string;
  cxlType?: 'System' | 'Manual-PostDeparture';
  remarks?: string;
}

/* ================= TBR ================= */

export interface TBR {
  id: string;
  trekName: string;
  destination: string;
  operator: Operator;
  departureTime: string;
  arrivalTime: string;
  soldSlots: number;
  totalSlots: number;
  slotPrice: number;
  isCancelled: boolean;
  isApproved: boolean;
  cancellationPolicy: CancellationPolicy;
  cancellationPolicyDesc: string;
  approvalDetails: ApprovalSnapshot | null;
  cancellationRequestStatus: CancellationRequestStatus;
  cancellationRequestedBy?: string;
  cancellationRequestedAt?: string;
  cancellationRequestReason?: string;
  captainName?: string;
  captainContact?: string;
  trekDetails?: TrekDetails;
  bookings: Booking[];
  cancellationDecision?: {
    by: string;
    at: string;
    notes: string;
  };
  captainId?: string;
  captainAssignedBy?: string;
  captainAssignedAt?: string;
}

/* ================= INVENTORY FILTERS ================= */

export interface InventoryFilters {
  tbrIdSearch?: string;
  operatorId?: string;
  destination?: string;
  policy?: CancellationPolicy;
  startDate?: string;
  endDate?: string;
  requestStatus?: CancellationRequestStatus;
}

/* ================= REQUESTS ================= */

export enum RequestType {
  EDIT_DETAILS = 'EDIT_DETAILS',
  BATCH_CANCELLATION = 'BATCH_CANCELLATION'
}

export interface Vendor {
  name: string;
  phone: string;
  email: string;
  score: number;
}

export interface VendorRequest {
  id: string;
  tbrId: string;
  trekStatus: TrekStatus;
  vendor: Vendor;
  serviceName: string;
  sourceCities: string[];
  destinations: string[];
  schedule: {
    departure: string;
    arrival: string;
  };
  requestedAt: string;
  type: RequestType;
  details: {
    captainChange?: {
      old: { name: string; phone: string; email: string };
      new: { name: string; phone: string; email: string };
    };
    accommodationChanges?: {
      night: string;
      old: string;
      new: string;
    }[];
    cancellationReason?: string;
    vendorRemarks?: string;
  };
}

/* ================= AUDIT LOG ================= */

export interface AuditEntry {
  id: string;
  actionTime: string;
  performer: {
    name: string;
    id: string;
  };
  tbr: {
    id: string;
    name: string;
  };
  action: string;
  reason: string;
}

/* ================= NAVIGATION ================= */

export type AppView =
  | 'inventory'
  | 'requests'
  | 'audit'
  | 'details'
  | 'bookings';

export type TimelineDirection = 'prev' | 'next';
