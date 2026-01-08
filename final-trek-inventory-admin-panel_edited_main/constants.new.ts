import {
  TrekStatus,
  CancellationPolicy,
  VendorRequest,
  RequestType,
  AuditEntry
} from './types';


const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const formatDate = (date: Date) => {
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (date: Date) => {
  return date.toLocaleString('en-IN', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true 
  });
};

const getTodayStr = () => formatDateTime(new Date());

const SHARED_TREK_CONTENT = {
  serviceName: 'Kedarnath + Badrinath + Tungnath',
  sourceCities: ['Bangalore', 'Hyderabad'],
  destinations: ['Kedarnath, Uttarakhand'],
  duration: '7D 6N',
  policy: CancellationPolicy.STANDARD,

  operator: {
    name: 'Himalayan Adventures',
    tier: 'Platinum' as const,
    credibilityScore: 4.8,
    phone: '+91 98765 43210',
    email: 'bookings@himalayanadv.com',
    logo: 'https://picsum.photos/seed/himalayan/100/100'
  },
  captain: {
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.capt@himalayan.com'
  },
  gallery: [
    { type: 'video' as const, url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/keda1/800/600' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/keda2/800/600' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/keda3/800/600' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/keda4/800/600' },
  ],
  itinerary: [
    { day: 1, title: 'Arrival in Delhi, Drive to Rishikesh', activities: ['Check-in and rest', 'Evening Ganga Aarti'] },
    { day: 2, title: 'Drive to Guptkashi', activities: ['Scenic mountain views', 'Check-in and rest'] },
    { day: 3, title: 'Drive to Sonprayag, Trek to Kedarnath', activities: ['Temple Darshan', 'Overnight stay near temple'] },
    { day: 4, title: 'Trek down from Kedarnath', activities: ['Drive to Badrinath', 'Visit Badrinath Temple'] },
    { day: 5, title: 'Visit Tungnath Temple', activities: ['Drive to Rudraprayag'] },
    { day: 6, title: 'Drive back to Delhi', activities: ['Tour concludes on arrival'] },
  ],
  routeMap: [
    { type: 'BOARDING' as const, mode: 'TRAIN', location: 'Bangalore Railway Station', dateTime: '11:30 am' },
    { type: 'BOARDING' as const, mode: 'TRAIN', location: 'Kacheguda Railway Station, Hyderabad', dateTime: '01:30 pm' },
    { type: 'TREK POINT' as const, mode: 'BUS', location: 'Delhi', dateTime: '12:00 pm' },
    { type: 'RETURN' as const, mode: 'BUS', location: 'Delhi', dateTime: '01:30 am' },
  ],
  inclusions: ['Accommodation', 'Transportation from Delhi', 'Certified Guide', 'All Meals', 'Permits'],
  exclusions: ['Personal Expenses', 'Personal Equipment', 'Extra Meals', 'Travel to Delhi'],
  accommodations: [
    { night: 1, details: '3-star Hotel at Rishikesh' },
    { night: 2, details: 'Guesthouse at Guptkashi' },
    { night: 3, details: 'Dormitory at Kedarnath' },
    { night: 4, details: 'Hotel at Badrinath' },
    { night: 5, details: 'Hotel at Rudraprayag' },
  ],
  activities: [
    { category: 'OUTDOOR', items: ['Camping', 'Campfire', 'Car ride'] },
    { category: 'NATURE', items: ['Bird Watching', 'Mountain Gazing'] },
    { category: 'SPIRITUAL', items: ['Temple Visits', 'Aarti Ceremony'] },
    { category: 'ADVENTURE', items: ['Rappelling', 'Rock Climbing'] },
  ],
  policies: ['No refunds on cancellation.', 'Consumption of liquor is strictly prohibited.'],
  approval: {
    agentName: 'Admin Alex',
    agentId: 'AGENT-001',
    dateTime: '10/04/2025 11:30 AM'
  }
};

const SERIES_PRICING = { original: 6500, discounted: 6500 };

