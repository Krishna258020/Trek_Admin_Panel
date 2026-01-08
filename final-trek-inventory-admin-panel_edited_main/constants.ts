
import { TBR, CancellationPolicy, Operator, CancellationRequestStatus, TransportMode, TrekDetails, Booking } from './types';

export const OPERATORS: Operator[] = [
  { id: 'OP-001', name: 'Alpine Explorers', rating: 4.8, reviewCount: 1250 },
  { id: 'OP-002', name: 'Himalayan Trails', rating: 4.5, reviewCount: 890 },
  { id: 'OP-003', name: 'Summit Seekers', rating: 4.9, reviewCount: 2100 },
];

export const CAPTAINS = [
  { id: 'CPT-701', name: 'Tenzing Norgay', contact: '+91 98765 00001' },
  { id: 'CPT-702', name: 'Junko Tabei', contact: '+91 98765 00002' },
  { id: 'CPT-703', name: 'Reinhold Messner', contact: '+91 98765 00003' },
];

export const DESTINATIONS = [
  'Rohtang Pass',
  'Everest Base Camp',
  'Hampta Pass',
  'Valley of Flowers',
  'Kedarnath',
  'Kashmir Great Lakes',
  'Goechala',
  'Sandakphu'
];

const generateBookings = (count: number, slotPrice: number, policy: CancellationPolicy): Booking[] => {
  return Array.from({ length: count }).map((_, i) => {
    const status: 'Active' | 'Cancelled' = (i === 4) ? 'Cancelled' : 'Active';
    const slots = i % 3 === 0 ? 2 : 1;
    
    const couponValue = i === 0 ? 1000 : 0;
    const finalBaseFare = (slotPrice * slots) - couponValue;
    
    const gst5 = finalBaseFare * 0.05;
    const pf = 9.52;
    const ti = i % 2 === 0 ? 150 : 0;
    const fc = policy === CancellationPolicy.STANDARD ? 500 : 0;
    
    const totalPayable = finalBaseFare + gst5 + pf + ti + fc;
    
    const isFullyPaid = policy === CancellationPolicy.STANDARD || i % 2 === 0;
    const totalPaid = isFullyPaid ? totalPayable : (999 * slots);
    const pendingAmount = totalPayable - totalPaid;
    
    const comm10 = finalBaseFare * 0.10;
    const platformShare = comm10 + pf;
    
    const getComm18 = comm10 * 0.18;
    const getPF5 = pf * 0.05;
    const tcs1 = totalPaid * 0.01;
    const tds1 = totalPaid * 0.01;
    const taxes = getComm18 + getPF5 + tcs1 + tds1;
    
    const vendorShare = totalPaid - platformShare - taxes;

    return {
      id: `BK${700 + i}${String.fromCharCode(65 + (i % 26))}`,
      date: '12 May 2024 05:00 pm',
      travellerName: ['Abhishek', 'Priya', 'Vikram Singh', 'Meera Deshpande', 'Siddharth', 'Ananya'][i % 6],
      travellerDetails: '24 / M',
      subTravellerDetails: slots > 1 ? 'Guest Traveller' : undefined,
      slots,
      couponDetails: i === 0 ? 'NEWYEAR (₹1000)' : undefined,
      finalBaseFare,
      gst5,
      pf,
      ti,
      tiPolicyId: ti > 0 ? 'TI-FLX-R44' : undefined,
      fc,
      fcPolicyId: fc > 0 ? 'FC-STD-P10' : undefined,
      totalPaid,
      pendingAmount,
      isFullyPaid,
      comm10,
      platformShare,
      getComm18,
      getPF5,
      tcs1,
      tds1,
      taxes,
      vendorShare,
      status,
      supportTicket: i === 2 ? {
        id: `HTK-99${i}`,
        status: 'OPEN',
        date: '15 May 2024 10:00 am'
      } : undefined,
      cxlId: status === 'Cancelled' ? `CXL-${300 + i}` : undefined,
      cxlTimeSlab: status === 'Cancelled' ? '>24H' : undefined,
      refundAmount: status === 'Cancelled' ? (totalPaid - 10) : undefined,
      deductionAmount: status === 'Cancelled' ? 10 : undefined,
      cxlReason: status === 'Cancelled' ? 'Personal Emergency' : undefined
    };
  });
};

