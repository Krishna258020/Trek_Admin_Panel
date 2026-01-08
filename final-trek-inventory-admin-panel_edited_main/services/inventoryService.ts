
import { TBR, InventoryFilters, TrekStatus, TimelineDirection, CancellationRequestStatus } from '../types';
import { MOCK_TBR_DATA } from '../constants';

/**
 * DETERMINISTIC STORE
 * Simulates a persistent backend database for the duration of the session.
 */
let TBRStore: TBR[] = [...MOCK_TBR_DATA];

/**
 * STATUS DERIVATION ENGINE (Single Source of Truth)
 */
export const deriveTrekStatus = (tbr: TBR, currentTime: Date = new Date()): TrekStatus => {
  // Manual Cancel or Approved Request = Cancelled (Highest Priority)
  if (tbr.isCancelled || tbr.cancellationRequestStatus === CancellationRequestStatus.APPROVED) {
    return TrekStatus.CANCELLED;
  }
  
  // Approval Governance
  if (!tbr.isApproved) return TrekStatus.NEEDS_APPROVAL;

  const departure = new Date(tbr.departureTime);
  const arrival = new Date(tbr.arrivalTime);

  // Timeline Derivation
  if (currentTime < departure) return TrekStatus.UPCOMING;
  if (currentTime >= departure && currentTime < arrival) return TrekStatus.ONGOING;
  return TrekStatus.COMPLETED;
};

/**
 * BOOKING RULE ENFORCEMENT
 */
export const isBookable = (tbr: TBR, currentTime: Date = new Date()): boolean => {
  const availableSlots = tbr.totalSlots - tbr.soldSlots;
  const departure = new Date(tbr.departureTime);
  const status = deriveTrekStatus(tbr, currentTime);
  
  return (
    status === TrekStatus.UPCOMING &&
    !tbr.isCancelled && 
    tbr.isApproved &&
    tbr.cancellationRequestStatus === CancellationRequestStatus.NONE && 
    availableSlots > 0 && 
    currentTime < departure
  );
};

/**
 * ALERT SYSTEM (Global Monitor)
 */
export const getGlobalPendingAlertCount = (): number => {
  return TBRStore.filter(t => t.cancellationRequestStatus === CancellationRequestStatus.REQUESTED).length;
};

/**
 * DETERMINISTIC QUERY PIPELINE
 */
export const fetchInventory = (
  filters: InventoryFilters,
  timelineAnchor: string
): TBR[] => {
  const now = new Date();
  
  // 1. IDENTITY FILTER (Short-circuit)
  if (filters.tbrIdSearch) {
    return TBRStore.filter(t => t.id.toLowerCase() === filters.tbrIdSearch?.toLowerCase());
  }

  let results = [...TBRStore];

  // 2. ENTITY FILTERS (Operator)
  // If Operator is selected, status restrictions are disabled.
  const hasOperatorFilter = !!filters.operatorId;
  if (hasOperatorFilter) {
    results = results.filter(t => t.operator.id === filters.operatorId);
  }

  // 3. TEMPORAL FILTERS (Date Range / Timeline Anchor)
  const hasDateRange = !!(filters.startDate || filters.endDate);
  if (hasDateRange) {
    results = results.filter(t => {
      const arrival = new Date(t.arrivalTime);
      const startMatch = filters.startDate ? arrival >= new Date(filters.startDate) : true;
      const endMatch = filters.endDate ? arrival <= new Date(filters.endDate) : true;
      return startMatch && endMatch;
    });
  } else if (!hasOperatorFilter) {
    // Apply Default 7-day Window only if no Operator or Date Range is set
    const anchorDate = new Date(timelineAnchor);
    const windowEnd = new Date(anchorDate);
    windowEnd.setDate(anchorDate.getDate() + 7);
    
    results = results.filter(t => {
      const arrival = new Date(t.arrivalTime);
      return arrival >= anchorDate && arrival <= windowEnd;
    });
  }

  // 4. ATTRIBUTE FILTERS (Destination / Policy / Request Status)
  if (filters.destination) {
    results = results.filter(t => t.destination === filters.destination);
    // Destination filter only shows Ongoing + Upcoming
    results = results.filter(t => {
      const s = deriveTrekStatus(t, now);
      return s === TrekStatus.ONGOING || s === TrekStatus.UPCOMING;
    });
  }

  if (filters.policy) {
    results = results.filter(t => t.cancellationPolicy === filters.policy);
  }

  if (filters.requestStatus) {
    results = results.filter(t => t.cancellationRequestStatus === filters.requestStatus);
  }

  // 5. DEFAULT RULES (Fallback)
  // When no filters, only show Ongoing + Upcoming for the anchor window
  if (!hasOperatorFilter && !hasDateRange && !filters.destination && !filters.requestStatus) {
    results = results.filter(t => {
      const s = deriveTrekStatus(t, now);
      return s === TrekStatus.ONGOING || s === TrekStatus.UPCOMING;
    });
  }

  // 6. STABLE SORTING
  return results.sort((a, b) => {
    const statusA = deriveTrekStatus(a, now);
    const statusB = deriveTrekStatus(b, now);

    const getPriority = (s: TrekStatus) => {
      if (s === TrekStatus.ONGOING) return 0;
      if (s === TrekStatus.UPCOMING) return 1;
      return 2;
    };

    if (getPriority(statusA) !== getPriority(statusB)) {
      return getPriority(statusA) - getPriority(statusB);
    }
    
    // Primary Axis: Arrival Date & Time (ASC)
    return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
  });
};

/**
 * MUTATION HANDLERS (Hardened)
 */
export const updateTBR = (id: string, updates: Partial<TBR>) => {
  TBRStore = TBRStore.map(t => t.id === id ? { ...t, ...updates } : t);
  return [...TBRStore];
};

export const getTBRStore = () => [...TBRStore];