export const MOCK_TREKS: Trek[] = [
  // Previous Week (Completed)
  ...Array.from({ length: 18 }).map((_, i) => ({
    ...SHARED_TREK_CONTENT,
    id: `TBR-80${i}`,
    seriesId: 'SERIES-KED',
    status: TrekStatus.COMPLETED,
    departureDate: formatDate(addDays(-14 + (i % 3))),
    departureTime: '04:05 PM',
    arrivalDate: formatDate(addDays(-10 + (i % 3))),
    arrivalTime: '04:05 PM',
    pricing: SERIES_PRICING,
    slots: { total: 30, booked: 30 }
  })),

  // Present Week (Ongoing/Upcoming)
  ...Array.from({ length: 20 }).map((_, i) => ({
    ...SHARED_TREK_CONTENT,
    id: `TBR-90${i}`,
    serviceName: i % 2 === 0 ? 'Kedarnath Adventure' : 'Kashmir Great Lakes Adventure',
    destinations: [i % 2 === 0 ? 'Kedarnath' : 'Kashmir Great Lakes'],
    seriesId: i % 2 === 0 ? 'SERIES-KED' : 'SERIES-KGL',
    status: i < 5 ? TrekStatus.ACTIVE : TrekStatus.UPCOMING,
    departureDate: formatDate(addDays(i < 5 ? -1 : i - 4)),
    departureTime: '04:05 PM',
    arrivalDate: formatDate(addDays(i < 5 ? 3 : i + 1)),
    arrivalTime: '04:05 PM',
    pricing: SERIES_PRICING,
    slots: { total: 30, booked: 12 + (i % 10) }
  })),

  // Forward Weeks
  ...Array.from({ length: 10 }).map((_, i) => ({
    ...SHARED_TREK_CONTENT,
    id: `TBR-100${i}`,
    seriesId: 'SERIES-KED',
    status: TrekStatus.UPCOMING,
    departureDate: formatDate(addDays(14 + i)),
    departureTime: '04:05 PM',
    arrivalDate: formatDate(addDays(18 + i)),
    arrivalTime: '04:05 PM',
    pricing: SERIES_PRICING,
    slots: { total: 30, booked: 2 }
  }))
];

export const MOCK_REQUESTS: VendorRequest[] = [
  {
    id: 'REQ-2001',
    tbrId: 'TBR-905',
    trekStatus: TrekStatus.UPCOMING,
    vendor: { name: 'Alpine Explorers', phone: '+91 99999 88888', email: 'ops@alpine.com', score: 4.5 },
    serviceName: 'Kedarnath Adventure',
    sourceCities: ['Bangalore'], destinations: ['Kedarnath'],
    schedule: { departure: 'In 5 Days', arrival: 'In 10 Days' },
    requestedAt: getTodayStr(),
    type: RequestType.EDIT_DETAILS,
    details: {
      accommodationChanges: [
        { night: 'Night 1', old: '3-star Hotel at Rishikesh', new: 'Standard Hotel with AC & Balcony' },
        { night: 'Night 2', old: 'Guesthouse at Guptkashi', new: 'Premium Guesthouse with River View' }
      ]
    }
  },
  {
    id: 'REQ-2002',
    tbrId: 'TBR-906',
    trekStatus: TrekStatus.UPCOMING,
    vendor: { name: 'Himalayan Trails', phone: '+91 98765 43210', email: 'ops@himalayan.com', score: 4.8 },
    serviceName: 'Kashmir Great Lakes Adventure',
    sourceCities: ['Srinagar'], destinations: ['Kashmir Great Lakes'],
    schedule: { departure: 'In 6 Days', arrival: 'In 12 Days' },
    requestedAt: getTodayStr(),
    type: RequestType.EDIT_DETAILS,
    details: {
      captainChange: {
        old: { name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@himalayan.com' },
        new: { name: 'Amit Negi', phone: '+91 91111 22222', email: 'amit@himalayan.com' }
      }
    }
  },
  {
    id: 'REQ-2003',
    tbrId: 'TBR-908',
    trekStatus: TrekStatus.UPCOMING,
    vendor: { name: 'Alpine Explorers', phone: '+91 99999 88888', email: 'ops@alpine.com', score: 4.5 },
    serviceName: 'Kedarnath Adventure',
    sourceCities: ['Bangalore'], destinations: ['Kedarnath'],
    requestedAt: getTodayStr(),
    type: RequestType.BATCH_CANCELLATION,
    schedule: { departure: 'In 10 Days', arrival: 'In 15 Days' },
    details: { cancellationReason: 'Due to a major landslide on the main access road near Sonprayag.' }
  }
];

export const MOCK_AUDIT_LOGS: AuditEntry[] = [
  { id: 'AUD-801', actionTime: formatDate(addDays(-1)) + ' 10:00 AM', performer: { name: 'Admin Alex', id: 'ADM-01' }, tbr: { id: 'TBR-801', name: 'Kedarnath' }, action: 'Batch Approved', reason: 'Verified all safety protocols.' }
];