const generateMockTBRs = (): TBR[] => {
  const tbrs: TBR[] = [];
  
  // High density dates as requested: Dec 11-26
  const decDates = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26];
  let globalId = 8000;

  decDates.forEach((day, idx) => {
    const departure = new Date(2024, 11, day, 8, 0, 0); 
    const arrival = new Date(departure);
    arrival.setDate(departure.getDate() + 3);
    const policy = idx % 2 === 0 ? CancellationPolicy.FLEXIBLE : CancellationPolicy.STANDARD;
    const slotPrice = 4500 + (day * 20);
    const soldSlots = 8 + (idx % 6);

    tbrs.push({
      id: `TBR-${globalId++}`,
      trekName: `${DESTINATIONS[idx % DESTINATIONS.length]} Winter Trek`,
      destination: DESTINATIONS[idx % DESTINATIONS.length],
      operator: OPERATORS[idx % OPERATORS.length],
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      soldSlots,
      totalSlots: 20,
      slotPrice,
      isCancelled: false,
      isApproved: true,
      cancellationPolicy: policy,
      cancellationPolicyDesc: `${policy} Historical Policy`,
      approvalDetails: { approvedBy: "System Migration", approvedAt: "01 Dec 2024", versionHash: `VH-DEC-${globalId}` },
      cancellationRequestStatus: CancellationRequestStatus.NONE,
      bookings: generateBookings(soldSlots, slotPrice, policy),
      trekDetails: {
        operatorContactNumber: "+91 99887 76655",
        route: {
          departureStages: [{ name: "Central Point", date: departure.toISOString(), mode: TransportMode.BUS }],
          meetingPoint: { name: "Village Entry", date: departure.toISOString(), mode: TransportMode.CAR },
          trekStages: [{ name: "High Ridge", date: departure.toISOString(), mode: TransportMode.MINI_BUS }],
          returnStage: { name: "Central Point", date: arrival.toISOString(), mode: TransportMode.BUS }
        },
        itinerary: [{ dayNumber: 1, title: "Arrival", description: "Winter Setup" }],
        activities: [{ name: "Night Hike", description: "Star Gazing" }],
        inclusions: ["All meals"], exclusions: ["Alcohol"], otherPolicies: ["Zero Waste"]
      }
    });
  });

  // Current/Future
  const now = new Date();
  const offsets = [0, 1, 4, 8, 15, 22, 35, 50];
  offsets.forEach((offset, idx) => {
    const departure = new Date(now);
    departure.setDate(now.getDate() + offset);
    const arrival = new Date(departure);
    arrival.setDate(departure.getDate() + 4);
    const policy = idx % 2 === 0 ? CancellationPolicy.FLEXIBLE : CancellationPolicy.STANDARD;
    
    tbrs.push({
      id: `TBR-${globalId++}`,
      trekName: `${DESTINATIONS[(idx + 4) % DESTINATIONS.length]} Adventure`,
      destination: DESTINATIONS[(idx + 4) % DESTINATIONS.length],
      operator: OPERATORS[idx % OPERATORS.length],
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      soldSlots: 12,
      totalSlots: 30,
      slotPrice: 6500,
      isCancelled: false,
      isApproved: true,
      cancellationPolicy: policy,
      cancellationPolicyDesc: `${policy} Policy T&C`,
      approvalDetails: { approvedBy: "Admin Alex", approvedAt: now.toISOString(), versionHash: `VH-NW-${globalId}` },
      cancellationRequestStatus: CancellationRequestStatus.NONE,
      bookings: generateBookings(12, 6500, policy),
      trekDetails: {
        operatorContactNumber: "+91 90000 00001",
        route: {
          departureStages: [{ name: "City Hub", date: departure.toISOString(), mode: TransportMode.BUS }],
          meetingPoint: { name: "Base Camp", date: departure.toISOString(), mode: TransportMode.CAR },
          trekStages: [{ name: "Ridge Cross", date: departure.toISOString(), mode: TransportMode.MINI_BUS }],
          returnStage: { name: "City Hub", date: arrival.toISOString(), mode: TransportMode.BUS }
        },
        itinerary: [{ dayNumber: 1, title: "Day 1", description: "Start of journey" }],
        activities: [{ name: "Climbing", description: "Intro session" }],
        inclusions: ["Safety Gear"], exclusions: ["Insurance"], otherPolicies: ["Eco-friendly"]
      }
    });
  });

  return tbrs;
};

export const MOCK_TBR_DATA = generateMockTBRs();
