'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type, react-hooks/exhaustive-deps */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  HeartHandshake,
  Home,
  Lock,
  Map as MapIcon,
  MessageSquareText,
  Plane,
  Plus,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  Wrench,
  Terminal,
  Activity,
  Sliders,
} from 'lucide-react';

// ==========================================
// 1. Core TypeScript Interfaces & Types
// ==========================================

interface Profile {
  name: string;
  initials: string;
  role: string;
  company: string;
  product: string;
  startDate: string;
  deadline: string;
  mode: string;
  intent: string;
}

interface EvidenceLink {
  id: string;
  label: string;
  owner: string;
  status: string;
  href: string;
  notes: string;
}

interface OwnerQuestion {
  id: string;
  owner: string;
  askWhen: string;
  question: string;
  status: string;
  evidence: string;
  nextAction: string;
}

interface QuestGroup {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  tone: string;
  quests: [string, number][];
}

interface RunwayDay {
  day: string;
  title: string;
  focus: string;
  verify: string;
  artifact: string;
  code: string;
  template: string;
  tasks: [string, number, string[]][];
}

interface OrgOwner {
  id: string;
  name: string;
  nickname: string;
  role: string;
  group: string;
  owns: string;
  reportsTo: string;
  traits: string;
  notes: string;
}

interface InterpersonalLink {
  id: string;
  from: string;
  to: string;
  type: string;
  temperature: string;
  strength: string;
  notes: string;
}

interface QuizQuestion {
  prompt: string;
  options: string[];
  answer: number;
  category: string;
}

interface DeliveryItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  estimateDays: number;
  resource: string;
  confidence: number;
  dependency: string;
  impact: string;
  notes: string;
  confidenceRationale?: string;
  evidence?: string;
  lastChecked?: string;
}

interface DeliverySettings {
  deadline: string;
  capacityPerWeek: number;
  bufferPercent: number;
}

interface LogEntry {
  id: string;
  type: string;
  text: string;
  date: string;
}

interface DailySettings {
  capacity: number;
}

interface FollowupItem {
  id: string;
  horizon: string;
  title: string;
  detail: string;
  source: string;
  done: boolean;
}

interface PlanItem {
  id: string;
  source: 'core' | 'runway' | 'followup';
  doneKey: string;
  title: string;
  detail?: string;
  xp: number;
  lane: string;
  type: string;
  score: number;
}

interface BossFight {
  id: string;
  title: string;
  severity: string;
  icon: React.ComponentType<any>;
  summary: string;
  counter: string;
  attackPlan: [string, string[]][];
}

// ==========================================
// 2. Constants & Data Sources
// ==========================================

const ERIK_VA_START_DATE = '2026-05-25';
const ERIK_VA_DEADLINE = '2026-09-30';

const defaultProfile: Profile = {
  name: 'Erik',
  initials: 'EV',
  role: 'Technical Lead',
  company: 'Virgin Australia',
  product: 'Check-in Web Experience',
  startDate: ERIK_VA_START_DATE,
  deadline: ERIK_VA_DEADLINE,
  mode: 'Ultra-local',
  intent:
    'Help Erik take over the VA check-in web app experience with clear evidence, owners, and calm delivery rhythm.',
};

const defaultEvidenceLinks: EvidenceLink[] = [
  {
    id: 'source-repo',
    label: 'Actual check-in web repo',
    owner: 'Erik',
    status: 'Need link Monday',
    href: '',
    notes: 'Add the real repository or mono-repo package once access lands.',
  },
  {
    id: 'delivery-board',
    label: 'September delivery board',
    owner: 'Product / Delivery',
    status: 'Need link Monday',
    href: '',
    notes:
      'Single board view for critical path, blockers, and decision-needed items.',
  },
  {
    id: 'release-calendar',
    label: 'Release train and blackout calendar',
    owner: 'Release / Platform',
    status: 'Need evidence',
    href: '',
    notes:
      'Must confirm September release windows, rehearsal dates, support model, and rollback owner.',
  },
  {
    id: 'observability',
    label: 'Check-in observability dashboard',
    owner: 'Platform / SRE',
    status: 'Unknown',
    href: '',
    notes:
      'Completion, latency, dependency errors, abandonment, and DCS/API health need one evidence trail.',
  },
];

const defaultOwnerQuestions: OwnerQuestion[] = [
  {
    id: 'manager-success',
    owner: 'Engineering Manager',
    askWhen: 'Monday AM',
    question:
      'What does success look like by Friday, and what would make September feel genuinely at risk?',
    status: 'Open',
    evidence: '',
    nextAction: 'Book first 1:1 and capture hidden constraints.',
  },
  {
    id: 'product-scope',
    owner: 'Product Owner',
    askWhen: 'Monday AM',
    question:
      'Which September scope is must-have, should-have, could-drop, and politically sensitive?',
    status: 'Open',
    evidence: '',
    nextAction: 'Turn scope into a decision log with named trade-off owner.',
  },
  {
    id: 'tcs-reverse-demo',
    owner: 'TCS Delivery Lead',
    askWhen: 'Monday midday',
    question:
      'Can you reverse-demo booking lookup through boarding pass, including the part you trust least?',
    status: 'Open',
    evidence: '',
    nextAction: 'Capture gaps as system risk, not personal failure.',
  },
  {
    id: 'architecture-boundaries',
    owner: 'Architecture / Integration Owner',
    askWhen: 'Monday PM',
    question:
      'Which systems own booking, ticket, eligibility, seat, bag, documents, boarding pass, and check-in status?',
    status: 'Open',
    evidence: '',
    nextAction: 'Build one boundary map with source-of-truth owners.',
  },
  {
    id: 'release-gates',
    owner: 'QA / Release / Platform',
    askWhen: 'Monday PM',
    question:
      'What release gates, smoke checks, rollback steps, and support owners make September credible?',
    status: 'Open',
    evidence: '',
    nextAction: 'Attach proof links, not verbal confidence.',
  },
  {
    id: 'privacy-logs',
    owner: 'Security / Privacy',
    askWhen: 'First week',
    question:
      'Where can passenger, document, payment, and PNR data appear, and what must never enter logs or tools?',
    status: 'Open',
    evidence: '',
    nextAction:
      'Write the local red-line rules for notes, logs, screenshots, and support artefacts.',
  },
];

const questGroups: QuestGroup[] = [
  {
    id: 'context',
    title: 'Absorb Context',
    icon: BookOpen,
    tone: 'blue',
    quests: [
      [
        'Read check-in system overview, runbooks, and architecture decision records',
        10,
      ],
      [
        'Map every critical integration: booking, identity, payments, bags, seats, DCS, notifications',
        15,
      ],
      ['Build a one-page glossary of airline/check-in domain language', 10],
      [
        'Review incidents, production defects, and unresolved technical debt',
        15,
      ],
    ],
  },
  {
    id: 'humans',
    title: 'Meet Humans',
    icon: Users,
    tone: 'purple',
    quests: [
      [
        '1:1 with Engineering Manager: success, constraints, politics, and hidden risks',
        10,
      ],
      [
        '1:1 with Product Manager (Sarah): September promise, scope pressure, and customer impact',
        10,
      ],
      [
        'Meet TCS Delivery Lead: knowledge gaps, ownership boundaries, escalation paths',
        15,
      ],
      [
        'Ask each senior engineer what they are worried nobody understands yet',
        15,
      ],
    ],
  },
  {
    id: 'delivery',
    title: 'Stabilize Delivery',
    icon: Wrench,
    tone: 'red',
    quests: [
      [
        'Identify top 3 in-flight delivery risks and attach evidence to each',
        15,
      ],
      [
        'Confirm September critical path, release train, environments, and blackout windows',
        15,
      ],
      [
        'Validate testing pyramid: unit, contract, integration, E2E, accessibility, performance',
        15,
      ],
      ['Shadow a check-in deployment or release rehearsal end to end', 10],
      [
        'Create the first weekly risk note for stakeholders: calm, blunt, useful',
        10,
      ],
    ],
  },
];

const timeline = [
  ['Day 1', 'Launch', 'Understand, listen, stabilize'],
  ['Week 2', 'Build Trust', 'Make rhythms explicit'],
  ['Month 1', 'Take Control', 'Own delivery truth'],
  ['Month 3', 'Optimize', 'Reduce friction and defects'],
  ['September', 'Deliver', 'Land the committed release'],
  ['Month 6', 'Lead Future', 'Scale team capability'],
];

const bossFights: BossFight[] = [
  {
    id: 'takeover',
    title: 'In-flight Project Takeover',
    severity: 'high',
    icon: Plane,
    summary:
      'Mid-stream ownership handover with context gaps and unclear decisions.',
    counter:
      'Reconstruct the decision trail, pin the critical path, and make ambiguity visible early.',
    attackPlan: [
      [
        'Map the truth',
        [
          'Collect current roadmap, dependency map, RAID log, and release calendar.',
          'Mark every decision as confirmed, assumed, or missing.',
          'Identify the three riskiest unknowns blocking September confidence.',
        ],
      ],
      [
        'Stabilize ownership',
        [
          'Name one owner for each critical path item.',
          'Separate product decisions from engineering execution risks.',
          'Create a visible decision log with date, owner, evidence, and next action.',
        ],
      ],
      [
        'Report calmly',
        [
          'Send a short weekly status: on track, at risk, blocked, decision needed.',
          'Use evidence rather than mood when raising risk.',
          'Close the loop when an ambiguity becomes a decision.',
        ],
      ],
    ],
  },
  {
    id: 'tcs',
    title: 'TCS Knowledge Gaps',
    severity: 'medium',
    icon: Users,
    summary: 'Domain and system knowledge concentration risk.',
    counter:
      'Use pairing, reverse demos, and written runbooks to convert tribal knowledge into team memory.',
    attackPlan: [
      [
        'Expose the gaps',
        [
          'Ask TCS to reverse-demo the booking lookup and check-in path.',
          'Capture where explanations become hand-wavy or ticket-specific.',
          'List missing domain terms, system owners, and edge cases.',
        ],
      ],
      [
        'Convert to memory',
        [
          'Turn each demo into a short runbook with screenshots or links.',
          'Pair on one domain-heavy PR and document acceptance examples.',
          'Make "show me the evidence" normal, not adversarial.',
        ],
      ],
      [
        'Protect the team',
        [
          'Clarify when to escalate versus keep investigating.',
          'Reward "I do not know yet" when paired with a next step.',
          'Track repeated gaps as system risk, not individual failure.',
        ],
      ],
    ],
  },
  {
    id: 'offshore',
    title: 'Offshore Rhythm',
    severity: 'medium',
    icon: Gauge,
    summary: 'Handoffs, delays, time-zone drift, and accountability fuzz.',
    counter:
      'Create crisp async rituals: decision log, risk board, next-action owner, and end-of-day handoff.',
    attackPlan: [
      [
        'Make handoff visible',
        [
          'Define the daily overlap window and what must happen inside it.',
          'Require end-of-day notes: done, blocked, next owner, evidence link.',
          'Use async updates for facts, meetings for decisions.',
        ],
      ],
      [
        'Reduce drift',
        [
          'Set one board view for September critical path and blockers.',
          'Pin acceptance criteria before work starts.',
          'Review stale tickets twice a week and delete false progress.',
        ],
      ],
      [
        'Keep accountability humane',
        [
          'Ask open questions before assuming avoidance.',
          'Confirm commitments in writing with owner and date.',
          'Escalate patterns early, privately, and with examples.',
        ],
      ],
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture Confidence',
    severity: 'medium',
    icon: ShieldCheck,
    summary:
      'Unknown constraints, dependencies, trade-offs, and non-functional risk.',
    counter:
      'Run thin architecture reviews around real flows: happy path, disruption, retry, rollback, observability.',
    attackPlan: [
      [
        'Trace real flows',
        [
          'Walk booking lookup, passenger validation, seat/bag selection, and boarding pass issuance.',
          'Draw upstream/downstream dependencies and timeout boundaries.',
          'Mark where failures should degrade, retry, or stop.',
        ],
      ],
      [
        'Check non-functionals',
        [
          'Verify logging excludes passenger PII and sensitive documents.',
          'Confirm telemetry covers conversion, latency, dependency errors, and abandoned check-ins.',
          'Review cache, retry, circuit breaker, and rollback assumptions.',
        ],
      ],
      [
        'Turn findings into decisions',
        [
          'Create ADRs only for decisions that change delivery behavior.',
          'Link architecture risks to September scope or release gates.',
          'Ask architecture stakeholders for explicit sign-off on unresolved trade-offs.',
        ],
      ],
    ],
  },
  {
    id: 'release',
    title: 'Testing & Release Gates',
    severity: 'low',
    icon: ClipboardList,
    summary:
      'Quality automation, release discipline, and deployment readiness.',
    counter:
      'Make the Definition of Done enforceable, then rehearse production-like release paths.',
    attackPlan: [
      [
        'Define the gates',
        [
          'Write the minimum release checklist: tests, smoke checks, monitoring, rollback, support owner.',
          'Confirm who can stop the line and what evidence is required.',
          'Separate must-have gates from nice-to-have process theatre.',
        ],
      ],
      [
        'Rehearse safely',
        [
          'Run or shadow a deployment rehearsal before September pressure peaks.',
          'Verify environment parity for config, feature flags, and integrations.',
          'Document rollback timing and customer/support communications.',
        ],
      ],
      [
        'Measure readiness',
        [
          'Track failing tests and flaky checks as delivery risk.',
          'Add accessibility and performance checks where they affect check-in completion.',
          'Publish a weekly readiness score with concrete blockers.',
        ],
      ],
    ],
  },
];

const flightSubdomains = [
  {
    id: 'retail',
    title: 'Retail, booking, and ticketing',
    short: 'Before check-in exists',
    body: 'The passenger buys or changes the trip. The check-in app usually consumes the outcome rather than owning it.',
    terms: ['PSS', 'CRS', 'GDS', 'NDC', 'ONE Order', 'PNR', 'ETKT', 'EMD'],
  },
  {
    id: 'departure',
    title: 'Departure control and check-in',
    short: 'Permission to travel',
    body: 'The airline confirms the passenger, flight, eligibility, seats, bags, documents, and boarding pass state.',
    terms: ['DCS', 'WCI', 'BCBP', 'BP', 'SSR', 'OSI', 'API', 'APP'],
  },
  {
    id: 'airport',
    title: 'Airport and common-use',
    short: 'Shared airport surfaces',
    body: 'Airport kiosks, counters, bag drops, gates, scanners, displays, and common-use platforms interact with airline systems.',
    terms: ['CUSS', 'CUPPS', 'CUTE', 'SSBD', 'AODB', 'FIDS', 'BGR'],
  },
  {
    id: 'baggage',
    title: 'Baggage and acceptance',
    short: 'Bags become operational objects',
    body: 'A bag is weighed, accepted, tagged, reconciled, tracked, loaded, transferred, and sometimes disrupted.',
    terms: ['BSM', 'BPM', 'BRS', 'LPN', 'DGR', 'WHS', 'BAG'],
  },
  {
    id: 'border',
    title: 'Identity, border, and security',
    short: 'Can this person travel?',
    body: 'Identity, travel documents, visas, watchlists, payment, privacy, and security obligations shape the customer flow.',
    terms: ['APIS', 'PNRGOV', 'MRZ', 'ETA', 'ESTA', 'PCI', 'PII', 'DPIA'],
  },
  {
    id: 'ops',
    title: 'Flight operations and disruption',
    short: 'Reality changes fast',
    body: 'Schedules, aircraft, gates, crews, weather, boarding, weight and balance, and delays create late changes.',
    terms: [
      'STD',
      'ETD',
      'ATD',
      'STA',
      'ETA',
      'ATA',
      'TOBT',
      'CTOT',
      'W&B',
      'LMC',
    ],
  },
];

const domainGlossary: [string, string, string, string][] = [
  [
    'PSS',
    'Passenger Service System',
    'Core airline platform for reservations, inventory, ticketing, passenger records, and related services.',
    'Retail',
  ],
  [
    'CRS',
    'Computer Reservation System',
    'Reservation engine used to create and manage bookings; often part of or linked to the PSS.',
    'Retail',
  ],
  [
    'GDS',
    'Global Distribution System',
    'Travel agency distribution network that sells airline inventory through systems like Amadeus, Sabre, or Travelport.',
    'Retail',
  ],
  [
    'NDC',
    'New Distribution Capability',
    'IATA standard for airline offer/order distribution using modern messages instead of legacy fare filing only.',
    'Retail',
  ],
  [
    'ONE Order',
    'IATA order concept',
    'IATA model that simplifies airline retailing around a single customer order through the lifecycle.',
    'Retail',
  ],
  [
    'PNR',
    'Passenger Name Record',
    'Booking record containing itinerary, passenger, contact, service requests, and references. Treat as sensitive.',
    'Retail',
  ],
  [
    'ETKT / ET',
    'Electronic Ticket',
    'Commercial entitlement to travel. Check-in does not equal ticketing; a passenger may be booked but not ticketed.',
    'Retail',
  ],
  [
    'EMD',
    'Electronic Miscellaneous Document',
    'Electronic record for paid ancillaries such as bags, seats, lounge, or other services.',
    'Retail',
  ],
  [
    'DCS',
    'Departure Control System',
    'System that manages check-in, acceptance, seats, bags, boarding, and departure-day passenger state.',
    'Check-in',
  ],
  [
    'WCI',
    'Web Check-in',
    'Self-service check-in through web, often sharing rules with mobile and kiosk but with channel-specific constraints.',
    'Check-in',
  ],
  [
    'BP',
    'Boarding Pass',
    'Customer-facing permission document to enter airside and board, subject to rules and scan validation.',
    'Check-in',
  ],
  [
    'BCBP',
    'Bar Coded Boarding Pass',
    'IATA common-use boarding pass barcode format used by scanners across airport processes.',
    'Check-in',
  ],
  [
    'SSR',
    'Special Service Request',
    'Structured service or assistance code on a booking, such as wheelchair assistance, infant, meal, or docs needs.',
    'Check-in',
  ],
  [
    'OSI',
    'Other Service Information',
    'Free-text or semi-structured airline information in a booking. Useful, but risky for automation.',
    'Check-in',
  ],
  [
    'API',
    'Advance Passenger Information',
    'Passenger document and biographic data required by authorities before travel. Not just a software API.',
    'Border',
  ],
  [
    'APP',
    'Advance Passenger Processing',
    'Authority response/permission flow used by some countries before boarding or travel.',
    'Border',
  ],
  [
    'APIS',
    'Advance Passenger Information System',
    'Government or airline process for sending required passenger/document data.',
    'Border',
  ],
  [
    'PNRGOV',
    'PNR Government message',
    'Standardized PNR data exchange to border/security authorities in some contexts.',
    'Border',
  ],
  [
    'MRZ',
    'Machine Readable Zone',
    'Passport/document lines parsed for identity and document validation.',
    'Border',
  ],
  [
    'ETA',
    'Electronic Travel Authority / Estimated Time of Arrival',
    'Context-sensitive acronym: can mean travel authorization or arrival estimate. Verify usage.',
    'Border/Ops',
  ],
  [
    'ESTA',
    'Electronic System for Travel Authorization',
    'US travel authorization for eligible Visa Waiver Program passengers.',
    'Border',
  ],
  [
    'CUSS',
    'Common Use Self Service',
    'Common-use airport kiosk standard for self-service check-in and related workflows.',
    'Airport',
  ],
  [
    'CUPPS',
    'Common Use Passenger Processing Systems',
    'Common-use airport platform standard for shared airline passenger processing equipment.',
    'Airport',
  ],
  [
    'CUTE',
    'Common Use Terminal Equipment',
    'Older common-use terminal equipment concept/platform category.',
    'Airport',
  ],
  [
    'SSBD',
    'Self-Service Bag Drop',
    'Passenger bag drop flow with identity, bag allowance, weight, tag, and acceptance rules.',
    'Baggage',
  ],
  [
    'BSM',
    'Baggage Source Message',
    'Message used to communicate bag tag/routing details to baggage systems.',
    'Baggage',
  ],
  [
    'BPM',
    'Baggage Processed Message',
    'Message/event indicating bag processing movement or handling status.',
    'Baggage',
  ],
  [
    'BRS',
    'Baggage Reconciliation System',
    'System/process ensuring bags are associated with boarded passengers and loaded correctly.',
    'Baggage',
  ],
  [
    'LPN',
    'License Plate Number',
    'The bag tag identifier used to track a checked bag through baggage systems.',
    'Baggage',
  ],
  [
    'DGR',
    'Dangerous Goods Regulations',
    'Rules governing dangerous goods, including what passengers may carry in cabin or checked baggage.',
    'Baggage',
  ],
  [
    'WHS',
    'Work Health and Safety',
    'Operational safety constraints, including manual handling and bag weight limits.',
    'Baggage',
  ],
  [
    'AODB',
    'Airport Operational Database',
    'Airport system holding operational flight, stand, gate, belt, and timing data.',
    'Airport/Ops',
  ],
  [
    'FIDS',
    'Flight Information Display System',
    'Airport display system for public flight status, gates, and timing.',
    'Airport/Ops',
  ],
  [
    'STD',
    'Scheduled Time of Departure',
    'Planned departure time in the schedule.',
    'Ops',
  ],
  [
    'ETD',
    'Estimated Time of Departure',
    'Current predicted departure time.',
    'Ops',
  ],
  [
    'ATD',
    'Actual Time of Departure',
    'When the aircraft actually departed, depending on operational definition.',
    'Ops',
  ],
  [
    'STA',
    'Scheduled Time of Arrival',
    'Planned arrival time in the schedule.',
    'Ops',
  ],
  [
    'ATA',
    'Actual Time of Arrival',
    'When the aircraft actually arrived, depending on operational definition.',
    'Ops',
  ],
  [
    'TOBT',
    'Target Off-Block Time',
    'Airport collaborative decision-making target for when aircraft should push back.',
    'Ops',
  ],
  [
    'CTOT',
    'Calculated Take-Off Time',
    'Air traffic flow management slot time for takeoff.',
    'Ops',
  ],
  [
    'W&B',
    'Weight and Balance',
    'Aircraft load, mass, balance, and center-of-gravity process; impacted by passengers and bags.',
    'Ops',
  ],
  [
    'LMC',
    'Last Minute Change',
    'Late change to passengers, bags, or load requiring operational update.',
    'Ops',
  ],
  [
    'PAX',
    'Passenger',
    'Industry shorthand for passenger or passengers.',
    'People',
  ],
  [
    'INF / CHD',
    'Infant / Child',
    'Passenger type codes that affect eligibility, seating, fares, docs, and assistance rules.',
    'People',
  ],
  [
    'UMNR',
    'Unaccompanied Minor',
    'Passenger requiring special handling, acceptance, documentation, and staff processes.',
    'People',
  ],
  [
    'PRM',
    'Passenger with Reduced Mobility',
    'Assistance category requiring airport and airline coordination.',
    'People',
  ],
  [
    'WCHR / WCHS / WCHC',
    'Wheelchair assistance levels',
    'Common assistance levels: ramp, steps, or cabin seat assistance. Confirm local definitions.',
    'People',
  ],
  [
    'PII',
    'Personally Identifiable Information',
    'Personal data such as names, documents, contact, payment, and travel details. Protect in logs/tools.',
    'Security',
  ],
  [
    'PCI',
    'Payment Card Industry',
    'Security obligations around cardholder data. Avoid storing or logging card data.',
    'Security',
  ],
  [
    'OIDC / JWT',
    'Identity tokens',
    'Modern auth concepts often used by web check-in channels and APIs.',
    'Tech',
  ],
  [
    'SLA / SLO',
    'Service agreement/objective',
    'Reliability targets. For check-in, connect them to completion, latency, and dependency health.',
    'Tech',
  ],
];

const checkInFlows = [
  [
    'Find booking',
    [
      'Passenger enters PNR, surname, loyalty login, or deep link.',
      'Web app calls booking/profile services.',
      'System normalizes passenger, itinerary, ticket, and eligibility context.',
    ],
  ],
  [
    'Determine eligibility',
    [
      'Check flight window, ticket status, disruption, passenger type, docs, payment, SSRs, route, and airport rules.',
      'Return allowed, blocked, or assisted-check-in-needed state with a customer-safe reason.',
    ],
  ],
  [
    'Collect decisions',
    [
      'Passenger confirms identity/contact, seats, baggage, dangerous goods, ancillaries, and travel documents.',
      'Every decision should be traceable to a rule, system, or customer action.',
    ],
  ],
  [
    'Commit check-in',
    [
      'DCS accepts passenger, assigns/updates seat and sequence, records acceptance, and may create bag or document state.',
      'This is the dangerous boundary: retries must be idempotent and observable.',
    ],
  ],
  [
    'Issue boarding pass',
    [
      'Generate BCBP/boarding pass for eligible passengers.',
      'Suppress or restrict boarding pass when docs, payment, airport, or security rules require counter handling.',
    ],
  ],
  [
    'Operate airport day',
    [
      'Bag drop, security, lounge, gate, boarding scan, offload, disruption, and reconciliation all consume the state web created.',
    ],
  ],
];

const domainSchemas = [
  [
    'PassengerCheckInSession',
    `{
  sessionId,
  channel: "WEB_CHECKIN" | "MOBILE" | "KIOSK",
  airlineCode,
  bookingRef,
  passengerRefs[],
  flightRefs[],
  eligibility,
  selectedSeats[],
  bagIntents[],
  documentState,
  paymentState,
  status: "started" | "blocked" | "ready" | "checked_in",
  auditTrail[]
}`,
  ],
  [
    'EligibilityDecision',
    `{
  passengerRef,
  flightRef,
  canCheckIn: boolean,
  canIssueBoardingPass: boolean,
  reasons[],
  requiredActions[],
  sourceSystems[],
  expiresAt
}`,
  ],
  [
    'BoardingPass',
    `{
  passengerName,
  bookingRef,
  carrierCode,
  flightNumber,
  origin,
  destination,
  flightDate,
  seat,
  sequenceNumber,
  barcodeFormat: "BCBP",
  delivery: "wallet" | "pdf" | "print" | "none"
}`,
  ],
  [
    'BagAcceptance',
    `{
  passengerRef,
  flightRef,
  allowance,
  declaredBags[],
  dangerousGoodsAcknowledged,
  weightChecks[],
  tagNumbers[],
  acceptanceStatus,
  handoffSystem
}`,
  ],
];

const pediaSources = [
  ['IATA baggage rules', 'https://www.iata.org/bags/index'],
  [
    'IATA baggage standards',
    'https://www.iata.org/en/programs/ops-infra/baggage/standards/',
  ],
  [
    'IATA common-use standards',
    'https://www.iata.org/en/programs/passenger/common-use/',
  ],
  ['IATA NDC', 'https://www.iata.org/ndc'],
  [
    'IATA ONE Order',
    'https://www.iata.org/en/programs/airline-distribution/retailing/one-order/',
  ],
  [
    'Amadeus Altéa DCS overview',
    'https://www.learn.amadeus.com/CourseSheetDisplay-2127013743.htm',
  ],
];

const defaultOrgOwners: OrgOwner[] = [
  {
    id: 'erik',
    name: 'Erik',
    nickname: 'You',
    role: 'Technical Lead',
    group: 'Onshore leadership',
    owns: 'Check-in delivery truth, technical direction, risk visibility',
    reportsTo: '',
    traits: 'Calm, curious, direct, evidence-led',
    notes:
      'Use this node as the anchor. HQ at South Bank, Brisbane. Leading September TCS handover.',
  },
  {
    id: 'product-owner',
    name: 'Sarah',
    nickname: 'Scope oracle',
    role: 'Product Owner',
    group: 'Product',
    owns: 'Customer outcomes, scope trade-offs, September promise',
    reportsTo: 'erik',
    traits: 'Decision maker, customer pressure, needs clear options',
    notes:
      'Sarah works at South Bank HQ. Deeply invested in check-in stability.',
  },
  {
    id: 'tcs-lead',
    name: 'Raj',
    nickname: 'Offshore bridge',
    role: 'TCS Delivery Lead',
    group: 'TCS',
    owns: 'Offshore rhythm, staffing, delivery commitments, escalation',
    reportsTo: 'erik',
    traits: 'May say yes too quickly; needs safe space for unknowns',
    notes: 'Based in Chennai. Direct technical counterpart for the handover.',
  },
  {
    id: 'architecture',
    name: 'Dave',
    nickname: 'Boundary keeper',
    role: 'Enterprise Architect',
    group: 'Architecture',
    owns: 'System boundaries, NFRs, integration constraints, sign-off',
    reportsTo: 'erik',
    traits:
      'Risk-sensitive, standards-led, useful when asked concrete questions',
    notes:
      'Dave sits at South Bank HQ. Focuses heavily on clean API schema contracts.',
  },
];

const defaultInterpersonalLinks: InterpersonalLink[] = [
  {
    id: 'erik-product-owner',
    from: 'erik',
    to: 'product-owner',
    type: 'Needs alignment',
    temperature: 'Warm',
    strength: 'Medium',
    notes:
      'Build trust through calm options, explicit trade-offs, and no surprise risk escalations.',
  },
  {
    id: 'erik-tcs-lead',
    from: 'erik',
    to: 'tcs-lead',
    type: 'Delivery bridge',
    temperature: 'Unknown',
    strength: 'High leverage',
    notes:
      'Watch for passive agreement. Make uncertainty safe and ask for reverse demos.',
  },
  {
    id: 'product-owner-architecture',
    from: 'product-owner',
    to: 'architecture',
    type: 'Decision tension',
    temperature: 'Variable',
    strength: 'High leverage',
    notes:
      'Product pressure and architecture risk may pull against each other. Translate between them early.',
  },
];

const defaultDeliveryItems: DeliveryItem[] = [
  {
    id: 'critical-path',
    title: 'Confirm September critical path',
    type: 'Requirement',
    priority: 'Critical',
    status: 'In progress',
    estimateDays: 5,
    resource: 'Erik + Sarah + Raj',
    confidence: 55,
    confidenceRationale:
      'Placeholder until the real board, dependency map, and scope cuts are verified.',
    evidence: '',
    lastChecked: '',
    dependency: 'Roadmap, release train, scope decisions',
    impact: 'Without this, every date is theatre.',
    notes: 'Turn scope into must/should/could and attach owners.',
  },
  {
    id: 'environment-readiness',
    title: 'Environment and release readiness',
    type: 'Risk',
    priority: 'High',
    status: 'Unknown',
    estimateDays: 8,
    resource: 'Platform / DevOps / TCS',
    confidence: 45,
    confidenceRationale:
      'Needs CI/CD, rollback, smoke, and environment parity evidence.',
    evidence: '',
    lastChecked: '',
    dependency: 'CI/CD, smoke checks, rollback, config parity',
    impact: 'Late release risk and unstable handover.',
    notes: 'Needs evidence, not verbal confidence.',
  },
  {
    id: 'domain-gap',
    title: 'TCS domain knowledge gap',
    type: 'Blocker',
    priority: 'High',
    status: 'Blocked',
    estimateDays: 6,
    resource: 'TCS + domain SMEs',
    confidence: 35,
    confidenceRationale:
      'Reverse demos and domain examples have not been proven yet.',
    evidence: '',
    lastChecked: '',
    dependency: 'Reverse demos, runbooks, examples',
    impact: 'Rework risk rises when edge cases are missed.',
    notes: 'Use pairing and evidence-based acceptance.',
  },
];

const defaultDeliverySettings: DeliverySettings = {
  deadline: ERIK_VA_DEADLINE,
  capacityPerWeek: 18,
  bufferPercent: 20,
};

const rituals = [
  [
    'Daily',
    '15-minute delivery truth scan: blockers, changed assumptions, risk movement, next owner.',
  ],
  [
    'Twice weekly',
    'TCS knowledge transfer with reverse demo: they explain the flow, you ask for evidence.',
  ],
  [
    'Weekly',
    'Stakeholder note: what changed, what is at risk, what decision is needed, what stays on track.',
  ],
  [
    'Fortnightly',
    'Architecture and quality checkpoint against September readiness, not theoretical purity.',
  ],
];

const defaultFollowups: FollowupItem[] = [
  {
    id: 'seed-tomorrow-1',
    horizon: 'Tomorrow',
    title: "Turn today's fog into tomorrow's questions",
    detail:
      'End the day by converting every vague concern into one verifiable question, owner, or artifact.',
    source: 'Daily calibration',
    done: false,
  },
  {
    id: 'seed-week-1',
    horizon: 'Next Week',
    title: 'Rewrite the runway after meeting the real system',
    detail:
      'Replace any generic onboarding task with the actual flow, risk, team dynamic, or stakeholder pressure discovered this week.',
    source: 'Goal mutation',
    done: false,
  },
  {
    id: 'seed-month-1',
    horizon: 'Next Month',
    title: 'Promote patterns into durable operating rituals',
    detail:
      'Keep what is working, delete performative rituals, and make the September delivery system explicit.',
    source: 'Leadership system',
    done: false,
  },
];

const followupHorizons = ['Tomorrow', 'Next Week', 'Next Month'];
const DEFAULT_DAILY_CAPACITY = 5;
const dayFlowStages = [
  { id: 'before', label: 'Before', hint: 'Prime the day' },
  { id: 'start', label: 'Start', hint: 'Choose focus' },
  { id: 'during', label: 'During', hint: 'Capture signals' },
  { id: 'end', label: 'End', hint: 'Summarise + quiz' },
];

const dayFlowActions = {
  before: [
    'Scan calendar, meetings, and likely pressure points.',
    'Name the one business outcome that matters most today.',
    'Pick one person to understand better, not just manage.',
    'Check yesterday/open follow-ups so nothing lives in your head.',
  ],
  start: [
    'Confirm the protected focus list is realistic for an actual workday.',
    'Choose the first action to complete or unblock.',
    'Write one question you need answered before the day gets noisy.',
    'Decide what risk or progress signal stakeholders may need today.',
  ],
  during: [
    'Capture only meaningful signals: decision, risk, person, domain term, blocker.',
    'Add new work as a follow-up unless it truly must interrupt today.',
    'Mark a task done only when it changed reality, not when it merely felt busy.',
    'If the list gets heavy, reduce today and move work to tomorrow/week/month.',
  ],
  end: [
    'Review what changed, what stayed blocked, and what should move forward.',
    'Convert loose notes into follow-ups or delivery signals.',
    'Write the shortest useful tomorrow handoff.',
    'Take the daily quiz to test what actually stuck.',
  ],
};

const runwayDays: RunwayDay[] = [
  {
    day: 'Day 1',
    title: 'Landing at Head Office (South Bank)',
    focus:
      'Immersion, PSS basics, PNR language, and fast context without performative confidence.',
    verify:
      'Which PSS/DCS products are actually in play, and where does web check-in sit in that chain?',
    artifact:
      'A one-page passenger check-in system map with confirmed owners and unknowns.',
    code: 'Trace auth, channel headers, and booking lookup paths without assuming the upstream contract.',
    template:
      'Landing notes: who I met at South Bank HQ, what system truth I confirmed, what still feels foggy, and what I will verify tomorrow.',
    tasks: [
      [
        'Draw the passenger check-in flow from booking lookup to boarding pass',
        20,
        ['Domain', 'Architecture'],
      ],
      [
        'List every acronym heard today and mark confirmed vs assumed',
        10,
        ['Domain'],
      ],
      [
        'Capture one anxiety, one strength, and one unknown from each first conversation',
        15,
        ['Trust'],
      ],
      [
        'Find the current September roadmap and highlight missing owners',
        15,
        ['Delivery'],
      ],
      [
        'Run the app locally or watch someone run it end to end',
        20,
        ['Engineering'],
      ],
    ],
  },
  {
    day: 'Day 2',
    title: 'TCS Offshore Dynamic',
    focus:
      'Time zones, passive agreement loops, quality gates, and psychological safety across distance.',
    verify:
      'Where do offshore developers feel least safe saying "I do not know" or "this is risky"?',
    artifact:
      'A reverse-demo ritual and PR quality checklist that protects both quality and humans.',
    code: 'Inspect lint, tests, coverage, branch rules, and review latency; automate the boring guardrails.',
    template:
      'Reverse demo notes: what Raj explained well, where I am still unclear, assumptions to verify, evidence needed, next step we agreed.',
    tasks: [
      [
        'Schedule a reverse demo with TCS for the current check-in flow',
        20,
        ['Trust', 'Communication'],
      ],
      [
        'Map offshore/onshore working rhythm, overlap, handoff, and async rules',
        15,
        ['Process', 'Team'],
      ],
      [
        'Review PR checklist, branch rules, and test coverage expectations',
        20,
        ['Quality'],
      ],
      [
        'Ask one developer where requirements usually become ambiguous',
        15,
        ['Empathy'],
      ],
      [
        'Document "how we ask for help" guidelines for the team',
        10,
        ['Culture'],
      ],
    ],
  },
  {
    day: 'Day 3',
    title: 'The September Runway',
    focus:
      'Handover, stabilization, production-like telemetry, and timeout/cascade failure thinking.',
    verify:
      'Which check-in failures become P1s, and what metric tells you before support tells you?',
    artifact:
      'Critical-path risk register with evidence, owner, mitigation, and decision-needed columns.',
    code: 'Review caching, circuit breaker, retry, timeout, and fallback behavior around fragile dependencies.',
    template:
      'Risk note: signal, customer impact, owner, confidence, mitigation, decision needed, date to re-check.',
    tasks: [
      [
        'Build the September critical-path board from real tickets and dependencies',
        25,
        ['Delivery'],
      ],
      [
        'Identify top 3 timeout/cascade risks in the check-in flow',
        20,
        ['Resilience'],
      ],
      [
        'Confirm production telemetry for errors, latency, conversion, and dependency health',
        20,
        ['Observability'],
      ],
      [
        'Write one stakeholder risk note in calm, plain language',
        15,
        ['Leadership'],
      ],
      [
        'Find rollback and support ownership for the next release',
        15,
        ['Release'],
      ],
    ],
  },
  {
    day: 'Day 4',
    title: 'Baggage & Boarding Operations',
    focus:
      'SSBD, baggage constraints, dangerous goods, boarding pass issuance, and PII handling.',
    verify:
      'Which regulatory, WHS, privacy, and airport operations rules shape product behavior?',
    artifact:
      'Domain glossary covering baggage, boarding, travel docs, exceptions, and escalation paths.',
    code: 'Check masking/encryption/logging boundaries for passport, booking, payment, and passenger data.',
    template:
      'Domain term: definition, system owner, customer-facing consequence, failure mode, and where it appears in code.',
    tasks: [
      [
        'Trace baggage, dangerous goods, and boarding pass rules through product behavior',
        20,
        ['Domain'],
      ],
      [
        'Verify PII masking/encryption/logging boundaries with security or architecture (Dave)',
        25,
        ['Security'],
      ],
      [
        'Shadow a support or airport-ops scenario involving check-in exceptions',
        20,
        ['Operations'],
      ],
      [
        'Add 10 glossary terms with confirmed owners or source links',
        15,
        ['Domain'],
      ],
      [
        'Capture one product decision that exists because of operations, not UX preference',
        10,
        ['Insight'],
      ],
    ],
  },
  {
    day: 'Day 5',
    title: 'Leadership Graduation',
    focus:
      'Zero-downtime release confidence, stakeholder truth, and owning technical authority calmly.',
    verify:
      'What release path, rollback path, and support model will be trusted in September?',
    artifact:
      'September readiness memo: scope, risks, gates, release plan, rollback, and open decisions.',
    code: 'Review deployment pipeline, environment parity, smoke checks, and release traffic shifting strategy.',
    template:
      'Readiness memo: what is true, what is risky, what is blocked, what decision I need, and what happens next.',
    tasks: [
      [
        'Review deployment pipeline, smoke checks, and environment parity',
        20,
        ['Release'],
      ],
      ['Confirm release gates and who can stop the line', 20, ['Governance']],
      ['Draft the first September readiness memo', 25, ['Leadership']],
      ['Identify one decision you are now ready to own', 15, ['Authority']],
      [
        'Send specific appreciation to someone who helped you understand the system',
        10,
        ['Trust'],
      ],
    ],
  },
];

const quizQuestions: QuizQuestion[] = [
  {
    prompt:
      'A stakeholder says "the reservation system is down" during check-in failures. What is your first leadership move?',
    options: [
      'Separate PSS/reservation, DCS, web/API, and integration symptoms before assigning blame.',
      'Escalate immediately to the offshore team and ask for an ETA.',
      'Assume the front end is faulty because customers see it first.',
    ],
    answer: 0,
    category: 'Technical knowledge',
  },
  {
    prompt:
      'TCS repeatedly says "yes, understood" but PRs keep missing domain edge cases. What do you change?',
    options: [
      'Move to reverse demos, examples, pairing, and explicit "show me the evidence" acceptance checks.',
      'Add more status meetings so everyone hears the requirement again.',
      'Stop delegating domain tasks offshore.',
    ],
    answer: 0,
    category: 'Technical knowledge',
  },
  {
    prompt:
      'Seat map calls are timing out and causing cascading failures. What pattern should be investigated?',
    options: [
      'Circuit breakers, bounded retries, dependency timeouts, cached aircraft configuration, and graceful fallback.',
      'A larger loading spinner and longer client-side timeout.',
      'A full rewrite before September.',
    ],
    answer: 0,
    category: 'Technical knowledge',
  },
  {
    prompt:
      'A log sample includes passenger document data. What is the correct instinct?',
    options: [
      'Treat it as a privacy/security risk, verify masking/encryption policy, and stop further leakage.',
      'Keep it because detailed logs help support debug faster.',
      'Only remove it from production logs after September.',
    ],
    answer: 0,
    category: 'Technical knowledge',
  },
  {
    prompt:
      'September release pressure is rising. What makes a release plan credible?',
    options: [
      'Proven gates, smoke tests, observability, rollback, support ownership, and low-drama communication.',
      'A confident date and daily reminders to move faster.',
      'A feature-complete demo in a non-production-like environment.',
    ],
    answer: 0,
    category: 'Technical knowledge',
  },
];

// ==========================================
// 3. Helper Utility Functions
// ==========================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function usePersistentState<T>(
  key: string,
  fallback: T
): [T, (next: T | ((curr: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
  }, [key]);

  const update = (next: T | ((curr: T) => T)) => {
    setValue((current) => {
      const resolved =
        typeof next === 'function' ? (next as Function)(current) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      return resolved;
    });
  };
  return [value, update];
}

function formatDate(dateKey: string) {
  if (!dateKey) return 'Not set';
  try {
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${dateKey}T00:00:00`));
  } catch {
    return dateKey;
  }
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(start: string, end: string) {
  try {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return Math.max(
      0,
      Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)
    );
  } catch {
    return 0;
  }
}

function signedDaysBetween(start: string, end: string) {
  try {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
  } catch {
    return 0;
  }
}

function addCalendarDays(dateKey: string, days: number) {
  try {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + Math.ceil(days));
    return todayKeyFromDate(date);
  } catch {
    return dateKey;
  }
}

function todayKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normaliseUrl(url: string) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function exportOnboardingState(state: any) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    purpose: 'Ultra-local VA check-in web onboarding cockpit for Erik',
    ...state,
  };
}

function buildReadoutMarkdown({
  profile,
  startDate,
  today,
  evidenceLinks,
  ownerQuestions,
  deliveryItems,
  deliverySettings,
}: any) {
  const model = buildDeliveryModel(deliveryItems, deliverySettings, today);
  const openQuestions = ownerQuestions
    .filter((item: any) => item.status !== 'Closed')
    .slice(0, 8);
  const evidenceGaps = evidenceLinks
    .filter((item: any) => item.status !== 'Verified')
    .slice(0, 8);
  return [
    `# ${profile.name}'s ${profile.company} ${profile.product} Onboarding Readout`,
    '',
    `Start date: ${formatDate(startDate)}`,
    `Generated: ${formatDate(today)}`,
    `September deadline: ${formatDate(profile.deadline || deliverySettings.deadline)}`,
    '',
    '## Delivery Read',
    `Pressure: ${model.pressure}`,
    `Forecast: ${model.forecastDate}`,
    `Stakeholder wording: ${model.stakeholderMessage}`,
    '',
    '## Questions To Close',
    ...openQuestions.map(
      (item: any) =>
        `- ${item.askWhen} / ${item.owner}: ${item.question} (${item.status})`
    ),
    '',
    '## Evidence Gaps',
    ...evidenceGaps.map(
      (item: any) =>
        `- ${item.label}: ${item.status} / owner ${item.owner}${item.href ? ` / ${item.href}` : ''}`
    ),
    '',
    '## Top Delivery Drivers',
    ...model.topDrivers.map(
      (item: any) =>
        `- ${item.title}: ${item.priority}, ${item.status}, ${item.confidence}% confidence. Evidence: ${item.evidence || 'missing'}`
    ),
  ].join('\n');
}

function downloadJson(filename: string, payload: any) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildDeliveryModel(
  items: DeliveryItem[],
  settings: DeliverySettings,
  todayStr: string
) {
  const priorityWeight: { [key: string]: number } = {
    Critical: 1.45,
    High: 1.2,
    Medium: 1,
    Low: 0.7,
  };
  const statusWeight: { [key: string]: number } = {
    Blocked: 1.35,
    Unknown: 1.2,
    'In progress': 1,
    'Not started': 1.08,
    Done: 0,
  };
  const typeWeight: { [key: string]: number } = {
    Blocker: 1.35,
    Risk: 1.2,
    Signal: 0.75,
    Requirement: 1,
    Feature: 1,
  };
  const activeItems = items.filter((item) => item.status !== 'Done');
  const modeled = activeItems.map((item) => {
    const confidencePenalty =
      1 + ((100 - Number(item.confidence || 50)) / 100) * 0.55;
    const adjustedDays = Math.max(
      0,
      Number(item.estimateDays || 0) *
        (priorityWeight[item.priority] || 1) *
        (statusWeight[item.status] || 1) *
        (typeWeight[item.type] || 1) *
        confidencePenalty
    );
    return { ...item, adjustedDays };
  });
  const rawDays = activeItems.reduce(
    (sum, item) => sum + Number(item.estimateDays || 0),
    0
  );
  const adjustedDays = modeled.reduce(
    (sum, item) => sum + item.adjustedDays,
    0
  );
  const bufferDays = adjustedDays * (Number(settings.bufferPercent || 0) / 100);
  const totalDays = adjustedDays + bufferDays;
  const weeksNeeded =
    Number(settings.capacityPerWeek || 1) > 0
      ? totalDays / Number(settings.capacityPerWeek)
      : totalDays;
  const forecastDate = addCalendarDays(todayStr, weeksNeeded * 7);
  const daysToDeadline = daysBetween(todayStr, settings.deadline);
  const runwayWeeks = daysToDeadline / 7;
  const pressure =
    weeksNeeded > runwayWeeks
      ? 'Red'
      : weeksNeeded > runwayWeeks * 0.78
        ? 'Amber'
        : 'Green';
  const blockers = activeItems.filter(
    (item) => item.type === 'Blocker' || item.status === 'Blocked'
  );
  const highPriority = activeItems.filter(
    (item) => item.priority === 'Critical' || item.priority === 'High'
  );
  const topDrivers = [...modeled]
    .sort((a, b) => b.adjustedDays - a.adjustedDays)
    .slice(0, 3);
  const displaced = activeItems
    .filter((item) => item.priority === 'Low' || item.status === 'Not started')
    .slice(0, 3);
  const evidenceGaps = activeItems.filter(
    (item) => !item.evidence || !item.lastChecked
  );
  const staleEvidence = activeItems.filter(
    (item) => item.lastChecked && daysBetween(item.lastChecked, todayStr) > 7
  );
  const evidenceCoverage = activeItems.length
    ? Math.round(
        ((activeItems.length - evidenceGaps.length) / activeItems.length) * 100
      )
    : 100;
  const stakeholderMessage =
    pressure === 'Red'
      ? `Current signals put September at risk. The forecast lands around ${forecastDate}, driven by ${topDrivers.map((item) => item.title).join(', ')}. We need a scope, capacity, or sequencing decision now.`
      : pressure === 'Amber'
        ? `September is still possible, but the margin is thin. The forecast lands around ${forecastDate}; protect the critical path and resolve ${blockers.length || 'the'} blocker${blockers.length === 1 ? '' : 's'} before adding new scope.`
        : `Current model supports September with manageable risk. Forecast lands around ${forecastDate}; keep priorities stable and continue validating assumptions with evidence.`;
  return {
    activeItems,
    modeled,
    rawDays,
    adjustedDays,
    bufferDays,
    totalDays,
    weeksNeeded,
    forecastDate,
    daysToDeadline,
    runwayWeeks,
    pressure,
    blockers,
    highPriority,
    topDrivers,
    displaced,
    evidenceGaps,
    staleEvidence,
    evidenceCoverage,
    stakeholderMessage,
  };
}

function stableHash(value: string): number {
  return String(value)
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function makeQuizQuestion({
  prompt,
  correct,
  distractors,
  category,
  seed,
}: {
  prompt: string;
  correct: string;
  distractors: string[];
  category: string;
  seed: string;
}): QuizQuestion {
  const allOptions = [
    correct,
    ...distractors.filter((option) => option !== correct),
  ].slice(0, 3);
  while (allOptions.length < 3)
    allOptions.push(
      'Not enough evidence yet; verify this before treating it as true.'
    );
  const rotation =
    Math.abs(stableHash(`${seed}-${prompt}`)) % allOptions.length;
  const options = [
    ...allOptions.slice(rotation),
    ...allOptions.slice(0, rotation),
  ];
  return {
    prompt,
    options,
    answer: options.indexOf(correct),
    category,
  };
}

function buildDailyQuiz({
  today,
  logs,
  followups,
  orgOwners,
  interpersonalLinks,
  deliveryItems,
  deliverySettings,
}: any): QuizQuestion[] {
  const seed = `${today}-${logs.length}-${followups.length}-${orgOwners.length}-${interpersonalLinks.length}-${deliveryItems.length}`;
  const deliveryModel = buildDeliveryModel(
    deliveryItems,
    deliverySettings,
    today
  );
  const questions: QuizQuestion[] = [];
  const addQuestion = (question: QuizQuestion) => {
    if (
      question &&
      !questions.some((existing) => existing.prompt === question.prompt)
    )
      questions.push(question);
  };

  quizQuestions.slice(0, 2).forEach((question, index) => {
    addQuestion(
      makeQuizQuestion({
        prompt: question.prompt,
        correct: question.options[question.answer],
        distractors: question.options.filter(
          (_: string, optionIndex: number) => optionIndex !== question.answer
        ),
        category: 'Technical knowledge',
        seed: `${seed}-core-${index}`,
      })
    );
  });

  const domainTerms = [...domainGlossary]
    .sort(
      (a, b) =>
        Math.abs(stableHash(`${seed}-${a[0]}`)) -
        Math.abs(stableHash(`${seed}-${b[0]}`))
    )
    .slice(0, 2);
  domainTerms.forEach(([code, meaning, body], index) => {
    addQuestion(
      makeQuizQuestion({
        prompt: `Domain check: what does ${code.split('/')[0].trim()} mean in this world?`,
        correct: meaning,
        distractors: [
          'A deployment environment or release branch.',
          'A stakeholder status category.',
        ],
        category: 'Flight domain',
        seed: `${seed}-domain-${index}`,
      })
    );
    if (index === 0) {
      addQuestion(
        makeQuizQuestion({
          prompt: `Why does ${code.split('/')[0].trim()} matter to check-in?`,
          correct: body,
          distractors: [
            'It only matters after the aircraft departs.',
            'It is purely a visual design label with no operational consequence.',
          ],
          category: 'Flight domain',
          seed: `${seed}-domain-why-${index}`,
        })
      );
    }
  });

  orgOwners.slice(0, 2).forEach((owner: any, index: number) => {
    addQuestion(
      makeQuizQuestion({
        prompt: `Organisational map: what does ${owner.name} own?`,
        correct: owner.owns,
        distractors: orgOwners
          .filter((person: any) => person.id !== owner.id)
          .map((person: any) => person.owns)
          .slice(0, 2),
        category: 'Organisational knowledge',
        seed: `${seed}-owner-${index}`,
      })
    );
  });

  interpersonalLinks.slice(0, 2).forEach((link: any, index: number) => {
    const from =
      orgOwners.find((person: any) => person.id === link.from)?.name ||
      'Unknown';
    const to =
      orgOwners.find((person: any) => person.id === link.to)?.name || 'Unknown';
    addQuestion(
      makeQuizQuestion({
        prompt: `Interpersonal map: what is the current read on ${from} -> ${to}?`,
        correct: `${link.type} / ${link.temperature} / ${link.strength}`,
        distractors: [
          'Formal reporting line only; no informal signal recorded.',
          'Blocked / Cold / Critical by default.',
        ],
        category: 'Interpersonal knowledge',
        seed: `${seed}-link-${index}`,
      })
    );
  });

  deliveryModel.topDrivers.slice(0, 2).forEach((item, index) => {
    addQuestion(
      makeQuizQuestion({
        prompt: `Delivery reality: why is "${item.title}" important to the timeline?`,
        correct:
          item.impact ||
          `${item.type} with ${item.priority} priority and ${item.status} status affects the forecast.`,
        distractors: [
          'It should be ignored until sprint planning catches up.',
          'It only changes the UI copy, not the project timeline.',
        ],
        category: 'Business and delivery',
        seed: `${seed}-delivery-${index}`,
      })
    );
  });

  addQuestion(
    makeQuizQuestion({
      prompt:
        'Business readout: what should your stakeholder message be based on the current delivery model?',
      correct: deliveryModel.stakeholderMessage,
      distractors: [
        'Everything is fine; avoid mentioning risk until the deadline is missed.',
        'Ask for more status meetings without changing scope, capacity, or sequencing.',
      ],
      category: 'Stakeholder communication',
      seed: `${seed}-message`,
    })
  );

  const recentFollowup =
    followups.find((item: any) => !item.done) || followups[0];
  addQuestion(
    makeQuizQuestion({
      prompt: recentFollowup
        ? `Adaptive planning: where should "${recentFollowup.title}" live right now?`
        : 'Adaptive planning: what should you do when a new concern appears during the day?',
      correct: recentFollowup
        ? recentFollowup.horizon
        : 'Capture it as a follow-up, set a horizon, then let tomorrow/week/month planning rebalance it.',
      distractors: [
        'Ignore it until the next formal sprint ceremony.',
        'Always force it into today regardless of capacity.',
      ],
      category: 'Adaptive planning',
      seed: `${seed}-followup`,
    })
  );

  const recentLog = logs[0];
  addQuestion(
    makeQuizQuestion({
      prompt: recentLog
        ? `Notes absorption: what kind of signal was your latest saved note?`
        : 'Personal knowledge base: what belongs in Notes during the day?',
      correct: recentLog
        ? recentLog.type
        : 'A concrete signal, decision, question, owner, feeling, or risk that should shape future goals.',
      distractors: [
        'Only polished meeting minutes after everything is already decided.',
        'Nothing; the app should stay static once the roadmap is written.',
      ],
      category: 'Personal knowledge base',
      seed: `${seed}-log`,
    })
  );

  quizQuestions.slice(3).forEach((question, index) => {
    addQuestion(
      makeQuizQuestion({
        prompt: question.prompt,
        correct: question.options[question.answer],
        distractors: question.options.filter(
          (_: string, optionIndex: number) => optionIndex !== question.answer
        ),
        category: 'Technical knowledge',
        seed: `${seed}-extra-core-${index}`,
      })
    );
  });

  if (orgOwners.length > 2) {
    const owner = orgOwners[2];
    addQuestion(
      makeQuizQuestion({
        prompt: `Organisational map: what does ${owner.name} own?`,
        correct: owner.owns,
        distractors: orgOwners
          .filter((person: any) => person.id !== owner.id)
          .map((person: any) => person.owns)
          .slice(0, 2),
        category: 'Organisational knowledge',
        seed: `${seed}-owner-extra`,
      })
    );
  }

  if (interpersonalLinks.length > 2) {
    const link = interpersonalLinks[2];
    const from =
      orgOwners.find((person: any) => person.id === link.from)?.name ||
      'Unknown';
    const to =
      orgOwners.find((person: any) => person.id === link.to)?.name || 'Unknown';
    addQuestion(
      makeQuizQuestion({
        prompt: `Interpersonal map: what is the current read on ${from} -> ${to}?`,
        correct: `${link.type} / ${link.temperature} / ${link.strength}`,
        distractors: [
          'Formal reporting line only; no informal signal recorded.',
          'Blocked / Cold / Critical by default.',
        ],
        category: 'Interpersonal knowledge',
        seed: `${seed}-link-extra`,
      })
    );
  }

  while (questions.length < 14 && domainTerms[0]) {
    const [code, meaning] = domainTerms[questions.length % domainTerms.length];
    addQuestion(
      makeQuizQuestion({
        prompt: `Flight Domain-apedia recall: what is the safest first interpretation of ${code.split('/')[0].trim()}?`,
        correct: meaning,
        distractors: [
          'A React component naming convention.',
          'A Jira workflow state.',
        ],
        category: 'Flight domain',
        seed: `${seed}-domain-fill-${questions.length}`,
      })
    );
    if (questions.length >= 14) break;
  }

  return questions.slice(0, 14);
}

function classifyItem(tags: string[] = [], groupId = '') {
  const businessTags = [
    'Delivery',
    'Release',
    'Quality',
    'Security',
    'Architecture',
    'Domain',
    'Resilience',
    'Observability',
    'Governance',
    'Engineering',
  ];
  const personalTags = [
    'Trust',
    'Empathy',
    'Culture',
    'Communication',
    'Team',
    'Leadership',
    'Authority',
  ];
  if (groupId === 'delivery') return 'Business';
  if (groupId === 'humans') return 'People';
  if (tags.some((tag) => personalTags.includes(tag))) return 'People';
  if (tags.some((tag) => businessTags.includes(tag))) return 'Business';
  return 'Learning';
}

function buildDailyPlan({
  done,
  dayDone,
  followups,
  currentDay,
  capacity,
}: {
  done: { [key: string]: boolean };
  dayDone: { [key: string]: boolean };
  followups: FollowupItem[];
  currentDay: number;
  capacity: number;
}) {
  const items: PlanItem[] = [];

  questGroups.forEach((group) => {
    group.quests.forEach(([title, xp], index) => {
      const id = `${group.id}-${index}`;
      if (!done[id]) {
        items.push({
          id: `core-${id}`,
          source: 'core',
          doneKey: id,
          title,
          xp,
          lane: group.title,
          type: classifyItem([], group.id),
          score: group.id === 'delivery' ? 72 : group.id === 'humans' ? 54 : 58,
        });
      }
    });
  });

  runwayDays.forEach((day, dayIndex) => {
    day.tasks.forEach(([title, xp, tags], taskIndex) => {
      const doneKey = `day-${dayIndex}-${taskIndex}`;
      if (
        !dayDone[doneKey] &&
        dayIndex + 1 <= Math.min(currentDay, runwayDays.length)
      ) {
        const carried = dayIndex + 1 < currentDay;
        items.push({
          id: `runway-${doneKey}`,
          source: 'runway',
          doneKey,
          title,
          xp,
          lane: carried
            ? `Carry forward from ${day.day}`
            : `${day.day}: ${day.title}`,
          type: classifyItem(tags),
          score:
            (carried ? 88 : 68) +
            (tags.includes('Delivery') || tags.includes('Release') ? 12 : 0),
        });
      }
    });
  });

  followups.forEach((item) => {
    if (!item.done) {
      const score =
        item.horizon === 'Tomorrow'
          ? 82
          : item.horizon === 'Next Week'
            ? 42
            : 20;
      items.push({
        id: `followup-${item.id}`,
        source: 'followup',
        doneKey: item.id,
        title: item.title,
        detail: item.detail,
        xp: 0,
        lane: item.horizon,
        type: item.horizon === 'Tomorrow' ? 'Adaptation' : 'Parked',
        score,
      });
    }
  });

  const sorted = [...items].sort((a, b) => b.score - a.score);
  const business = sorted.filter(
    (item) => item.type === 'Business' || item.type === 'Adaptation'
  );
  const people = sorted.filter(
    (item) => item.type === 'People' || item.type === 'Learning'
  );
  const other = sorted.filter(
    (item) => !business.includes(item) && !people.includes(item)
  );
  const focus: PlanItem[] = [];

  while (focus.length < Math.min(3, capacity) && business.length) {
    const item = business.shift();
    if (item) focus.push(item);
  }
  if (focus.length < capacity && people.length) {
    const item = people.shift();
    if (item) focus.push(item);
  }
  [...business, ...people, ...other].forEach((item) => {
    if (
      focus.length < capacity &&
      !focus.some((selected) => selected.id === item.id)
    )
      focus.push(item);
  });

  const focusIds = new Set(focus.map((item) => item.id));
  const parked = sorted.filter((item) => !focusIds.has(item.id));
  const carriedCount = items.filter((item) =>
    item.lane.startsWith('Carry forward')
  ).length;
  const pressure =
    items.length > capacity * 4
      ? 'High'
      : items.length > capacity * 2
        ? 'Medium'
        : 'Calm';

  return { focus, parked, carriedCount, pressure, totalOpen: items.length };
}

function buildEndOfDaySummary({
  today,
  logs,
  followups,
  dailyPlan,
  deliveryItems,
  deliverySettings,
}: any) {
  const todayLogs = logs.filter((log: any) => log.date === today);
  const notesByType = todayLogs.reduce((groups: any, log: any) => {
    groups[log.type] = (groups[log.type] || 0) + 1;
    return groups;
  }, {});
  const openTomorrow = followups.filter(
    (item: any) => !item.done && item.horizon === 'Tomorrow'
  ).length;
  const openWeek = followups.filter(
    (item: any) => !item.done && item.horizon === 'Next Week'
  ).length;
  const deliveryModel = buildDeliveryModel(
    deliveryItems,
    deliverySettings,
    today
  );
  const typeSummary =
    Object.entries(notesByType)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ') || 'No notes captured yet';
  return {
    todayLogs,
    typeSummary,
    openTomorrow,
    openWeek,
    deliveryPressure: deliveryModel.pressure,
    stakeholderMessage: deliveryModel.stakeholderMessage,
    topDriver:
      deliveryModel.topDrivers[0]?.title || 'No active delivery driver',
    parked: dailyPlan.parked.length,
    focusCount: dailyPlan.focus.length,
  };
}

function buildAcronymTitles() {
  const titles: { [key: string]: string } = {};
  domainGlossary.forEach(([codes, meaning, body, area]) => {
    codes
      .split('/')
      .map((code) => code.trim())
      .forEach((code) => {
        if (code) titles[code] = `${meaning}. ${body} Area: ${area}.`;
      });
  });
  return {
    ...titles,
    API: 'Application Programming Interface, or Advance Passenger Information in airline border/document contexts. Confirm which meaning is intended.',
    APIs: 'Application Programming Interfaces, or Advance Passenger Information in airline border/document contexts. Confirm which meaning is intended.',
    ADR: 'Architecture Decision Record. A short record of a significant technical decision, evidence, and consequence.',
    ADRs: 'Architecture Decision Records. Short records of significant technical decisions, evidence, and consequences.',
    AWS: 'Amazon Web Services. Cloud platform used for hosting, compute, storage, networking, and managed services.',
    Azure:
      'Microsoft Azure. Cloud platform used for hosting, compute, storage, networking, and managed services.',
    CI: 'Continuous Integration. Automated checks that run when code changes.',
    CD: 'Continuous Delivery or Continuous Deployment. Automated packaging, release, and deployment path.',
    'CI/CD':
      'Continuous Integration and Continuous Delivery or Deployment. Automated build, test, and release pipeline.',
    CSS: 'Cascading Style Sheets. Browser styling language for layout, visual design, and responsive behavior.',
    DOD: 'Definition of Done. Agreed quality and delivery bar before work is considered complete.',
    E2E: 'End to End. Testing or flow coverage across the full user/system journey.',
    ECS: 'Elastic Container Service. AWS container orchestration service.',
    GCP: 'Google Cloud Platform. Cloud platform used for hosting, compute, storage, networking, and managed services.',
    HTML: 'HyperText Markup Language. Browser document language for structure and semantics.',
    JSON: 'JavaScript Object Notation. Common structured data format for APIs and configuration.',
    KPI: 'Key Performance Indicator. A metric used to judge performance against a goal.',
    NFR: 'Non-Functional Requirement. Quality attribute such as reliability, performance, security, privacy, or operability.',
    NFRs: 'Non-Functional Requirements. Quality attributes such as reliability, performance, security, privacy, or operability.',
    P1: 'Priority 1. Highest urgency incident or defect category; confirm local severity definitions.',
    PR: 'Pull Request. Proposed code change submitted for review and merge.',
    PRs: 'Pull Requests. Proposed code changes submitted for review and merge.',
    QA: 'Quality Assurance. Testing and quality practices that reduce escaped defects.',
    RAID: 'Risks, Assumptions, Issues, and Dependencies. Delivery governance format for tracking uncertainty.',
    REST: 'Representational State Transfer. Common API style using HTTP resources and methods.',
    RPG: 'Role-Playing Game. Here, the onboarding app uses RPG-like quests, levels, and boss fights.',
    SME: 'Subject Matter Expert. Person with deep knowledge of a domain, system, process, or rule set.',
    SMEs: 'Subject Matter Experts. People with deep knowledge of a domain, system, process, or rule set.',
    TCS: 'Tata Consultancy Services. Offshore/vendor delivery partner referenced in this onboarding app.',
    TLA: 'Three-Letter Acronym. A short abbreviation that needs expansion until it becomes familiar.',
    TLAs: 'Three-Letter Acronyms. Short abbreviations that need expansion until they become familiar.',
    TLD: 'Top-Level Domain in web terminology. If used in acronym-learning context, you may mean TLA: Three-Letter Acronym.',
    TLDs: 'Top-Level Domains in web terminology. If used in acronym-learning context, you may mean TLAs: Three-Letter Acronyms.',
    TS: 'TypeScript. JavaScript with static types.',
    UX: 'User Experience. How usable, clear, and humane the product feels to the person using it.',
    UI: 'User Interface. The screens, controls, layout, and interaction surface users operate.',
    VA: 'Virgin Australia in this onboarding context. Also verify local internal usage where needed.',
  };
}

const acronymTitles: { [key: string]: string } = buildAcronymTitles();
const acronymPattern = new RegExp(
  `(^|[^A-Za-z0-9&/])(${Object.keys(acronymTitles)
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?=$|[^A-Za-z0-9&/])`,
  'g'
);

function enhanceAcronyms(root: HTMLElement | null) {
  if (!root) return;
  const skipTags = new Set([
    'ABBR',
    'INPUT',
    'TEXTAREA',
    'SELECT',
    'OPTION',
    'SCRIPT',
    'STYLE',
  ]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (
        !parent ||
        skipTags.has(parent.tagName) ||
        parent.closest('[data-skip-acronyms]')
      )
        return NodeFilter.FILTER_REJECT;
      if (!acronymPattern.test(node.nodeValue || ''))
        return NodeFilter.FILTER_REJECT;
      acronymPattern.lastIndex = 0;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Node[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const text = node.nodeValue || '';
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    acronymPattern.lastIndex = 0;
    text.replace(acronymPattern, (match, prefix, term, offset) => {
      const termStart = offset + prefix.length;
      fragment.append(
        document.createTextNode(text.slice(lastIndex, termStart))
      );
      const abbr = document.createElement('abbr');
      abbr.textContent = term;
      abbr.title = acronymTitles[term];
      abbr.setAttribute('tabindex', '0');
      abbr.setAttribute('aria-label', `${term}: ${acronymTitles[term]}`);
      fragment.append(abbr);
      lastIndex = termStart + term.length;
      return match;
    });
    fragment.append(document.createTextNode(text.slice(lastIndex)));
    node.parentNode?.replaceChild(fragment, node);
  });
}

// ==========================================
// 4. Main App & Views Wrapper
// ==========================================

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState('today');
  const todayStr = todayKey();

  const [profile, setProfile] = usePersistentState(
    'checkin-lead-quest.profile',
    defaultProfile
  );
  const [startDate, setStartDate] = usePersistentState(
    'checkin-lead-quest.startDate',
    ERIK_VA_START_DATE
  );
  const [done, setDone] = usePersistentState<any>(
    'checkin-lead-quest.done',
    {}
  );
  const [dayDone, setDayDone] = usePersistentState<any>(
    'checkin-lead-quest.dayDone',
    {}
  );
  const [selectedDay, setSelectedDay] = usePersistentState(
    'checkin-lead-quest.selectedDay',
    1
  );
  const [logs, setLogs] = usePersistentState<LogEntry[]>(
    'checkin-lead-quest.logs',
    [
      {
        id: 'initial-log-1',
        type: 'Observation',
        text: 'What did I learn today that changes the delivery picture?',
        date: todayStr,
      },
    ]
  );
  const [followups, setFollowups] = usePersistentState<FollowupItem[]>(
    'checkin-lead-quest.followups',
    defaultFollowups
  );
  const [bossDone, setBossDone] = usePersistentState<any>(
    'checkin-lead-quest.bossDone',
    {}
  );
  const [orgOwners, setOrgOwners] = usePersistentState<OrgOwner[]>(
    'checkin-lead-quest.orgOwners',
    defaultOrgOwners
  );
  const [interpersonalLinks, setInterpersonalLinks] = usePersistentState<
    InterpersonalLink[]
  >('checkin-lead-quest.interpersonalLinks', defaultInterpersonalLinks);
  const [deliveryItems, setDeliveryItems] = usePersistentState<DeliveryItem[]>(
    'checkin-lead-quest.deliveryItems',
    defaultDeliveryItems
  );
  const [deliverySettings, setDeliverySettings] =
    usePersistentState<DeliverySettings>(
      'checkin-lead-quest.deliverySettings',
      defaultDeliverySettings
    );
  const [evidenceLinks, setEvidenceLinks] = usePersistentState<EvidenceLink[]>(
    'checkin-lead-quest.evidenceLinks',
    defaultEvidenceLinks
  );
  const [ownerQuestions, setOwnerQuestions] = usePersistentState<
    OwnerQuestion[]
  >('checkin-lead-quest.ownerQuestions', defaultOwnerQuestions);
  const [quizAnswers, setQuizAnswers] = usePersistentState<any>(
    'checkin-lead-quest.quiz',
    {}
  );
  const [draft, setDraft] = useState({ type: 'Observation', text: '' });
  const [followupDraft, setFollowupDraft] = useState({
    horizon: 'Tomorrow',
    title: '',
    detail: '',
    source: 'App revision',
  });
  const [dailySettings, setDailySettings] = usePersistentState<DailySettings>(
    'checkin-lead-quest.dailySettings',
    {
      capacity: DEFAULT_DAILY_CAPACITY,
    }
  );
  const [dayFlowStage, setDayFlowStage] = usePersistentState(
    'checkin-lead-quest.dayFlowStage',
    'start'
  );
  const [dayFlowDone, setDayFlowDone] = usePersistentState<any>(
    'checkin-lead-quest.dayFlowDone',
    {}
  );

  const currentDay = Math.min(
    runwayDays.length,
    daysBetween(startDate, todayStr) + 1
  );
  const launchDelta = signedDaysBetween(todayStr, startDate);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (startDate < ERIK_VA_START_DATE) {
      setStartDate(ERIK_VA_START_DATE);
    }
  }, [startDate, setStartDate]);

  useEffect(() => {
    if (
      profile.startDate !== startDate ||
      profile.deadline !== deliverySettings.deadline
    ) {
      setProfile((current) => ({
        ...defaultProfile,
        ...current,
        startDate,
        deadline: deliverySettings.deadline,
      }));
    }
  }, [
    startDate,
    deliverySettings.deadline,
    profile.startDate,
    profile.deadline,
    setProfile,
  ]);

  useEffect(() => {
    if (mounted) {
      enhanceAcronyms(document.querySelector('.app-shell'));
    }
  });

  useEffect(() => {
    if (!mounted) return;

    function closeOpenAcronyms(event: MouseEvent) {
      document.querySelectorAll('abbr[data-open="true"]').forEach((abbr) => {
        if (abbr !== event.target) abbr.removeAttribute('data-open');
      });
    }

    function toggleAcronym(event: MouseEvent) {
      const abbr = (event.target as HTMLElement).closest('abbr');
      if (!abbr) return;
      const isOpen = abbr.getAttribute('data-open') === 'true';
      document
        .querySelectorAll('abbr[data-open="true"]')
        .forEach((openAbbr) => openAbbr.removeAttribute('data-open'));
      if (!isOpen) abbr.setAttribute('data-open', 'true');
    }

    function keyboardAcronym(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const abbr = (event.target as HTMLElement).closest('abbr');
      if (!abbr) return;
      event.preventDefault();
      abbr.setAttribute(
        'data-open',
        abbr.getAttribute('data-open') === 'true' ? 'false' : 'true'
      );
    }

    document.addEventListener('click', closeOpenAcronyms);
    document.addEventListener('click', toggleAcronym);
    document.addEventListener('keydown', keyboardAcronym);
    return () => {
      document.removeEventListener('click', closeOpenAcronyms);
      document.removeEventListener('click', toggleAcronym);
      document.removeEventListener('keydown', keyboardAcronym);
    };
  }, [mounted]);

  const flatQuests = useMemo(() => {
    return questGroups
      .flatMap((group) =>
        group.quests.map(([text, xp], index) => ({
          id: `${group.id}-${index}`,
          text,
          xp,
        }))
      )
      .concat(
        runwayDays.flatMap((day, dayIndex) =>
          day.tasks.map(([text, xp], taskIndex) => ({
            id: `day-${dayIndex}-${taskIndex}`,
            text,
            xp,
          }))
        )
      );
  }, []);

  const earnedXp = useMemo(() => {
    return flatQuests.reduce((sum, quest) => {
      const finished = quest.id.startsWith('day-')
        ? dayDone[quest.id]
        : done[quest.id];
      return sum + (finished ? quest.xp : 0);
    }, 0);
  }, [flatQuests, dayDone, done]);

  const totalXp = useMemo(() => {
    return flatQuests.reduce((sum, quest) => sum + quest.xp, 0);
  }, [flatQuests]);

  const level = Math.max(1, Math.floor(earnedXp / 75) + 1);
  const completed = flatQuests.filter((quest) =>
    quest.id.startsWith('day-') ? dayDone[quest.id] : done[quest.id]
  ).length;
  const progress = totalXp ? Math.round((earnedXp / totalXp) * 100) : 0;

  const dailyPlan = useMemo(() => {
    return buildDailyPlan({
      done,
      dayDone,
      followups,
      currentDay,
      capacity: dailySettings.capacity,
    });
  }, [done, dayDone, followups, currentDay, dailySettings.capacity]);

  function completePlanItem(item: PlanItem) {
    if (item.source === 'core') {
      setDone((current: any) => ({
        ...current,
        [item.doneKey]: !current[item.doneKey],
      }));
    }
    if (item.source === 'runway') {
      setDayDone((current: any) => ({
        ...current,
        [item.doneKey]: !current[item.doneKey],
      }));
    }
    if (item.source === 'followup') {
      setFollowups((current) =>
        current.map((followup) =>
          followup.id === item.doneKey
            ? { ...followup, done: !followup.done }
            : followup
        )
      );
    }
  }

  function restoreLocalState(payload: any) {
    if (!payload || typeof payload !== 'object') return;
    if (payload.profile) setProfile({ ...defaultProfile, ...payload.profile });
    if (payload.startDate) setStartDate(payload.startDate);
    if (payload.done) setDone(payload.done);
    if (payload.dayDone) setDayDone(payload.dayDone);
    if (Array.isArray(payload.logs)) setLogs(payload.logs);
    if (Array.isArray(payload.followups)) setFollowups(payload.followups);
    if (payload.bossDone) setBossDone(payload.bossDone);
    if (Array.isArray(payload.orgOwners)) setOrgOwners(payload.orgOwners);
    if (Array.isArray(payload.interpersonalLinks))
      setInterpersonalLinks(payload.interpersonalLinks);
    if (Array.isArray(payload.deliveryItems))
      setDeliveryItems(payload.deliveryItems);
    if (payload.deliverySettings) setDeliverySettings(payload.deliverySettings);
    if (Array.isArray(payload.evidenceLinks))
      setEvidenceLinks(payload.evidenceLinks);
    if (Array.isArray(payload.ownerQuestions))
      setOwnerQuestions(payload.ownerQuestions);
    if (payload.quizAnswers) setQuizAnswers(payload.quizAnswers);
  }

  const visiblePanel = useMemo(() => {
    if (active === 'map') return <QuestMap />;
    if (active === 'runway')
      return (
        <Runway
          dayDone={dayDone}
          setDayDone={setDayDone}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          setDraft={setDraft}
          setActive={setActive}
        />
      );
    if (active === 'domain') return <FlightDomain setDraft={setDraft} />;
    if (active === 'dcs-sim')
      return <DcsSimPanel setDraft={setDraft} setActive={setActive} />;
    if (active === 'trust') {
      return (
        <TeamTrust
          logs={logs}
          orgOwners={orgOwners}
          setOrgOwners={setOrgOwners}
          interpersonalLinks={interpersonalLinks}
          setInterpersonalLinks={setInterpersonalLinks}
          ownerQuestions={ownerQuestions}
          setOwnerQuestions={setOwnerQuestions}
          setDraft={setDraft}
          setActive={setActive}
        />
      );
    }
    if (active === 'followups')
      return (
        <Followups
          followups={followups}
          setFollowups={setFollowups}
          draft={followupDraft}
          setDraft={setFollowupDraft}
          setNoteDraft={setDraft}
          setActive={setActive}
        />
      );
    if (active === 'delivery')
      return (
        <SeptemberDelivery
          items={deliveryItems}
          setItems={setDeliveryItems}
          settings={deliverySettings}
          setSettings={setDeliverySettings}
          today={todayStr}
          evidenceLinks={evidenceLinks}
          setEvidenceLinks={setEvidenceLinks}
        />
      );
    if (active === 'quiz')
      return (
        <GraduationQuiz
          answers={quizAnswers}
          setAnswers={setQuizAnswers}
          today={todayStr}
          logs={logs}
          followups={followups}
          orgOwners={orgOwners}
          interpersonalLinks={interpersonalLinks}
          deliveryItems={deliveryItems}
          deliverySettings={deliverySettings}
        />
      );
    if (active === 'notes')
      return (
        <Notes
          logs={logs}
          setLogs={setLogs}
          draft={draft}
          setDraft={setDraft}
        />
      );

    return (
      <Today
        done={done}
        setDone={setDone}
        logs={logs}
        setLogs={setLogs}
        draft={draft}
        setDraft={setDraft}
        dayDone={dayDone}
        setDayDone={setDayDone}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        followups={followups}
        setFollowups={setFollowups}
        dailyPlan={dailyPlan}
        dailySettings={dailySettings}
        setDailySettings={setDailySettings}
        dayFlowStage={dayFlowStage}
        setDayFlowStage={setDayFlowStage}
        dayFlowDone={dayFlowDone}
        setDayFlowDone={setDayFlowDone}
        currentDay={currentDay}
        launchDelta={launchDelta}
        today={todayStr}
        startDate={startDate}
        setStartDate={setStartDate}
        profile={profile}
        setProfile={setProfile}
        completePlanItem={completePlanItem}
        setActive={setActive}
        deliveryItems={deliveryItems}
        deliverySettings={deliverySettings}
        evidenceLinks={evidenceLinks}
        setEvidenceLinks={setEvidenceLinks}
        ownerQuestions={ownerQuestions}
        setOwnerQuestions={setOwnerQuestions}
        exportState={exportOnboardingState({
          profile,
          startDate,
          today: todayStr,
          done,
          dayDone,
          logs,
          followups,
          bossDone,
          orgOwners,
          interpersonalLinks,
          deliveryItems,
          deliverySettings,
          evidenceLinks,
          ownerQuestions,
          quizAnswers,
        })}
        onImportState={restoreLocalState}
      />
    );
  }, [
    active,
    done,
    setDone,
    logs,
    setLogs,
    draft,
    dayDone,
    setDayDone,
    selectedDay,
    setSelectedDay,
    followups,
    followupDraft,
    orgOwners,
    setOrgOwners,
    interpersonalLinks,
    setInterpersonalLinks,
    deliveryItems,
    setDeliveryItems,
    deliverySettings,
    setDeliverySettings,
    evidenceLinks,
    setEvidenceLinks,
    ownerQuestions,
    setOwnerQuestions,
    quizAnswers,
    setQuizAnswers,
    dailyPlan,
    dailySettings,
    dayFlowStage,
    setDayFlowStage,
    dayFlowDone,
    setDayFlowDone,
    currentDay,
    launchDelta,
    startDate,
    setStartDate,
    profile,
    setProfile,
    todayStr,
    bossDone,
  ]);

  if (!mounted) {
    return (
      <div
        className="app-shell loading-shell"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0B0D17',
          color: '#8F9CAE',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#E2E8F0', marginBottom: '8px' }}>
            Initializing Onboarding Cockpit...
          </h2>
          <p style={{ fontSize: '14px' }}>
            Loading Erik's Virgin Australia Technical Lead simulator
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'today', label: 'Daily Guide', hint: 'Prep to quiz', icon: Home },
    { id: 'map', label: 'Roadmap', hint: '6-month arc', icon: MapIcon },
    {
      id: 'runway',
      label: '5-Day Runway',
      hint: 'First week',
      icon: RadioTower,
    },
    {
      id: 'domain',
      label: 'Flight Domain',
      hint: 'Airline context',
      icon: Plane,
    },
    {
      id: 'dcs-sim',
      label: 'DCS Simulator',
      hint: 'Console & Sandbox',
      icon: Terminal,
    },
    { id: 'trust', label: 'Team Trust', hint: 'People rhythm', icon: Users },
    {
      id: 'followups',
      label: 'Follow-ups',
      hint: 'Adapt goals',
      icon: ClipboardList,
    },
    {
      id: 'delivery',
      label: 'September Delivery',
      hint: 'Release risk',
      icon: CalendarDays,
    },
    {
      id: 'quiz',
      label: 'Graduation Quiz',
      hint: 'Check mastery',
      icon: Brain,
    },
    { id: 'notes', label: 'Notes', hint: 'Save signal', icon: FileText },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">VA</div>
          <div>
            <strong>Virgin Australia</strong>
            <span>Leadership cockpit</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => setActive(item.id)}
                aria-label={`${item.label}: ${item.hint}`}
              >
                <Icon size={20} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="system-card">
          <span className="section-label">Evidence Status</span>
          <strong>
            <span className="pulse" /> Local prep
          </strong>
          <small>Paste real VA links as access lands</small>
          {evidenceLinks.slice(0, 4).map((item) => (
            <div className="status-row" key={item.id}>
              <span>{item.label}</span>
              <em>{item.status}</em>
            </div>
          ))}
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="title-block">
            <div className="app-icon">
              <Plane size={25} />
            </div>
            <div>
              <h1>Check-in Lead Cockpit</h1>
              <p>Day 1 to Month 6 technical leadership system</p>
            </div>
          </div>
          <div className="player-stats">
            <Stat label="Level" value={level} />
            <Stat label="XP" value={`${earnedXp} / ${totalXp}`} />
            <Stat label="Start" value="May 25" urgent={launchDelta >= 0} />
            <Stat label="Deadline" value="Sep. 30" urgent />
            <div className="profile">
              <div className="avatar">{profile.initials || 'EV'}</div>
              <div>
                <strong>{profile.name || 'Erik'}</strong>
                <span>{profile.role || 'Technical Lead'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="hero-strip">
          <div>
            <span className="section-label">Current Objective</span>
            <strong>
              {launchDelta > 0
                ? `${launchDelta} days until VA Monday.`
                : 'Build trust, expose risk, land September.'}
            </strong>
            <p>
              {launchDelta > 0
                ? `Prep the ${profile.product} takeover before ${formatDate(startDate)}.`
                : 'Learn the domain, make decisions traceable, and turn offshore delivery into a calm operating rhythm.'}
            </p>
          </div>
          <div className="meter">
            <span>
              {completed} / {flatQuests.length} quests
            </span>
            <div>
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>

        {visiblePanel}
      </main>

      <aside className="right-rail">
        <BossFights bossDone={bossDone} setBossDone={setBossDone} />
      </aside>
    </div>
  );
}

function Stat({
  label,
  value,
  urgent,
}: {
  label: string;
  value: string | number;
  urgent?: boolean;
}) {
  return (
    <div className={urgent ? 'stat urgent' : 'stat'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// ==========================================
// 5. Today (Daily Guide) Tab
// ==========================================

function Today({
  done,
  setDone,
  logs,
  setLogs,
  draft,
  setDraft,
  dayDone,
  setDayDone,
  selectedDay,
  setSelectedDay,
  followups,
  setFollowups,
  dailyPlan,
  dailySettings,
  setDailySettings,
  dayFlowStage,
  setDayFlowStage,
  dayFlowDone,
  setDayFlowDone,
  currentDay,
  launchDelta,
  today,
  startDate,
  setStartDate,
  profile,
  setProfile,
  completePlanItem,
  setActive,
  deliveryItems,
  deliverySettings,
  evidenceLinks,
  setEvidenceLinks,
  ownerQuestions,
  setOwnerQuestions,
  exportState,
  onImportState,
}: any) {
  const openFollowups = followups.filter((item: any) => !item.done).slice(0, 3);
  const summary = buildEndOfDaySummary({
    today,
    logs,
    followups,
    dailyPlan,
    deliveryItems,
    deliverySettings,
  });
  const doneForStage = dayFlowActions[
    dayFlowStage as keyof typeof dayFlowActions
  ].filter(
    (_, index) => dayFlowDone[`${today}-${dayFlowStage}-${index}`]
  ).length;

  return (
    <section className="panel full-panel daily-guide">
      <PanelTitle
        icon={Home}
        title="Daily Guide"
        meta={`${doneForStage} / ${dayFlowActions[dayFlowStage as keyof typeof dayFlowActions].length} in this step`}
      />
      <LocalOnboardingSetup
        profile={profile}
        setProfile={setProfile}
        startDate={startDate}
        setStartDate={setStartDate}
        today={today}
        launchDelta={launchDelta}
        evidenceLinks={evidenceLinks}
        setEvidenceLinks={setEvidenceLinks}
        ownerQuestions={ownerQuestions}
        setOwnerQuestions={setOwnerQuestions}
        exportState={exportState}
        onImportState={onImportState}
        deliveryItems={deliveryItems}
        deliverySettings={deliverySettings}
      />
      <div className="daily-guide-hero">
        <div>
          <span className="section-label">Use this lightly</span>
          <strong>
            Open it briefly, orient, capture signals, then go do the real job.
          </strong>
          <p>
            The app should hold context and pressure so your brain does not have
            to. Five minutes at each edge of the day is enough.
          </p>
        </div>
        <button onClick={() => setDayFlowStage('during')}>
          <MessageSquareText size={16} /> Capture now
        </button>
      </div>
      <div
        className="day-flow-tabs"
        role="tablist"
        aria-label="Daily guide flow"
      >
        {dayFlowStages.map((stage) => (
          <button
            key={stage.id}
            className={dayFlowStage === stage.id ? 'active' : ''}
            onClick={() => setDayFlowStage(stage.id)}
            role="tab"
            aria-selected={dayFlowStage === stage.id}
          >
            <strong>{stage.label}</strong>
            <span>{stage.hint}</span>
          </button>
        ))}
      </div>

      <section className="day-flow-body">
        <DayFlowChecklist
          stage={dayFlowStage}
          today={today}
          done={dayFlowDone}
          setDone={setDayFlowDone}
        />
        {dayFlowStage === 'before' && (
          <div className="flow-card-grid">
            <article className="flow-card">
              <span>Look ahead</span>
              <strong>What would make today successful?</strong>
              <p>
                One business outcome, one team relationship, one unknown to
                reduce.
              </p>
            </article>
            <article className="flow-card">
              <span>Open follow-ups</span>
              <strong>{openFollowups.length} near-term prompts</strong>
              <p>
                {openFollowups[0]?.title ||
                  'No urgent follow-up queued. Keep it that way.'}
              </p>
              <button onClick={() => setActive('followups')}>
                Review follow-ups
              </button>
            </article>
            <article className="flow-card">
              <span>Reference only</span>
              <strong>Need context?</strong>
              <p>
                Use the domain or team map only when it answers a concrete
                question.
              </p>
              <div className="flow-card-actions">
                <button onClick={() => setActive('domain')}>
                  Flight Domain
                </button>
                <button onClick={() => setActive('trust')}>Team Trust</button>
              </div>
            </article>
          </div>
        )}
        {dayFlowStage === 'start' && (
          <>
            <DailyPlanner
              plan={dailyPlan}
              settings={dailySettings}
              setSettings={setDailySettings}
              currentDay={currentDay}
              today={today}
              setFollowups={setFollowups}
              onComplete={completePlanItem}
              onOpenFollowups={() => setActive('followups')}
            />
            <div className="flow-mini-links">
              <button onClick={() => setActive('delivery')}>
                <CalendarDays size={15} /> Check delivery reality
              </button>
              <button onClick={() => setDayFlowStage('during')}>
                <ChevronRight size={15} /> Start the day
              </button>
            </div>
          </>
        )}
        {dayFlowStage === 'during' && (
          <DuringPanel
            logs={logs}
            setLogs={setLogs}
            draft={draft}
            setDraft={setDraft}
            followups={openFollowups}
            setActive={setActive}
          />
        )}
        {dayFlowStage === 'end' && (
          <EndOfDayReview
            summary={summary}
            setDraft={setDraft}
            setActive={setActive}
            setDayFlowStage={setDayFlowStage}
          />
        )}
      </section>
    </section>
  );
}

function LocalOnboardingSetup({
  profile,
  setProfile,
  startDate,
  setStartDate,
  today,
  launchDelta,
  evidenceLinks,
  setEvidenceLinks,
  ownerQuestions,
  setOwnerQuestions,
  exportState,
  onImportState,
  deliveryItems,
  deliverySettings,
}: any) {
  const [importDraft, setImportDraft] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const verifiedCount = evidenceLinks.filter(
    (item: any) => item.status === 'Verified'
  ).length;
  const openQuestions = ownerQuestions.filter(
    (item: any) => item.status !== 'Closed'
  ).length;
  const model = buildDeliveryModel(deliveryItems, deliverySettings, today);
  const launchCopy =
    launchDelta > 0
      ? `${launchDelta} days until Day 1`
      : launchDelta === 0
        ? 'Today is Day 1'
        : `Day ${Math.min(runwayDays.length, Math.abs(launchDelta) + 1)} since start`;

  async function copyReadout() {
    const markdown = buildReadoutMarkdown({
      profile,
      startDate,
      today,
      evidenceLinks,
      ownerQuestions,
      deliveryItems,
      deliverySettings,
    });
    try {
      await navigator.clipboard.writeText(markdown);
      setActionMessage('Readout copied as Markdown.');
    } catch {
      setActionMessage('Clipboard blocked; use JSON export instead.');
    }
  }

  function importState() {
    try {
      const parsed = JSON.parse(importDraft);
      onImportState(parsed);
      setImportDraft('');
      setActionMessage('Local onboarding state imported.');
    } catch {
      setActionMessage('Import needs valid JSON from this app.');
    }
  }

  return (
    <section className="local-setup">
      <div className="local-setup-head">
        <div>
          <span className="section-label">Ultra-local setup</span>
          <strong>{profile.name}'s VA Monday cockpit</strong>
          <p>{profile.intent}</p>
        </div>
        <div className="local-countdown">
          <span>{launchCopy}</span>
          <strong>{formatDate(startDate)}</strong>
        </div>
      </div>

      <div className="local-setup-grid">
        <label>
          Name
          <input
            value={profile.name}
            onChange={(event) =>
              setProfile((current: any) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Initials
          <input
            value={profile.initials}
            onChange={(event) =>
              setProfile((current: any) => ({
                ...current,
                initials: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Role
          <input
            value={profile.role}
            onChange={(event) =>
              setProfile((current: any) => ({
                ...current,
                role: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Product
          <input
            value={profile.product}
            onChange={(event) =>
              setProfile((current: any) => ({
                ...current,
                product: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value || ERIK_VA_START_DATE)
            }
          />
        </label>
        <label>
          September deadline
          <input
            type="date"
            value={profile.deadline}
            onChange={(event) =>
              setProfile((current: any) => ({
                ...current,
                deadline: event.target.value || ERIK_VA_DEADLINE,
              }))
            }
          />
        </label>
      </div>

      <div className="local-signal-row">
        <article>
          <span>Evidence</span>
          <strong>
            {verifiedCount}/{evidenceLinks.length} verified
          </strong>
          <p>
            Everything starts as unknown until a real VA architecture, wiki, or
            code file validates it.
          </p>
        </article>
        <article>
          <span>Questions</span>
          <strong>{openQuestions} open</strong>
          <p>Ask by owner and timebox. No loose anxiety pile.</p>
        </article>
        <article>
          <span>Delivery</span>
          <strong>{model.pressure}</strong>
          <p>
            {model.evidenceCoverage}% evidence coverage across active delivery
            items.
          </p>
        </article>
      </div>

      <div className="privacy-note">
        <Lock size={16} />
        <p>
          This is local-only prep. Avoid storing passenger PII, passport data,
          credit card details, secrets, or screenshots containing sensitive
          customer details.
        </p>
      </div>

      <EvidenceLinksEditor
        links={evidenceLinks}
        setLinks={setEvidenceLinks}
        compact
      />
      <OwnerQuestionBoard
        questions={ownerQuestions}
        setQuestions={setOwnerQuestions}
        compact
      />

      <div className="local-export">
        <button
          onClick={() =>
            downloadJson(`va-checkin-onboarding-${today}.json`, exportState)
          }
        >
          <Download size={15} /> Export JSON
        </button>
        <button onClick={copyReadout}>
          <Copy size={15} /> Copy readout
        </button>
        <textarea
          value={importDraft}
          onChange={(event) => setImportDraft(event.target.value)}
          placeholder="Paste exported JSON here to restore Erik's local cockpit state."
          aria-label="Import onboarding JSON"
        />
        <button onClick={importState}>
          <Upload size={15} /> Import JSON
        </button>
        {actionMessage && <span>{actionMessage}</span>}
      </div>
    </section>
  );
}

function DayFlowChecklist({
  stage,
  today,
  done,
  setDone,
}: {
  stage: string;
  today: string;
  done: any;
  setDone: any;
}) {
  const actions = dayFlowActions[stage as keyof typeof dayFlowActions] || [];
  return (
    <div className="day-flow-checklist">
      <div className="daily-section-heading">
        <strong>
          {dayFlowStages.find((item) => item.id === stage)?.label} checklist
        </strong>
        <span>Keep this short</span>
      </div>
      {actions.map((action, index) => {
        const key = `${today}-${stage}-${index}`;
        return (
          <label className={done[key] ? 'checked' : ''} key={action}>
            <input
              type="checkbox"
              checked={Boolean(done[key])}
              onChange={() =>
                setDone((current: any) => ({
                  ...current,
                  [key]: !current[key],
                }))
              }
            />
            <span>{action}</span>
          </label>
        );
      })}
    </div>
  );
}

function EndOfDayReview({
  summary,
  setDraft,
  setActive,
  setDayFlowStage,
}: any) {
  const handoff = `End-of-day handoff: ${summary.typeSummary}. Delivery pressure: ${summary.deliveryPressure}. Top driver: ${summary.topDriver}. Tomorrow follow-ups: ${summary.openTomorrow}. Stakeholder message: ${summary.stakeholderMessage}`;

  return (
    <div className="end-day-review">
      <div className="end-summary-grid">
        <article>
          <span>Captured today</span>
          <strong>{summary.todayLogs.length} notes</strong>
          <p>{summary.typeSummary}</p>
        </article>
        <article>
          <span>Tomorrow queue</span>
          <strong>{summary.openTomorrow}</strong>
          <p>
            {summary.openWeek} more parked for next week. Parked today:{' '}
            {summary.parked}.
          </p>
        </article>
        <article>
          <span>Delivery read</span>
          <strong>{summary.deliveryPressure}</strong>
          <p>{summary.topDriver}</p>
        </article>
      </div>
      <div className="handoff-card">
        <span className="section-label">Suggested handoff</span>
        <p>{handoff}</p>
        <div>
          <button
            onClick={() => setDraft({ type: 'Observation', text: handoff })}
          >
            <Plus size={15} /> Put in Notes
          </button>
          <button onClick={() => setActive('quiz')}>
            <Brain size={15} /> Take end-of-day quiz
          </button>
        </div>
      </div>
      <div className="flow-mini-links">
        <button onClick={() => setActive('followups')}>
          Adjust tomorrow/week/month
        </button>
        <button onClick={() => setDayFlowStage('before')}>
          Preview tomorrow prep
        </button>
      </div>
    </div>
  );
}

function DuringPanel({
  logs,
  setLogs,
  draft,
  setDraft,
  followups,
  setActive,
}: any) {
  const prompts = [
    ['Observation', 'What changed that should shape tomorrow?'],
    ['Decision', 'Decision, owner, evidence, who needs to know.'],
    ['Risk', 'Signal, impact, owner, next check date.'],
  ];
  const routeActions = [
    [
      'Delivery risk',
      'Material timeline, scope, quality, or stakeholder impact.',
      () => setActive('delivery'),
    ],
    [
      'Person intel',
      'Owner, pressure, trust signal, reporting line, or relationship clue.',
      () => setActive('trust'),
    ],
    [
      'Follow-up',
      'Something for tomorrow, next week, or next month.',
      () => setActive('followups'),
    ],
    [
      'Domain term',
      'Acronym, system rule, flow, schema, or unknown airline concept.',
      () =>
        setDraft({
          type: 'Domain Term',
          text: 'Term / meaning / where I heard it / why it matters: ',
        }),
    ],
  ];

  function addLog() {
    if (!draft.text.trim()) return;
    setLogs((current: any) => [
      {
        id: generateId(),
        type: draft.type,
        text: draft.text.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
    setDraft({ type: draft.type, text: '' });
  }

  return (
    <div className="during-workspace">
      <section className="during-capture" aria-label="Capture a signal">
        <div className="during-heading">
          <div>
            <span className="section-label">Primary action</span>
            <h3>Capture a signal</h3>
            <p>One clear note. Then leave the app and keep working.</p>
          </div>
          <strong>{logs.length} saved</strong>
        </div>
        <div className="during-compose">
          <select
            aria-label="Signal type"
            value={draft.type}
            onChange={(event) =>
              setDraft({ ...draft, type: event.target.value })
            }
          >
            <option>Observation</option>
            <option>Evidence</option>
            <option>Decision</option>
            <option>Follow-up</option>
            <option>Person</option>
            <option>Risk</option>
            <option>Domain Term</option>
          </select>
          <textarea
            value={draft.text}
            onChange={(event) =>
              setDraft({ ...draft, text: event.target.value })
            }
            placeholder="Example: Seat map failures may block completion; confirm owner, fallback path, and stakeholder wording."
            aria-label="Signal note"
          />
          <button onClick={addLog}>
            <Plus size={16} /> Save signal
          </button>
        </div>
        <div className="during-prompt-row" aria-label="Signal templates">
          {prompts.map(([type, text]) => (
            <button key={type} onClick={() => setDraft({ type, text })}>
              <span>{type}</span>
              <strong>{text}</strong>
            </button>
          ))}
        </div>
        <div className="recent-signals">
          <div className="daily-section-heading">
            <strong>Recent signals</strong>
            <span>Newest first</span>
          </div>
          {logs.slice(0, 3).map((log: any) => (
            <article key={log.id}>
              <span>{log.type}</span>
              <p>{log.text}</p>
              <time>{log.date}</time>
            </article>
          ))}
        </div>
      </section>

      <aside className="during-side" aria-label="Route and triage signals">
        <section className="route-card">
          <span className="section-label">Route it</span>
          <h3>Where should this go?</h3>
          <div>
            {routeActions.map(([title, body, action]: any) => (
              <button key={title} onClick={action}>
                <strong>{title}</strong>
                <span>{body}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="interrupt-card">
          <span className="section-label">Interruption rule</span>
          <strong>Interrupt today only for:</strong>
          <ul>
            <li>Blocked critical-path work</li>
            <li>A decision needed today</li>
            <li>Material September delivery risk</li>
          </ul>
        </section>
        <section className="during-followups">
          <div className="daily-section-heading">
            <strong>Next prompts</strong>
            <span>{followups.length} open</span>
          </div>
          {followups.map((item: any) => (
            <article key={item.id}>
              <span>{item.horizon}</span>
              <strong>{item.title}</strong>
            </article>
          ))}
          <button onClick={() => setActive('followups')}>
            <Plus size={15} /> Add or reorganise
          </button>
        </section>
      </aside>
    </div>
  );
}

function DailyPlanner({
  plan,
  settings,
  setSettings,
  currentDay,
  today,
  setFollowups,
  onComplete,
  onOpenFollowups,
}: any) {
  const [quickGoal, setQuickGoal] = useState('');
  const focusBusiness = plan.focus.filter(
    (item: any) => item.type === 'Business' || item.type === 'Adaptation'
  ).length;
  const focusPeople = plan.focus.filter(
    (item: any) => item.type === 'People' || item.type === 'Learning'
  ).length;
  const pressureCopy =
    plan.pressure === 'High'
      ? 'High backlog. Today is capped; parked work is not failure.'
      : plan.pressure === 'Medium'
        ? 'Some buildup. Protect focus and move the rest deliberately.'
        : 'Manageable. Keep the loop calm and evidence-based.';

  function addQuickGoal() {
    if (!quickGoal.trim()) return;
    setFollowups((current: any) => [
      {
        id: generateId(),
        horizon: 'Tomorrow',
        title: quickGoal.trim(),
        detail: "Added from Today. Reassess during tomorrow's planning pass.",
        source: 'Daily plan',
        done: false,
      },
      ...current,
    ]);
    setQuickGoal('');
  }

  return (
    <section className="daily-planner">
      <PanelTitle
        icon={Gauge}
        title="Today Plan"
        meta={`${today} / runway day ${currentDay}`}
      />
      <div className={`daily-pressure ${plan.pressure.toLowerCase()}`}>
        <div>
          <span className="section-label">Load</span>
          <strong>{plan.pressure}</strong>
          <p>{pressureCopy}</p>
        </div>
        <div>
          <span>Focus cap</span>
          <select
            aria-label="Daily focus cap"
            value={settings.capacity}
            onChange={(event) =>
              setSettings((current: any) => ({
                ...current,
                capacity: Number(event.target.value),
              }))
            }
          >
            {[3, 4, 5, 6, 7].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span>Business</span>
          <strong>{focusBusiness}</strong>
        </div>
        <div>
          <span>People/learning</span>
          <strong>{focusPeople}</strong>
        </div>
      </div>
      <div className="daily-section-heading">
        <strong>Do these first</strong>
        <span>{plan.focus.length} protected actions for today</span>
      </div>
      <div
        className="daily-focus-list"
        aria-label="Protected focus actions for today"
      >
        {plan.focus.map((item: any) => (
          <label
            key={item.id}
            className={`daily-focus-item ${item.type.toLowerCase()}`}
          >
            <input type="checkbox" onChange={() => onComplete(item)} />
            <span>
              <strong>{item.title}</strong>
              <small>
                {item.lane} / {item.type}
                {item.xp ? ` / ${item.xp} XP` : ''}
              </small>
              {item.detail && <em>{item.detail}</em>}
            </span>
          </label>
        ))}
      </div>
      <div className="daily-overflow">
        <strong>
          Not today: {plan.parked.length} parked, {plan.carriedCount} carried
          forward
        </strong>
        <p>
          Parking is intentional. The app keeps the work visible without asking
          you to hold it all in your head.
        </p>
        <button onClick={onOpenFollowups}>Review mutations</button>
      </div>
      <div className="daily-quick-add">
        <input
          value={quickGoal}
          onChange={(event) => setQuickGoal(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addQuickGoal();
          }}
          placeholder="New goal or adjustment for tomorrow"
          aria-label="New goal or adjustment for tomorrow"
        />
        <button onClick={addQuickGoal}>
          <Plus size={15} /> Add to tomorrow
        </button>
      </div>
    </section>
  );
}

function PanelTitle({
  icon: Icon,
  title,
  meta,
}: {
  icon: React.ComponentType<any>;
  title: string;
  meta?: string | number;
}) {
  return (
    <div className="panel-title">
      <div>
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      <span>{meta}</span>
    </div>
  );
}

// ==========================================
// 6. Roadmap Tab
// ==========================================

function QuestMap() {
  return (
    <section className="panel full-panel">
      <PanelTitle
        icon={MapIcon}
        title="Roadmap"
        meta="From takeover to durable leadership"
      />
      <Timeline />
      <div className="map-grid">
        {timeline.map(([date, title, body], index) => (
          <article key={date}>
            <span>Stage {index + 1}</span>
            <h3>
              {date}: {title}
            </h3>
            <p>{body}</p>
            <ul>
              <li>
                Primary artifact:{' '}
                {index < 2
                  ? 'context map and trust notes'
                  : index < 4
                    ? 'delivery system and quality gates'
                    : 'release evidence and capability plan'}
              </li>
              <li>
                Leadership move:{' '}
                {index < 2
                  ? 'ask sharper questions'
                  : index < 4
                    ? 'make trade-offs explicit'
                    : 'turn execution into repeatable practice'}
              </li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <div className="timeline">
      {timeline.map(([date, title, body], index) => (
        <div
          className={index === 4 ? 'timeline-stop milestone' : 'timeline-stop'}
          key={date}
        >
          <span>{date}</span>
          <button>
            {index === 0 ? (
              <Target size={20} />
            ) : index === 4 ? (
              <Sparkles size={20} />
            ) : (
              <Plane size={18} />
            )}
          </button>
          <strong>{title}</strong>
          <p>{body}</p>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 7. 5-Day Runway Tab
// ==========================================

function Runway({
  dayDone,
  setDayDone,
  selectedDay,
  setSelectedDay,
  setDraft,
  setActive,
}: any) {
  return (
    <section className="panel full-panel">
      <PanelTitle
        icon={RadioTower}
        title="5-Day Runway"
        meta="Tactical first-week curriculum"
      />
      <div className="runway-grid">
        {runwayDays.map((item, dayIndex) => {
          const completed = item.tasks.filter(
            (_, taskIndex) => dayDone[`day-${dayIndex}-${taskIndex}`]
          ).length;
          return (
            <article
              key={item.day}
              className={
                selectedDay === dayIndex + 1
                  ? 'runway-card selected'
                  : 'runway-card'
              }
              onClick={() => setSelectedDay(dayIndex + 1)}
            >
              <div>
                <span>{item.day}</span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.focus}</p>
              <div className="runway-progress">
                <i
                  style={{
                    width: `${Math.round((completed / item.tasks.length) * 100)}%`,
                  }}
                />
              </div>
              <strong>
                {completed} / {item.tasks.length} complete
              </strong>
              <dl>
                <dt>Verify</dt>
                <dd>{item.verify}</dd>
                <dt>Artifact</dt>
                <dd>{item.artifact}</dd>
                <dt>Code lens</dt>
                <dd>{item.code}</dd>
              </dl>
              <div className="runway-card-tasks">
                {item.tasks.map(([text, xp], taskIndex) => {
                  const id = `day-${dayIndex}-${taskIndex}`;
                  return (
                    <label
                      className={dayDone[id] ? 'done' : ''}
                      key={id}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(dayDone[id])}
                        onChange={() =>
                          setDayDone((current: any) => ({
                            ...current,
                            [id]: !current[id],
                          }))
                        }
                      />
                      <span>{text}</span>
                      <em>{xp} XP</em>
                    </label>
                  );
                })}
              </div>
              <div
                className="note-template"
                style={{ marginTop: '16px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <strong>Note template</strong>
                <p
                  style={{
                    fontStyle: 'italic',
                    fontSize: '12px',
                    margin: '4px 0 8px 0',
                  }}
                >
                  {item.template}
                </p>
                <button
                  onClick={() => {
                    setDraft({ type: 'Observation', text: item.template });
                    setActive('notes');
                  }}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  <Plus size={12} /> Use template
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// 8. Flight Domain Tab
// ==========================================

function FlightDomain({ setDraft }: { setDraft: any }) {
  const glossaryGroups = domainGlossary.reduce((groups: any, item) => {
    const group = item[3].split('/')[0];
    return { ...groups, [group]: [...(groups[group] || []), item] };
  }, {});

  return (
    <section className="panel full-panel domain-pedia">
      <PanelTitle
        icon={Plane}
        title="Flight Domain-apedia"
        meta="Beginner to advanced"
      />
      <div className="pedia-hero">
        <div>
          <span className="section-label">Civilopedia mode</span>
          <strong>Learn the world behind web check-in.</strong>
          <p>
            This is the map from booking to boarding: the systems, acronyms,
            flows, schemas, failure modes, and questions Erik should use to
            become dangerous in the domain without pretending private VA details
            are known before verification.
          </p>
        </div>
        <div className="pedia-legend">
          <span>
            <i className="retail" /> Retail
          </span>
          <span>
            <i className="departure" /> DCS/check-in
          </span>
          <span>
            <i className="airport" /> Airport
          </span>
          <span>
            <i className="ops" /> Ops/security
          </span>
        </div>
      </div>

      <section className="pedia-section">
        <h3>Visual System Map</h3>
        <div
          className="domain-chart"
          aria-label="Visual chart linking flight domain subdomains"
        >
          {flightSubdomains.map((node, index) => (
            <article className={`domain-node ${node.id}`} key={node.id}>
              <span>{index + 1}</span>
              <strong>{node.title}</strong>
              <p>{node.short}</p>
              <small>{node.terms.join(' / ')}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="pedia-section">
        <h3>Subdomains To Master</h3>
        <div className="subdomain-grid">
          {flightSubdomains.map((domain) => (
            <article key={domain.id}>
              <span>{domain.short}</span>
              <h4>{domain.title}</h4>
              <p>{domain.body}</p>
              <div>
                {domain.terms.map((term) => (
                  <b key={term}>{term}</b>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pedia-section">
        <h3>Acronyms / TLAs</h3>
        <p className="pedia-note">
          Some acronyms are overloaded. ETA is the classic trap: it can mean
          Electronic Travel Authority or Estimated Time of Arrival. Always
          confirm local usage.
        </p>
        <div className="glossary-grid">
          {Object.entries(glossaryGroups).map(([group, items]: any) => (
            <details
              open={['Retail', 'Check-in', 'Baggage'].includes(group)}
              key={group}
            >
              <summary>
                {group} <span>{items.length}</span>
              </summary>
              {items.map(([code, meaning, body, area]: any) => (
                <article key={`${group}-${code}`}>
                  <strong>{code}</strong>
                  <div>
                    <span>{meaning}</span>
                    <p>{body}</p>
                    <small>{area}</small>
                  </div>
                </article>
              ))}
            </details>
          ))}
        </div>
      </section>

      <section className="pedia-section">
        <h3>Canonical Check-in Flow</h3>
        <div className="flow-lanes">
          {checkInFlows.map(([title, steps]: any, index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h4>{title}</h4>
              <ol>
                {steps.map((step: string) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="pedia-section schema-section">
        <h3>Schemas To Recognise</h3>
        <div className="schema-grid">
          {domainSchemas.map(([title, schema]) => (
            <article key={title}>
              <h4>{title}</h4>
              <pre>{schema}</pre>
            </article>
          ))}
        </div>
      </section>

      <section className="pedia-section">
        <h3>Failure Modes To Hunt</h3>
        <div className="failure-grid">
          {[
            [
              'Booking found, ticket invalid',
              'Customer has itinerary but not travel entitlement. Explain without blaming the customer.',
            ],
            [
              'Eligible but BP suppressed',
              'Docs, payment, airport, security, or route rule blocks boarding pass delivery.',
            ],
            [
              'DCS commit uncertain',
              'Timeout after side effect. Requires idempotency, reconciliation, and clear retry rules.',
            ],
            [
              'Seat map stale',
              'Inventory changed, aircraft swapped, or seat service is degraded. Need safe fallback.',
            ],
            [
              'Bag rules mismatch',
              'Allowance, weight, dangerous goods, or airport capability differs by channel.',
            ],
            [
              'PII in logs',
              'Passenger/document/payment data leaks into debugging surfaces. Stop and remediate.',
            ],
            [
              'Disruption changes reality',
              'Delay, cancellation, re-accommodation, gate, or aircraft changes invalidate assumptions.',
            ],
            [
              'Airport handoff fails',
              'Bag drop, scanner, gate, or common-use surface cannot consume the state web created.',
            ],
          ].map(([title, body]) => (
            <article key={title}>
              <AlertTriangle size={18} />
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pedia-section">
        <h3>Learning Quests</h3>
        <div className="deep-list pedia-quests">
          {[
            'Ask which systems are the source of truth for booking, ticket, seat, bag, boarding pass, and check-in status.',
            'Trace one real passenger from booking lookup through boarding pass issuance in logs or a demo environment.',
            'Collect 20 real VA acronyms from meetings and map each to this glossary or mark it as unknown.',
            'Find every place the web app crosses from "read only" into "commit side effect" territory.',
            'Ask airport ops or support what failure creates the most passenger anxiety during check-in.',
            'Build a one-page PSS/DCS/common-use boundary diagram with verified system owners.',
          ].map((item) => (
            <label key={item}>
              <Check size={16} /> {item}
            </label>
          ))}
        </div>
      </section>

      <section className="pedia-section source-section">
        <h3>Public References</h3>
        <p className="pedia-note">
          Use these for industry language. Use VA docs, architecture, incidents,
          and team demos for implementation truth.
        </p>
        <div className="source-list">
          {pediaSources.map(([label, href]) => (
            <a href={href} target="_blank" rel="noreferrer" key={href}>
              {label}
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}

// ==========================================
// 9. Team Trust Tab
// ==========================================

function TeamTrust({
  logs,
  orgOwners,
  setOrgOwners,
  interpersonalLinks,
  setInterpersonalLinks,
  ownerQuestions,
  setOwnerQuestions,
  setDraft,
  setActive,
}: any) {
  const emptyDraft = {
    name: '',
    nickname: '',
    role: '',
    group: 'Product',
    owns: '',
    reportsTo: '',
    traits: '',
    notes: '',
  };

  const emptyLinkDraft = {
    from: orgOwners[0]?.id || '',
    to: orgOwners[1]?.id || '',
    type: 'Trusts',
    temperature: 'Warm',
    strength: 'Medium',
    notes: '',
  };

  const [draft, setOwnerDraft] = useState(emptyDraft);
  const [linkDraft, setLinkDraft] = useState(emptyLinkDraft);
  const [selectedId, setSelectedId] = useState(orgOwners[0]?.id || '');
  const selected =
    orgOwners.find((person: any) => person.id === selectedId) || orgOwners[0];
  const groups = [
    ...new Set(orgOwners.map((person: any) => person.group || 'Unmapped')),
  ];
  const children = selected
    ? orgOwners.filter((person: any) => person.reportsTo === selected.id)
    : [];
  const relatedLinks = selected
    ? interpersonalLinks.filter(
        (link: any) => link.from === selected.id || link.to === selected.id
      )
    : [];

  function addOwner() {
    if (!draft.name.trim() && !draft.owns.trim()) return;
    const id = generateId();
    const person = {
      id,
      name: draft.name.trim() || 'Unknown owner',
      nickname: draft.nickname.trim(),
      role: draft.role.trim() || 'Role unknown',
      group: draft.group.trim() || 'Unmapped',
      owns: draft.owns.trim() || 'Ownership to verify',
      reportsTo: draft.reportsTo,
      traits: draft.traits.trim(),
      notes: draft.notes.trim(),
    };
    setOrgOwners((current: any) => [...current, person]);
    setSelectedId(id);
    setOwnerDraft(emptyDraft);
  }

  function updateOwner(id: string, patch: any) {
    setOrgOwners((current: any) =>
      current.map((person: any) =>
        person.id === id ? { ...person, ...patch } : person
      )
    );
  }

  function deleteOwner(id: string) {
    setOrgOwners((current: any) =>
      current
        .filter((person: any) => person.id !== id)
        .map((person: any) =>
          person.reportsTo === id ? { ...person, reportsTo: '' } : person
        )
    );
    setSelectedId(orgOwners.find((person: any) => person.id !== id)?.id || '');
  }

  function personName(id: string) {
    return orgOwners.find((person: any) => person.id === id)?.name || 'Unknown';
  }

  function addLink() {
    if (!linkDraft.from || !linkDraft.to || linkDraft.from === linkDraft.to)
      return;
    setInterpersonalLinks((current: any) => [
      {
        id: generateId(),
        ...linkDraft,
        notes: linkDraft.notes.trim(),
      },
      ...current,
    ]);
    setLinkDraft({
      ...emptyLinkDraft,
      from: linkDraft.from,
      to: linkDraft.to,
      notes: '',
    });
  }

  function deleteLink(id: string) {
    setInterpersonalLinks((current: any) =>
      current.filter((link: any) => link.id !== id)
    );
  }

  return (
    <section className="panel full-panel team-trust">
      <PanelTitle
        icon={Users}
        title="Team Trust"
        meta={`${orgOwners.length} mapped people / owners`}
      />
      <div className="ownership-hero">
        <div>
          <span className="section-label">Living org chart</span>
          <strong>
            Map who owns what, how they connect, and how to work with them.
          </strong>
          <p>
            Start rough. Replace placeholders with real names, reporting lines,
            traits, nicknames, and domain ownership as you learn the
            organization.
          </p>
        </div>
        <div className="evidence-chip">
          Recent evidence captured: <strong>{logs.length}</strong> notes
        </div>
      </div>

      <div className="owner-workbench">
        <section className="owner-form">
          <h3>Add owner</h3>
          <div className="owner-form-grid">
            <input
              value={draft.name}
              onChange={(event) =>
                setOwnerDraft({ ...draft, name: event.target.value })
              }
              placeholder="Name"
              aria-label="Owner name"
            />
            <input
              value={draft.nickname}
              onChange={(event) =>
                setOwnerDraft({ ...draft, nickname: event.target.value })
              }
              placeholder="Nickname"
              aria-label="Owner nickname"
            />
            <input
              value={draft.role}
              onChange={(event) =>
                setOwnerDraft({ ...draft, role: event.target.value })
              }
              placeholder="Role / title"
              aria-label="Owner role"
            />
            <input
              value={draft.group}
              onChange={(event) =>
                setOwnerDraft({ ...draft, group: event.target.value })
              }
              placeholder="Org group"
              aria-label="Owner group"
            />
            <select
              value={draft.reportsTo}
              onChange={(event) =>
                setOwnerDraft({ ...draft, reportsTo: event.target.value })
              }
              aria-label="Reports to"
            >
              <option value="">Reports to: unknown / top level</option>
              {orgOwners.map((person: any) => (
                <option value={person.id} key={person.id}>
                  {person.name} - {person.role}
                </option>
              ))}
            </select>
            <input
              value={draft.owns}
              onChange={(event) =>
                setOwnerDraft({ ...draft, owns: event.target.value })
              }
              placeholder="Owns: check-in API, product scope, TCS delivery..."
              aria-label="Ownership area"
            />
            <textarea
              value={draft.traits}
              onChange={(event) =>
                setOwnerDraft({ ...draft, traits: event.target.value })
              }
              placeholder="Traits: direct, anxious, detail-heavy, needs evidence..."
              aria-label="Traits"
            />
            <textarea
              value={draft.notes}
              onChange={(event) =>
                setOwnerDraft({ ...draft, notes: event.target.value })
              }
              placeholder="Notes: pressure, preferred communication, what builds trust..."
              aria-label="Owner notes"
            />
          </div>
          <button onClick={addOwner}>
            <Plus size={16} /> Add to org chart
          </button>
        </section>

        <section className="owner-detail">
          <h3>Selected owner</h3>
          {selected ? (
            <>
              <div className="owner-detail-head">
                <div>
                  <strong>{selected.name}</strong>
                  <span>
                    {selected.nickname || 'No nickname yet'} / {selected.role}
                  </span>
                </div>
                <button onClick={() => deleteOwner(selected.id)}>Delete</button>
              </div>
              <label>
                Owns
                <textarea
                  value={selected.owns}
                  onChange={(event) =>
                    updateOwner(selected.id, { owns: event.target.value })
                  }
                />
              </label>
              <label>
                Traits
                <textarea
                  value={selected.traits}
                  onChange={(event) =>
                    updateOwner(selected.id, { traits: event.target.value })
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  value={selected.notes}
                  onChange={(event) =>
                    updateOwner(selected.id, { notes: event.target.value })
                  }
                />
              </label>
              <label>
                Reports to
                <select
                  value={selected.reportsTo}
                  onChange={(event) =>
                    updateOwner(selected.id, { reportsTo: event.target.value })
                  }
                >
                  <option value="">Unknown / top level</option>
                  {orgOwners
                    .filter((person: any) => person.id !== selected.id)
                    .map((person: any) => (
                      <option value={person.id} key={person.id}>
                        {person.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="owner-children">
                <span>Direct reports / downstream owners</span>
                <strong>
                  {children.length
                    ? children.map((person: any) => person.name).join(', ')
                    : 'None mapped yet'}
                </strong>
              </div>
              <div className="owner-children">
                <span>Interpersonal links</span>
                <strong>
                  {relatedLinks.length
                    ? relatedLinks
                        .map(
                          (link: any) =>
                            `${personName(link.from)} -> ${personName(link.to)} (${link.type})`
                        )
                        .join('; ')
                    : 'No informal links mapped yet'}
                </strong>
              </div>
            </>
          ) : (
            <p>No owner selected yet.</p>
          )}
        </section>
      </div>

      <section className="org-chart">
        <h3>Visual ownership chart</h3>
        {groups.map((group: any) => (
          <div className="org-lane" key={group}>
            <h4>{group}</h4>
            <div>
              {orgOwners
                .filter((person: any) => (person.group || 'Unmapped') === group)
                .map((person: any) => {
                  const manager = orgOwners.find(
                    (candidate: any) => candidate.id === person.reportsTo
                  );
                  return (
                    <button
                      className={
                        selected?.id === person.id
                          ? 'owner-card selected'
                          : 'owner-card'
                      }
                      onClick={() => setSelectedId(person.id)}
                      key={person.id}
                    >
                      <span>{person.nickname || person.group}</span>
                      <strong>{person.name}</strong>
                      <small>{person.role}</small>
                      <p>{person.owns}</p>
                      <em>
                        {manager
                          ? `Reports to ${manager.name}`
                          : 'Reporting line unknown/top level'}
                      </em>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      <section className="interpersonal-map">
        <h3>Interpersonal map</h3>
        <p>
          Unofficial influence, trust, tension, alliances, and blockers. This is
          for empathy and navigation, not gossip-as-fact.
        </p>
        <div className="link-form">
          <select
            value={linkDraft.from}
            onChange={(event) =>
              setLinkDraft({ ...linkDraft, from: event.target.value })
            }
            aria-label="Relationship from"
          >
            {orgOwners.map((person: any) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <select
            value={linkDraft.to}
            onChange={(event) =>
              setLinkDraft({ ...linkDraft, to: event.target.value })
            }
            aria-label="Relationship to"
          >
            {orgOwners.map((person: any) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <select
            value={linkDraft.type}
            onChange={(event) =>
              setLinkDraft({ ...linkDraft, type: event.target.value })
            }
            aria-label="Relationship type"
          >
            {[
              'Trusts',
              'Likes',
              'Influences',
              'Needs alignment',
              'Tension',
              'Blocks',
              'Protects',
              'Listens to',
              'Avoids',
            ].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <select
            value={linkDraft.temperature}
            onChange={(event) =>
              setLinkDraft({ ...linkDraft, temperature: event.target.value })
            }
            aria-label="Relationship temperature"
          >
            {['Warm', 'Neutral', 'Unknown', 'Variable', 'Cold'].map(
              (temperature) => (
                <option key={temperature}>{temperature}</option>
              )
            )}
          </select>
          <select
            value={linkDraft.strength}
            onChange={(event) =>
              setLinkDraft({ ...linkDraft, strength: event.target.value })
            }
            aria-label="Relationship strength"
          >
            {['Low', 'Medium', 'High leverage', 'Critical'].map((strength) => (
              <option key={strength}>{strength}</option>
            ))}
          </select>
          <input
            value={linkDraft.notes}
            onChange={(event) =>
              setLinkDraft({ ...linkDraft, notes: event.target.value })
            }
            placeholder="Evidence / note: why you think this link matters"
            aria-label="Relationship note"
          />
          <button onClick={addLink}>
            <Plus size={16} /> Add link
          </button>
        </div>
        <div className="link-list">
          {interpersonalLinks.map((link: any) => (
            <article
              className={`link-card ${link.temperature.toLowerCase().replaceAll(' ', '-')}`}
              key={link.id}
            >
              <div>
                <strong>{personName(link.from)}</strong>
                <ChevronRight size={16} />
                <strong>{personName(link.to)}</strong>
              </div>
              <span>
                {link.type} / {link.temperature} / {link.strength}
              </span>
              {link.notes && <p>{link.notes}</p>}
              <button onClick={() => deleteLink(link.id)}>Delete</button>
            </article>
          ))}
        </div>
      </section>

      <OwnerQuestionBoard
        questions={ownerQuestions}
        setQuestions={setOwnerQuestions}
      />
      <EmpathyPrompts setDraft={setDraft} setActive={setActive} />
    </section>
  );
}

function EmpathyPrompts({
  setDraft,
  setActive,
}: {
  setDraft: any;
  setActive: any;
}) {
  const prompts = [
    ['Person', 'What pressure is this person carrying?'],
    ['Person', "What do they know that I don't?"],
    ['Follow-up', 'How can I make their work easier this week?'],
  ];

  return (
    <section className="empathy">
      <PanelTitle
        icon={HeartHandshake}
        title="Empathy Prompts"
        meta="Useful curiosity"
      />
      <div className="empathy-grid">
        {prompts.map(([type, prompt]) => (
          <button
            key={prompt}
            onClick={() => {
              setDraft({ type, text: prompt });
              setActive('notes');
            }}
          >
            <span>{type}</span>
            <strong>{prompt}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 10. Follow-ups Tab
// ==========================================

function Followups({
  followups,
  setFollowups,
  draft,
  setDraft,
  setNoteDraft,
  setActive,
}: any) {
  function addFollowup() {
    if (!draft.title.trim() && !draft.detail.trim()) return;
    const title = draft.title.trim() || draft.detail.trim().slice(0, 72);
    setFollowups((current: any) => [
      {
        id: generateId(),
        horizon: draft.horizon,
        title,
        detail: draft.detail.trim(),
        source: draft.source.trim() || 'App revision',
        done: false,
      },
      ...current,
    ]);
    setDraft({
      horizon: draft.horizon,
      title: '',
      detail: '',
      source: 'App revision',
    });
  }

  function updateFollowup(id: string, patch: any) {
    setFollowups((current: any) =>
      current.map((item: any) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function deleteFollowup(id: string) {
    setFollowups((current: any) =>
      current.filter((item: any) => item.id !== id)
    );
  }

  function sendToNotes(item: any) {
    setNoteDraft({
      type: 'Follow-up',
      text: `${item.horizon}: ${item.title}${item.detail ? ` - ${item.detail}` : ''}`,
    });
    setActive('notes');
  }

  function nextHorizon(horizon: string) {
    if (horizon === 'Tomorrow') return 'Next Week';
    if (horizon === 'Next Week') return 'Next Month';
    return 'Tomorrow';
  }

  const openCount = followups.filter((item: any) => !item.done).length;

  return (
    <section className="panel full-panel followups-panel">
      <PanelTitle
        icon={ClipboardList}
        title="Follow-ups"
        meta={`${openCount} open mutations`}
      />
      <div className="followup-intro">
        <strong>Keep the app honest.</strong>
        <p>
          Capture what should change tomorrow, next week, or next month as the
          real job reveals itself. This is where generic plans come to die
          politely.
        </p>
      </div>
      <div className="followup-compose">
        <select
          aria-label="Follow-up horizon"
          value={draft.horizon}
          onChange={(event) =>
            setDraft({ ...draft, horizon: event.target.value })
          }
        >
          {followupHorizons.map((horizon) => (
            <option key={horizon}>{horizon}</option>
          ))}
        </select>
        <input
          value={draft.title}
          onChange={(event) =>
            setDraft({ ...draft, title: event.target.value })
          }
          placeholder="Goal, app change, question, or ritual to add"
          aria-label="Follow-up title"
        />
        <input
          value={draft.source}
          onChange={(event) =>
            setDraft({ ...draft, source: event.target.value })
          }
          placeholder="Source"
          aria-label="Follow-up source"
        />
        <textarea
          value={draft.detail}
          onChange={(event) =>
            setDraft({ ...draft, detail: event.target.value })
          }
          placeholder="What changed? What should the app ask you to do differently?"
          aria-label="Follow-up detail"
        />
        <button onClick={addFollowup}>
          <Plus size={16} /> Add mutation
        </button>
      </div>
      <div className="followup-columns">
        {followupHorizons.map((horizon) => {
          const items = followups.filter(
            (item: any) => item.horizon === horizon
          );
          return (
            <section key={horizon}>
              <h3>{horizon}</h3>
              {items.map((item: any) => (
                <article className={item.done ? 'done' : ''} key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        updateFollowup(item.id, { done: !item.done })
                      }
                    />
                    <strong>{item.title}</strong>
                  </label>
                  {item.detail && <p>{item.detail}</p>}
                  <span>{item.source}</span>
                  <div>
                    <button
                      onClick={() =>
                        updateFollowup(item.id, {
                          horizon: nextHorizon(item.horizon),
                        })
                      }
                    >
                      Move later
                    </button>
                    <button onClick={() => sendToNotes(item)}>
                      Draft note
                    </button>
                    <button onClick={() => deleteFollowup(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// 11. September Delivery Tab
// ==========================================

function SeptemberDelivery({
  items,
  setItems,
  settings,
  setSettings,
  today,
  evidenceLinks,
  setEvidenceLinks,
}: any) {
  const emptyDraft = {
    title: '',
    type: 'Requirement',
    priority: 'High',
    status: 'Not started',
    estimateDays: 3,
    resource: '',
    confidence: 60,
    dependency: '',
    impact: '',
    notes: '',
  };
  const [draft, setDraft] = useState(emptyDraft);
  const model = buildDeliveryModel(items, settings, today);

  function addItem() {
    if (!draft.title.trim()) return;
    setItems((current: any) => [
      {
        id: generateId(),
        ...draft,
        title: draft.title.trim(),
        estimateDays: Number(draft.estimateDays || 0),
        confidence: Number(draft.confidence || 50),
      },
      ...current,
    ]);
    setDraft(emptyDraft);
  }

  function updateItem(id: string, patch: any) {
    setItems((current: any) =>
      current.map((item: any) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function deleteItem(id: string) {
    setItems((current: any) => current.filter((item: any) => item.id !== id));
  }

  return (
    <section className="panel full-panel delivery-system">
      <PanelTitle
        icon={CalendarDays}
        title="Delivery Reality Engine"
        meta={`${model.pressure} / forecast ${model.forecastDate}`}
      />
      <div className={`delivery-forecast ${model.pressure.toLowerCase()}`}>
        <div>
          <span className="section-label">Timeline pressure</span>
          <strong>{model.pressure}</strong>
          <p>{model.stakeholderMessage}</p>
        </div>
        <div>
          <span>Forecast</span>
          <strong>{model.forecastDate}</strong>
        </div>
        <div>
          <span>Need</span>
          <strong>{model.weeksNeeded.toFixed(1)}w</strong>
        </div>
        <div>
          <span>Runway</span>
          <strong>{model.runwayWeeks.toFixed(1)}w</strong>
        </div>
      </div>

      <div className="delivery-settings">
        <label>
          Deadline
          <input
            type="date"
            value={settings.deadline}
            onChange={(event) =>
              setSettings((current: any) => ({
                ...current,
                deadline: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Capacity / week
          <input
            type="number"
            min="1"
            value={settings.capacityPerWeek}
            onChange={(event) =>
              setSettings((current: any) => ({
                ...current,
                capacityPerWeek: Number(event.target.value),
              }))
            }
          />
        </label>
        <label>
          Reality buffer %
          <input
            type="number"
            min="0"
            max="80"
            value={settings.bufferPercent}
            onChange={(event) =>
              setSettings((current: any) => ({
                ...current,
                bufferPercent: Number(event.target.value),
              }))
            }
          />
        </label>
      </div>

      <div className="delivery-grid">
        {[
          [
            'Raw work',
            `${model.rawDays.toFixed(1)}d`,
            'Original estimates before reality adjustment.',
          ],
          [
            'Adjusted work',
            `${model.adjustedDays.toFixed(1)}d`,
            'Priority, confidence, blockers, and risk multipliers applied.',
          ],
          [
            'Buffer',
            `${model.bufferDays.toFixed(1)}d`,
            'Explicit uncertainty reserve.',
          ],
          [
            'Blockers',
            model.blockers.length,
            'Items that need escalation, decision, or unblocking.',
          ],
        ].map(([label, value, body]: any) => (
          <article key={label}>
            <span>{label}</span>
            <h3>{value}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <section className="timeline-lab">
        <h3>Add signal / requirement / blocker</h3>
        <div className="timeline-form">
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            placeholder="Requirement, blocker, signal, or scope shift"
            aria-label="Delivery item title"
          />
          <select
            value={draft.type}
            onChange={(event) =>
              setDraft({ ...draft, type: event.target.value })
            }
            aria-label="Delivery item type"
          >
            {['Requirement', 'Feature', 'Risk', 'Blocker', 'Signal'].map(
              (item) => (
                <option key={item}>{item}</option>
              )
            )}
          </select>
          <select
            value={draft.priority}
            onChange={(event) =>
              setDraft({ ...draft, priority: event.target.value })
            }
            aria-label="Priority"
          >
            {['Critical', 'High', 'Medium', 'Low'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value })
            }
            aria-label="Status"
          >
            {['Unknown', 'Not started', 'In progress', 'Blocked', 'Done'].map(
              (item) => (
                <option key={item}>{item}</option>
              )
            )}
          </select>
          <input
            type="number"
            min="0"
            value={draft.estimateDays}
            onChange={(event) =>
              setDraft({ ...draft, estimateDays: Number(event.target.value) })
            }
            aria-label="Estimate days"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={draft.confidence}
            onChange={(event) =>
              setDraft({ ...draft, confidence: Number(event.target.value) })
            }
            aria-label="Confidence percent"
          />
          <input
            value={draft.resource}
            onChange={(event) =>
              setDraft({ ...draft, resource: event.target.value })
            }
            placeholder="Resources / owners"
            aria-label="Resources"
          />
          <input
            value={draft.dependency}
            onChange={(event) =>
              setDraft({ ...draft, dependency: event.target.value })
            }
            placeholder="Dependencies / affects"
            aria-label="Dependencies"
          />
          <textarea
            value={draft.impact}
            onChange={(event) =>
              setDraft({ ...draft, impact: event.target.value })
            }
            placeholder="How this affects timeline, quality, scope, or stakeholder confidence"
            aria-label="Impact"
          />
          <textarea
            value={draft.notes}
            onChange={(event) =>
              setDraft({ ...draft, notes: event.target.value })
            }
            placeholder="Evidence, signal source, blocker detail, communication nuance"
            aria-label="Delivery notes"
          />
          <button onClick={addItem}>
            <Plus size={16} /> Add to model
          </button>
        </div>
      </section>

      <section className="delivery-impact">
        <h3>Priority collision view</h3>
        <div className="impact-columns">
          <article>
            <span>Top timeline drivers</span>
            {model.topDrivers.map((item) => (
              <p key={item.id}>
                <strong>{item.title}</strong> adds{' '}
                {item.adjustedDays.toFixed(1)} adjusted days
              </p>
            ))}
          </article>
          <article>
            <span>Likely displaced / at risk</span>
            {model.displaced.length ? (
              model.displaced.map((item) => (
                <p key={item.id}>
                  {item.title} ({item.priority}, {item.status})
                </p>
              ))
            ) : (
              <p>No obvious displacement yet.</p>
            )}
          </article>
          <article>
            <span>Stakeholder wording</span>
            <p>{model.stakeholderMessage}</p>
          </article>
        </div>
      </section>

      <section className="delivery-board">
        <h3>Timeline model</h3>
        <div className="delivery-items">
          {items.map((item: any) => {
            const modeled = model.modeled.find((entry) => entry.id === item.id);
            return (
              <article
                className={`delivery-item ${item.priority.toLowerCase()} ${item.status.toLowerCase().replaceAll(' ', '-')}`}
                key={item.id}
              >
                <div>
                  <span>
                    {item.type} / {item.priority} / {item.status}
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.impact || 'No impact statement yet.'}</p>
                  <small>
                    Resource: {item.resource || 'Unknown'} / Depends on:{' '}
                    {item.dependency || 'Unknown'} / Confidence:{' '}
                    {item.confidence}%
                  </small>
                </div>
                <div className="delivery-item-controls">
                  <strong>
                    {modeled ? `${modeled.adjustedDays.toFixed(1)}d` : 'Done'}
                  </strong>
                  <select
                    value={item.priority}
                    onChange={(event) =>
                      updateItem(item.id, { priority: event.target.value })
                    }
                    aria-label={`${item.title} priority`}
                  >
                    {['Critical', 'High', 'Medium', 'Low'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      updateItem(item.id, { status: event.target.value })
                    }
                    aria-label={`${item.title} status`}
                  >
                    {[
                      'Unknown',
                      'Not started',
                      'In progress',
                      'Blocked',
                      'Done',
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteItem(item.id)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <EvidenceLinksEditor links={evidenceLinks} setLinks={setEvidenceLinks} />
    </section>
  );
}

// ==========================================
// 12. Graduation Quiz Tab
// ==========================================

function GraduationQuiz({
  answers,
  setAnswers,
  today,
  logs,
  followups,
  orgOwners,
  interpersonalLinks,
  deliveryItems,
  deliverySettings,
}: any) {
  const dailyQuestions = useMemo(
    () =>
      buildDailyQuiz({
        today,
        logs,
        followups,
        orgOwners,
        interpersonalLinks,
        deliveryItems,
        deliverySettings,
      }),
    [
      today,
      logs,
      followups,
      orgOwners,
      interpersonalLinks,
      deliveryItems,
      deliverySettings,
    ]
  );

  const answerKey = (index: number) => `${today}-${index}`;
  const answered = dailyQuestions.filter(
    (_, index) => answers[answerKey(index)] !== undefined
  ).length;
  const correct = dailyQuestions.filter(
    (question, index) => Number(answers[answerKey(index)]) === question.answer
  ).length;
  const score =
    answered === dailyQuestions.length
      ? Math.round((correct / dailyQuestions.length) * 100)
      : 0;
  const categories = [
    ...new Set(dailyQuestions.map((question) => question.category)),
  ];

  function resetToday() {
    setAnswers((current: any) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`${today}-`))
      )
    );
  }

  return (
    <section className="panel full-panel">
      <PanelTitle
        icon={Brain}
        title="Daily Absorption Quiz"
        meta={
          answered === dailyQuestions.length
            ? `${score}% scored today`
            : `${answered} / ${dailyQuestions.length} answered today`
        }
      />
      <div className="quiz-summary">
        <strong>
          {answered === dailyQuestions.length && score >= 80
            ? 'You are absorbing the system.'
            : "This is today's retrieval practice across the whole job surface."}
        </strong>
        <p>
          Generated from the app: domain terms, org owners, interpersonal links,
          delivery signals, notes, follow-ups, and core technical-lead
          instincts. Add better inputs during the day and tomorrow\'s quiz gets
          sharper.
        </p>
        <div className="quiz-sources">
          {categories.map((category: any) => (
            <span key={category}>{category}</span>
          ))}
        </div>
        <button onClick={resetToday}>Retake today</button>
      </div>
      <div className="quiz-list">
        {dailyQuestions.map((question, index) => {
          const key = answerKey(index);
          return (
            <article
              key={`${today}-${question.prompt}`}
              className={answers[key] !== undefined ? 'answered' : ''}
            >
              <span className="quiz-category">{question.category}</span>
              <h3>
                {index + 1}. {question.prompt}
              </h3>
              <div>
                {question.options.map((option: string, optionIndex: number) => {
                  const selected = Number(answers[key]) === optionIndex;
                  const revealed = answers[key] !== undefined;
                  const correctOption = optionIndex === question.answer;
                  return (
                    <button
                      key={option}
                      className={
                        selected
                          ? correctOption
                            ? 'correct selected'
                            : 'incorrect selected'
                          : revealed && correctOption
                            ? 'correct'
                            : ''
                      }
                      onClick={() =>
                        setAnswers((current: any) => ({
                          ...current,
                          [key]: optionIndex,
                        }))
                      }
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// 12b. DCS Simulator & Resilience Sandbox Tab
// ==========================================

function DcsSimPanel({ setDraft, setActive }: any) {
  const initialBookings = [
    {
      pnr: 'VA123A',
      name: 'John Doe',
      flight: 'VA123 SYD-BNE',
      status: 'Ready',
      docs: 'APIS Checked',
      bags: 'Paid',
      seat: '12C',
      checkedIn: false,
      bpIssued: false,
    },
    {
      pnr: 'VA456B',
      name: 'Xiao Chen',
      flight: 'VA456 BNE-LAX',
      status: 'Blocked',
      docs: 'Missing Passport',
      bags: 'Paid',
      seat: '22D',
      checkedIn: false,
      bpIssued: false,
    },
    {
      pnr: 'VA789C',
      name: 'Sarah Jenkins',
      flight: 'VA789 MEL-SYD',
      status: 'Blocked',
      docs: 'APIS Checked',
      bags: 'Unpaid (1 Bag - $40)',
      seat: '15A',
      checkedIn: false,
      bpIssued: false,
    },
    {
      pnr: 'VA303D',
      name: 'Bruce Wayne',
      flight: 'VA303 SYD-MEL',
      status: 'Void',
      docs: 'APIS Checked',
      bags: 'Paid',
      seat: '01A',
      checkedIn: false,
      bpIssued: false,
    },
    {
      pnr: 'VA999E',
      name: 'Diana Prince',
      flight: 'VA999 BNE-SYD',
      status: 'Seat Req',
      docs: 'APIS Checked',
      bags: 'Paid',
      seat: 'UNASSIGNED',
      checkedIn: false,
      bpIssued: false,
    },
  ];

  const [bookings, setBookings] = useState(initialBookings);
  const [selectedScenario, setSelectedScenario] = useState('VA123A');
  const [commandInput, setCommandInput] = useState('');

  const [consoleHistory, setConsoleHistory] = useState<
    Array<{
      type: 'input' | 'output' | 'error' | 'success' | 'warn';
      text: string;
    }>
  >([
    {
      type: 'output',
      text: '============================================================',
    },
    {
      type: 'output',
      text: '       DEPARTURE CONTROL SYSTEM (DCS) COMMAND TERMINAL',
    },
    { type: 'output', text: '                  VIRGIN AUSTRALIA V1.42' },
    {
      type: 'output',
      text: '============================================================',
    },
    { type: 'success', text: 'System: READY | Active Node: BNE-HQ' },
    { type: 'success', text: 'Connected to Amadeus Altéa PSS (Primary Node)' },
    {
      type: 'output',
      text: "\nType 'help' to list available commands and PNR records.",
    },
    {
      type: 'output',
      text: '------------------------------------------------------------',
    },
  ]);

  // Sandbox State
  const [latency, setLatency] = useState(3000);
  const [timeoutLimit, setTimeoutLimit] = useState(1500);
  const [retries, setRetries] = useState(1);
  const [circuitBreakerEnabled, setCircuitBreakerEnabled] = useState(true);
  const [fallbackStrategy, setFallbackStrategy] = useState('cache-last-known');

  // Runtime metrics / state
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [cbState, setCbState] = useState<'CLOSED' | 'OPEN' | 'HALF-OPEN'>(
    'CLOSED'
  );
  const [uptime, setUptime] = useState(99.8);
  const [errorRate, setErrorRate] = useState(0);
  const [avgLatency, setAvgLatency] = useState(240);

  const [isSimulating, setIsSimulating] = useState(false);
  const [activeNode, setActiveNode] = useState<
    null | 'client' | 'proxy' | 'backend' | 'PSS'
  >(null);
  const [nodeStatus, setNodeStatus] = useState<
    Record<string, 'active' | 'success' | 'failure' | ''>
  >({
    client: '',
    proxy: '',
    backend: '',
    PSS: '',
  });

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleHistory]);

  // Helper sleep function
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const appendToConsole = (
    type: 'input' | 'output' | 'error' | 'success' | 'warn',
    text: string
  ) => {
    setConsoleHistory((prev) => [...prev, { type, text }]);
  };

  const handleCommand = async (cmdString: string) => {
    if (isSimulating) return;
    const trimmed = cmdString.trim();
    if (!trimmed) return;

    setCommandInput('');
    appendToConsole('input', `> ${trimmed}`);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (command === 'clear') {
      setConsoleHistory([]);
      return;
    }

    if (command === 'help') {
      appendToConsole('output', 'Available Commands:');
      appendToConsole(
        'output',
        '  lookup <PNR>            - Query passenger record by PNR code'
      );
      appendToConsole(
        'output',
        '  adddocs <PassportNo>    - Enter APIS passport details for passenger'
      );
      appendToConsole(
        'output',
        '  pay                     - Settle outstanding baggage fees / EMD'
      );
      appendToConsole(
        'output',
        '  seatmap                 - Retrieve seatmap and assign seat (API-intensive)'
      );
      appendToConsole(
        'output',
        '  checkin                 - Perform passenger check-in'
      );
      appendToConsole(
        'output',
        '  issuebp                 - Print boarding pass (requires checked-in status)'
      );
      appendToConsole(
        'output',
        '  clear                   - Clear screen history'
      );
      appendToConsole('output', '\nSimulated Passengers:');
      appendToConsole(
        'output',
        '  VA123A - John Doe (Happy path, ready to check in)'
      );
      appendToConsole(
        'output',
        '  VA456B - Xiao Chen (Missing APIS passport details)'
      );
      appendToConsole(
        'output',
        '  VA789C - Sarah Jenkins (Unpaid baggage fees)'
      );
      appendToConsole(
        'output',
        '  VA303D - Bruce Wayne (Void ticket - reconciliation block)'
      );
      appendToConsole(
        'output',
        '  VA999E - Diana Prince (Seat unassigned - triggers seatmap API)'
      );
      return;
    }

    setIsSimulating(true);

    // Start request flow animation
    setActiveNode('client');
    setNodeStatus({ client: 'active', proxy: '', backend: '', PSS: '' });
    await sleep(250);

    setActiveNode('proxy');
    setNodeStatus((prev) => ({ ...prev, client: 'success', proxy: 'active' }));
    await sleep(250);

    setActiveNode('backend');
    setNodeStatus((prev) => ({ ...prev, proxy: 'success', backend: 'active' }));
    await sleep(250);

    setActiveNode('PSS');
    setNodeStatus((prev) => ({ ...prev, backend: 'success', PSS: 'active' }));

    // Core logic per command
    const currentBooking = bookings.find((b) => b.pnr === selectedScenario);

    if (command === 'lookup') {
      const pnrToFind = arg.toUpperCase() || selectedScenario;
      const found = bookings.find((b) => b.pnr === pnrToFind);
      await sleep(400); // Simulate database lookup latency

      if (!found) {
        appendToConsole(
          'error',
          `ERROR: RECORD NOT FOUND FOR PNR '${pnrToFind}'`
        );
        appendToConsole(
          'output',
          'VALID PNRS: VA123A, VA456B, VA789C, VA303D, VA999E'
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else {
        setSelectedScenario(found.pnr);
        appendToConsole('output', `PNR RECORD: ${found.pnr}`);
        appendToConsole(
          'output',
          '------------------------------------------------------------'
        );
        appendToConsole('output', `PASSENGER: ${found.name.toUpperCase()} MR`);
        appendToConsole('output', `FLIGHT:    ${found.flight} | 26 MAY`);
        appendToConsole(
          'output',
          `STATUS:    ${found.status === 'Ready' ? 'READY TO CHECK-IN' : found.status.toUpperCase()}`
        );
        appendToConsole('output', `APIS DOCS: ${found.docs.toUpperCase()}`);
        appendToConsole('output', `BAG FEE:   ${found.bags.toUpperCase()}`);
        appendToConsole('output', `SEAT:      ${found.seat}`);
        appendToConsole(
          'output',
          `TICKET:    ${found.pnr === 'VA303D' ? 'VOID (RECONCILIATION FAILURE - CONTACT TICKETING)' : 'VALID (079-2456789123)'}`
        );
        appendToConsole(
          'output',
          `CHECK-IN:  [${found.checkedIn ? 'CHECKED IN' : 'NOT CHECKED IN'}]`
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
      }
    } else if (command === 'adddocs') {
      if (!currentBooking) {
        appendToConsole(
          'error',
          "ERROR: NO PASSENGER RECORD ACTIVE. RUN 'lookup <PNR>' FIRST."
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else {
        const passport = arg || 'L1234567';
        await sleep(500); // API update delay

        setBookings((prev) =>
          prev.map((b) => {
            if (b.pnr === currentBooking!.pnr) {
              const nextStatus =
                b.bags === 'Paid' && b.seat !== 'UNASSIGNED'
                  ? 'Ready'
                  : b.status;
              return {
                ...b,
                docs: `Verified (Passport: ${passport.toUpperCase()})`,
                status: nextStatus,
              };
            }
            return b;
          })
        );

        appendToConsole(
          'success',
          `APIS UPDATE: PASSPORT INFO RECORDED (PASSPORT: ${passport.toUpperCase()})`
        );
        appendToConsole(
          'output',
          'SECURE DATA TRANSMITTED TO APIS GATEWAY... VERIFIED.'
        );
        appendToConsole(
          'success',
          'STATUS: DOCUMENT VERIFICATION SUCCESSFUL. PASSENGER CLEARED.'
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
      }
    } else if (command === 'pay') {
      if (!currentBooking) {
        appendToConsole(
          'error',
          "ERROR: NO PASSENGER RECORD ACTIVE. RUN 'lookup <PNR>' FIRST."
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else if (!currentBooking.bags.includes('Unpaid')) {
        appendToConsole(
          'warn',
          'WARNING: NO OUTSTANDING BALANCE DETECTED ON THIS PNR.'
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
      } else {
        await sleep(600); // Gateway transaction delay

        setBookings((prev) =>
          prev.map((b) => {
            if (b.pnr === currentBooking!.pnr) {
              const nextStatus =
                b.docs.includes('Verified') && b.seat !== 'UNASSIGNED'
                  ? 'Ready'
                  : b.status;
              return { ...b, bags: 'Paid', status: nextStatus };
            }
            return b;
          })
        );

        appendToConsole('success', 'PROCESSING BAG PAYMENT: $40.00 AUD...');
        appendToConsole('output', 'EMD-S CREATED: 079-9988776655');
        appendToConsole('output', 'TRANSACTION CHARGED TO CREDIT CARD ON PNR.');
        appendToConsole(
          'success',
          'BAG STATUS: PAID & SETTLED. PASSENGER CLEARED.'
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
      }
    } else if (command === 'seatmap') {
      if (!currentBooking) {
        appendToConsole(
          'error',
          "ERROR: NO PASSENGER RECORD ACTIVE. RUN 'lookup <PNR>' FIRST."
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else {
        // Seatmap command simulates resilience sandbox parameters
        appendToConsole(
          'output',
          `CONTACTING SEATMAP SERVICE (URL: /api/v1/flights/VA999/seatmap)...`
        );

        let success = false;
        let circuitTripped = false;

        // Check if circuit breaker is already OPEN
        if (circuitBreakerEnabled && cbState === 'OPEN') {
          circuitTripped = true;
          appendToConsole(
            'error',
            'CIRCUIT BREAKER: [OPEN] state. Instantly short-circuiting downstream request!'
          );
        } else {
          // Simulate latency
          let currentAttempt = 0;
          const maxAttempts = retries + 1;

          while (currentAttempt < maxAttempts) {
            if (currentAttempt > 0) {
              appendToConsole(
                'warn',
                `APOLLO RETRYLINK: Attempt ${currentAttempt} of ${retries} retrying in progress...`
              );
              // Flash active state on nodes to simulate retry
              setNodeStatus((prev) => ({
                ...prev,
                proxy: 'active',
                PSS: 'active',
              }));
              await sleep(200);
            }

            appendToConsole(
              'output',
              `Request sent. Simulated downstream latency: ${latency}ms (Timeout threshold: ${timeoutLimit}ms)`
            );
            await sleep(Math.min(latency, timeoutLimit) / 3); // UI scaled wait

            if (latency > timeoutLimit) {
              appendToConsole(
                'error',
                `TIMEOUT: Connection exceeded ${timeoutLimit}ms limit on PSS seatmap endpoint.`
              );
              currentAttempt++;
            } else {
              success = true;
              break;
            }
          }
        }

        if (success) {
          // Succeeded!
          setConsecutiveFailures(0);
          if (cbState === 'HALF-OPEN') {
            setCbState('CLOSED');
            appendToConsole(
              'success',
              'CIRCUIT BREAKER: Successfully closed circuit breaker after happy path response.'
            );
          }

          setBookings((prev) =>
            prev.map((b) => {
              if (b.pnr === currentBooking!.pnr) {
                const nextStatus =
                  b.docs.includes('Verified') && b.bags === 'Paid'
                    ? 'Ready'
                    : b.status;
                return { ...b, seat: '14A', status: nextStatus };
              }
              return b;
            })
          );

          appendToConsole(
            'success',
            `SEATMAP RETRIEVED SUCCESSFULLY (RESPONSE TIME: ${latency}ms)`
          );
          appendToConsole(
            'output',
            'AVAILABLE SEATS IN ECONOMY CABIN:\n  12A [X]  12B [X]  12C [ ]  12D [X]\n  14A [ ]  14B [X]  14C [ ]  14D [ ]\n  15A [ ]  15B [ ]  15C [ ]  15D [ ]'
          );
          appendToConsole('success', 'ASSIGNING PREFERRED WINDOW SEAT: 14A...');
          appendToConsole(
            'success',
            'SEAT ASSIGNED SUCCESSFULLY. PNR RECORD UPDATED.'
          );
          setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));

          // Metrics adjustments
          setAvgLatency((prev) => Math.round((prev * 4 + latency) / 5));
          setErrorRate((prev) => Math.max(0, Math.round(prev * 0.8)));
        } else {
          // Failed or Short-circuited!
          setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));

          // Increment failures if actually hit the PSS
          if (!circuitTripped) {
            setConsecutiveFailures((prev) => {
              const next = prev + 1;
              if (circuitBreakerEnabled && next >= 3) {
                setCbState('OPEN');
                appendToConsole(
                  'error',
                  'CRITICAL CIRCUIT BREAKER TRIPPED: Consecutive failures >= 3. State is now OPEN.'
                );
              }
              return next;
            });
          }

          // Fallback resolutions
          if (fallbackStrategy === 'fail-hard') {
            appendToConsole(
              'error',
              'HTTP 503 SERVICE UNAVAILABLE: Hard-failure returned. Check-in seat allocation failed.'
            );
            setErrorRate((prev) => Math.min(100, Math.round(prev * 0.8 + 20)));
          } else if (fallbackStrategy === 'cache-last-known') {
            appendToConsole(
              'warn',
              'RESILIENCE BYPASS: Activating Next.js Apollo local cache fallback...'
            );

            setBookings((prev) =>
              prev.map((b) => {
                if (b.pnr === currentBooking!.pnr) {
                  const nextStatus =
                    b.docs.includes('Verified') && b.bags === 'Paid'
                      ? 'Ready'
                      : b.status;
                  return { ...b, seat: '12A (Cached)', status: nextStatus };
                }
                return b;
              })
            );

            appendToConsole(
              'success',
              'SEAT ASSIGNED: 12A (SERVED FROM RESILIENT CACHE)'
            );
            setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
            setAvgLatency((prev) => Math.round((prev * 4 + 80) / 5)); // Instant cache response
          } else if (fallbackStrategy === 'random-assign') {
            appendToConsole(
              'warn',
              'RESILIENCE BYPASS: Activating downstream auto-assign fallback algorithm...'
            );

            setBookings((prev) =>
              prev.map((b) => {
                if (b.pnr === currentBooking!.pnr) {
                  const nextStatus =
                    b.docs.includes('Verified') && b.bags === 'Paid'
                      ? 'Ready'
                      : b.status;
                  return { ...b, seat: '29C', status: nextStatus };
                }
                return b;
              })
            );

            appendToConsole(
              'success',
              'SEAT ASSIGNED: 29C (RANDOM AUTO-ALLOCATION COMPLETE)'
            );
            setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
            setAvgLatency((prev) => Math.round((prev * 4 + 150) / 5));
          }
        }
      }
    } else if (command === 'checkin') {
      if (!currentBooking) {
        appendToConsole(
          'error',
          "ERROR: NO PASSENGER RECORD ACTIVE. RUN 'lookup <PNR>' FIRST."
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else {
        await sleep(500); // Checkin transmission delay

        if (currentBooking.pnr === 'VA303D') {
          appendToConsole(
            'error',
            'ERROR: CHECK-IN REJECTED. TICKET STATUS: VOID.'
          );
          appendToConsole(
            'error',
            'REASON: RECONCILIATION FAILURE (POSSIBLE CANCELLATION OR REFUND).'
          );
          appendToConsole(
            'warn',
            'ACTION: CONTACT TICKETING DESK IMMEDIATELY FOR MANUAL RE-ASSOCIATION.'
          );
          setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
        } else if (currentBooking.docs.includes('Missing')) {
          appendToConsole('error', 'ERROR: CHECK-IN REJECTED.');
          appendToConsole(
            'error',
            'REASON: APIS REGULATORY BLOCK (PASSPORT DOCUMENTS REQUIRED).'
          );
          appendToConsole(
            'warn',
            "ACTION: RUN 'adddocs <PassportNo>' TO CLEAR APIS RECORD."
          );
          setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
        } else if (currentBooking.bags.includes('Unpaid')) {
          appendToConsole('error', 'ERROR: CHECK-IN REJECTED.');
          appendToConsole(
            'error',
            'REASON: OUTSTANDING FINANCIAL BALANCE ON PNR ($40 BAG FEE).'
          );
          appendToConsole(
            'warn',
            "ACTION: RUN 'pay' TO PROCESS FEE SETTLEMENT."
          );
          setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
        } else if (currentBooking.seat === 'UNASSIGNED') {
          appendToConsole('error', 'ERROR: CHECK-IN REJECTED.');
          appendToConsole(
            'error',
            'REASON: NO SEAT ASSIGNED. SEAT REGISTRATION REQUIRED.'
          );
          appendToConsole(
            'warn',
            "ACTION: RUN 'seatmap' TO ENGAGE DOWNSTREAM ALLOCATION."
          );
          setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
        } else {
          setBookings((prev) =>
            prev.map((b) => {
              if (b.pnr === currentBooking!.pnr) {
                return { ...b, checkedIn: true };
              }
              return b;
            })
          );

          appendToConsole(
            'success',
            `COMMENCING CHECK-IN PROCESS FOR PNR ${currentBooking.pnr}...`
          );
          appendToConsole(
            'output',
            'VALIDATING TICKET RECONCILIATION STATUS: OK'
          );
          appendToConsole(
            'output',
            'TRANSMITTING FLIGHT MANIFEST TO SECURITY DESK: OK'
          );
          appendToConsole(
            'success',
            'CHECK-IN REGISTERED IN AMADEUS ALTÉA DCS.'
          );
          appendToConsole('success', 'STATUS: CHECKED-IN SUCCESSFULLY.');
          appendToConsole(
            'success',
            "HINT: RUN 'issuebp' TO GENERATE BOARDING CARD."
          );
          setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
        }
      }
    } else if (command === 'issuebp') {
      if (!currentBooking) {
        appendToConsole(
          'error',
          "ERROR: NO PASSENGER RECORD ACTIVE. RUN 'lookup <PNR>' FIRST."
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else if (!currentBooking.checkedIn) {
        appendToConsole(
          'error',
          'ERROR: CANNOT ISSUE BOARDING PASS. PASSENGER IS NOT CHECKED IN.'
        );
        appendToConsole(
          'warn',
          "ACTION: RUN 'checkin' TO RECORD BOARDING SIGNAL FIRST."
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
      } else {
        await sleep(500); // Printing delays

        setBookings((prev) =>
          prev.map((b) => {
            if (b.pnr === currentBooking!.pnr) {
              return { ...b, bpIssued: true };
            }
            return b;
          })
        );

        appendToConsole(
          'success',
          'ENCRYPTING DIGITAL SIGNATURE AND COMPILING BARCODE...'
        );
        appendToConsole(
          'output',
          '+-------------------------------------------------------+'
        );
        appendToConsole(
          'output',
          '|                  VIRGIN AUSTRALIA                     |'
        );
        appendToConsole(
          'output',
          '|                   BOARDING PASS                       |'
        );
        appendToConsole(
          'output',
          '+-------------------------------------------------------+'
        );
        appendToConsole(
          'output',
          `| PASSENGER:   ${currentBooking.name.toUpperCase()} MR            CLASS: ECONOMY    |`
        );
        appendToConsole(
          'output',
          `| FLIGHT:      ${currentBooking.flight.toUpperCase()}          DATE:  26 MAY     |`
        );
        appendToConsole(
          'output',
          `| BOARDING:    08:15 AM               SEAT:  ${currentBooking.seat.padEnd(10)} |`
        );
        appendToConsole(
          'output',
          '| GATE:        32                     ZONE:  3          |'
        );
        appendToConsole(
          'output',
          '|                                                       |'
        );
        appendToConsole(
          'output',
          `| PNR:         ${currentBooking.pnr.padEnd(22)} SEQ:   042        |`
        );
        appendToConsole(
          'output',
          '| [||| | |||| | ||||| | ||||| | ||||| | ||||| | ||]      |'
        );
        appendToConsole(
          'output',
          '+-------------------------------------------------------+'
        );
        appendToConsole(
          'success',
          'BOARDING PASS PRINTED AND ENCRYPTED SECURITY QR ISSUED.'
        );
        appendToConsole(
          'success',
          '---------------------------------------------------------'
        );
        appendToConsole(
          'success',
          'ONBOARDING MILESTONE ACHIEVED: PSS AND DEGRADATION MASTERED!'
        );
        setNodeStatus((prev) => ({ ...prev, PSS: 'success' }));
      }
    } else {
      appendToConsole('error', `ERROR: COMMAND NOT RECOGNIZED: '${command}'`);
      appendToConsole('output', "Type 'help' to list valid commands.");
      setNodeStatus((prev) => ({ ...prev, PSS: 'failure' }));
    }

    await sleep(250);
    setActiveNode(null);
    setIsSimulating(false);
  };

  const handleQuickCommand = (cmd: string) => {
    handleCommand(cmd);
  };

  const resetCircuitBreaker = () => {
    setCbState('CLOSED');
    setConsecutiveFailures(0);
    appendToConsole(
      'success',
      'CIRCUIT BREAKER: Manually reset state back to CLOSED.'
    );
  };

  const currentPassenger = bookings.find((b) => b.pnr === selectedScenario);

  return (
    <div className="dcs-sim-panel">
      {/* DCS Console Card (Left) */}
      <div className="terminal-card">
        <div className="terminal-header">
          <span>
            <Terminal size={14} /> DCS Terminal Console
          </span>
          <div className="terminal-controls">
            <div className="terminal-dot close" />
            <div className="terminal-dot min" />
            <div className="terminal-dot max" />
          </div>
        </div>

        <div className="terminal-body" aria-label="DCS Console Terminal Output">
          {consoleHistory.map((item, idx) => (
            <p key={idx} className={item.type}>
              {item.text}
            </p>
          ))}
          <div ref={consoleEndRef} />
        </div>

        {/* Console Quick Command Shortcuts */}
        {currentPassenger && (
          <div
            className="terminal-quick-btns"
            aria-label="Console quick action buttons"
          >
            <button
              className="quick-btn"
              onClick={() =>
                handleQuickCommand(`lookup ${currentPassenger.pnr}`)
              }
            >
              lookup {currentPassenger.pnr}
            </button>
            {currentPassenger.docs.includes('Missing') && (
              <button
                className="quick-btn"
                onClick={() => handleQuickCommand('adddocs passport:K5543210')}
              >
                adddocs passport
              </button>
            )}
            {currentPassenger.bags.includes('Unpaid') && (
              <button
                className="quick-btn"
                onClick={() => handleQuickCommand('pay')}
              >
                pay baggage fee
              </button>
            )}
            {currentPassenger.seat === 'UNASSIGNED' && (
              <button
                className="quick-btn"
                onClick={() => handleQuickCommand('seatmap')}
              >
                assign seat
              </button>
            )}
            {!currentPassenger.checkedIn && (
              <button
                className="quick-btn"
                onClick={() => handleQuickCommand('checkin')}
              >
                checkin
              </button>
            )}
            {currentPassenger.checkedIn && !currentPassenger.bpIssued && (
              <button
                className="quick-btn"
                onClick={() => handleQuickCommand('issuebp')}
              >
                issuebp
              </button>
            )}
            <button
              className="quick-btn"
              onClick={() => handleQuickCommand('clear')}
            >
              clear console
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="terminal-input-area">
          <span>$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommand(commandInput);
            }}
            placeholder="Type 'help' or enter console command..."
            disabled={isSimulating}
            aria-label="Console Command Input"
          />
          <button
            onClick={() => handleCommand(commandInput)}
            disabled={isSimulating}
          >
            EXEC
          </button>
        </div>
      </div>

      {/* Resilience Sandbox Dashboard (Right) */}
      <div className="sandbox-card">
        <div className="sandbox-title">
          <Sliders size={20} className="text-red-500" />
          <h3>Resilience Sandbox & Network Controller</h3>
        </div>

        {/* Passenger Scenario Cards Selector */}
        <div
          className="scenarios-heading"
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: '#8f9cae',
            marginBottom: '8px',
          }}
        >
          Select Passenger PNR to Simulate:
        </div>
        <div className="scenarios-list" role="tablist">
          {bookings.map((passenger) => {
            const isSelected = selectedScenario === passenger.pnr;

            // Map badge classes
            let badgeClass = 'ready';
            let badgeText = 'Clear';
            if (passenger.pnr === 'VA303D') {
              badgeClass = 'error';
              badgeText = 'Void';
            } else if (passenger.docs.includes('Missing')) {
              badgeClass = 'docs';
              badgeText = 'APIS Block';
            } else if (passenger.bags.includes('Unpaid')) {
              badgeClass = 'pay';
              badgeText = 'EMD Block';
            } else if (passenger.seat === 'UNASSIGNED') {
              badgeClass = 'pay';
              badgeText = 'No Seat';
            }

            if (passenger.checkedIn) {
              badgeText = 'Checked-in';
              badgeClass = 'ready';
            }
            if (passenger.bpIssued) {
              badgeText = 'Boarded';
            }

            return (
              <button
                key={passenger.pnr}
                className={`scenario-button ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedScenario(passenger.pnr);
                  appendToConsole(
                    'success',
                    `DCS CONSOLE: Selected passenger changed to ${passenger.name} (${passenger.pnr})`
                  );
                }}
                role="tab"
                aria-selected={isSelected}
              >
                <div className="scenario-info">
                  <h5>
                    {passenger.name} ({passenger.pnr})
                  </h5>
                  <p>
                    {passenger.flight} • Seat: {passenger.seat}
                  </p>
                </div>
                <div className="scenario-meta">
                  <span className={badgeClass}>{badgeText}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Metrics Overlay */}
        <div
          className="sandbox-outcome"
          style={{ marginTop: '0', marginBottom: '20px' }}
        >
          <h4>DCS Live Telemetry Metrics</h4>
          <div className="outcome-stat-row">
            <div className="outcome-stat">
              <span>Avg Latency</span>
              <strong className={avgLatency > timeoutLimit ? 'warn' : 'pass'}>
                {avgLatency}ms
              </strong>
            </div>
            <div className="outcome-stat">
              <span>Err Rate</span>
              <strong
                className={
                  errorRate > 30 ? 'fail' : errorRate > 0 ? 'warn' : 'pass'
                }
              >
                {errorRate}%
              </strong>
            </div>
            <div className="outcome-stat">
              <span>System Uptime</span>
              <strong className="pass">99.8%</strong>
            </div>
          </div>
          <p>
            <strong>State: </strong>
            <span
              style={{
                fontWeight: 800,
                color:
                  cbState === 'CLOSED'
                    ? '#0ca678'
                    : cbState === 'OPEN'
                      ? '#fa5252'
                      : '#f76707',
              }}
            >
              CIRCUIT BREAKER {cbState}
            </span>
            {cbState === 'OPEN' && (
              <button
                onClick={resetCircuitBreaker}
                style={{
                  marginLeft: '10px',
                  padding: '2px 8px',
                  background: '#fa5252',
                  color: 'white',
                  border: '0',
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                RESET
              </button>
            )}
          </p>
        </div>

        {/* Sandbox Downstream Control Sliders */}
        <div className="sandbox-controls-grid">
          <div className="control-group">
            <h4>Seatmap API Latency</h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '6px',
              }}
            >
              <span>Simulated Delay</span>
              <strong>{latency}ms</strong>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
              style={{ width: '100%' }}
              aria-label="Simulated Downstream Latency"
            />
          </div>

          <div className="control-group">
            <h4>Timeout Limit (Threshold)</h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '6px',
              }}
            >
              <span>Time-to-Abort</span>
              <strong>{timeoutLimit}ms</strong>
            </div>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={timeoutLimit}
              onChange={(e) => setTimeoutLimit(Number(e.target.value))}
              style={{ width: '100%' }}
              aria-label="Client Timeout Threshold"
            />
          </div>

          <div className="control-group">
            <h4>Retry Attempts</h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '6px',
              }}
            >
              <span>Apollo Retry Count</span>
              <strong>{retries}</strong>
            </div>
            <select
              value={retries}
              onChange={(e) => setRetries(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
              }}
              aria-label="Downstream Retries count"
            >
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} retries
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <h4>Circuit Breaker</h4>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '6px',
              }}
            >
              <span>Fault Protection</span>
              <strong>{circuitBreakerEnabled ? 'ENABLED' : 'DISABLED'}</strong>
            </div>
            <button
              onClick={() => {
                setCircuitBreakerEnabled(!circuitBreakerEnabled);
                appendToConsole(
                  'warn',
                  `CIRCUIT BREAKER: ${!circuitBreakerEnabled ? 'ENABLED' : 'DISABLED'}`
                );
              }}
              style={{
                width: '100%',
                padding: '6px',
                background: circuitBreakerEnabled ? '#0ca678' : '#8f9cae',
                color: 'white',
                border: '0',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {circuitBreakerEnabled
                ? 'Deactivate Breaker'
                : 'Activate Breaker'}
            </button>
          </div>
        </div>

        {/* Fallback Strategy Controller */}
        <div className="control-group" style={{ marginBottom: '20px' }}>
          <h4>Resilient Fallback Policy</h4>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {[
              {
                id: 'fail-hard',
                label: 'Fail Hard (503)',
                desc: 'Errors downstream propagate directly back to client',
              },
              {
                id: 'cache-last-known',
                label: 'Serve Cache (Resilient)',
                desc: 'Serves Apollo Client last-cached passenger seatmap layout',
              },
              {
                id: 'random-assign',
                label: 'Auto-Assign Seat',
                desc: 'Downstream auto-allocates seat without loading seat visualizer',
              },
            ].map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => {
                  setFallbackStrategy(strategy.id);
                  appendToConsole(
                    'success',
                    `FALLBACK POLICY: Policy changed to '${strategy.label}'`
                  );
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background:
                    fallbackStrategy === strategy.id ? '#1e293b' : 'white',
                  color: fallbackStrategy === strategy.id ? 'white' : '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                title={strategy.desc}
              >
                {strategy.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Node Flow Visualization Graph */}
        <div className="visual-graph">
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              fontWeight: 800,
              color: '#94a3b8',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Network Request Path Trace</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity
                size={12}
                className={
                  isSimulating
                    ? 'text-blue-400 animate-pulse'
                    : 'text-slate-400'
                }
              />{' '}
              Live Flow
            </span>
          </div>

          <div className="visual-nodes">
            {/* Browser Node */}
            <div
              className={`visual-node ${activeNode === 'client' ? 'active' : nodeStatus.client === 'success' ? 'success' : ''}`}
            >
              <Home size={16} />
              <span>UI</span>
              <div className="node-label">Browser</div>
            </div>

            {/* Next.js Proxy Node */}
            <div
              className={`visual-node ${activeNode === 'proxy' ? 'active' : nodeStatus.proxy === 'success' ? 'success' : ''}`}
            >
              <RadioTower size={16} />
              <span>Apollo</span>
              <div className="node-label">Next.js Proxy</div>
            </div>

            {/* Backend API Node */}
            <div
              className={`visual-node ${activeNode === 'backend' ? 'active' : nodeStatus.backend === 'success' ? 'success' : ''}`}
            >
              <Activity size={16} />
              <span>API</span>
              <div className="node-label">Fastify Backend</div>
            </div>

            {/* Downstream PSS Node */}
            <div
              className={`visual-node ${activeNode === 'PSS' ? 'active' : nodeStatus.PSS === 'success' ? 'success' : nodeStatus.PSS === 'failure' ? 'failure' : ''}`}
            >
              <Plane size={16} />
              <span>PSS</span>
              <div className="node-label">Amadeus Altéa</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 13. Notes Tab
// ==========================================

function Notes(props: any) {
  return <CaptainLog {...props} />;
}

function CaptainLog({ logs, setLogs, draft, setDraft, compact = false }: any) {
  const prompts = [
    ['Observation', 'What changed today that I should remember tomorrow?'],
    ['Decision', 'Decision made, owner, evidence, and who needs to know.'],
    ['Risk', 'Signal, impact, owner, mitigation, next check date.'],
  ];

  function addLog() {
    if (!draft.text.trim()) return;
    setLogs((current: any) => [
      {
        id: generateId(),
        type: draft.type,
        text: draft.text.trim(),
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
    setDraft({ type: draft.type, text: '' });
  }

  return (
    <section className={compact ? 'log compact' : 'log panel'}>
      <PanelTitle
        icon={MessageSquareText}
        title="Notes"
        meta={`${logs.length} saved`}
      />
      <div className="notes-purpose">
        <strong>
          Use this when something should change how you lead tomorrow.
        </strong>
        <p>
          Capture decisions, risks, domain terms, people context, and follow-ups
          before they become mental clutter.
        </p>
      </div>
      <div className="log-compose">
        <select
          aria-label="Note type"
          value={draft.type}
          onChange={(event) => setDraft({ ...draft, type: event.target.value })}
        >
          <option>Observation</option>
          <option>Evidence</option>
          <option>Decision</option>
          <option>Follow-up</option>
          <option>Person</option>
          <option>Risk</option>
          <option>Domain Term</option>
        </select>
        <textarea
          value={draft.text}
          onChange={(event) => setDraft({ ...draft, text: event.target.value })}
          placeholder="Write the note in plain English. Example: Seat map failures may block check-in completion; confirm owner and fallback path tomorrow."
          aria-label="Note text"
        />
        <button onClick={addLog}>
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="note-prompts" aria-label="Note starter prompts">
        {prompts.map(([type, text]) => (
          <button key={type} onClick={() => setDraft({ type, text })}>
            <span>{type}</span>
            <strong>{text}</strong>
          </button>
        ))}
      </div>
      <div className="log-list">
        <div className="log-list-heading">
          <strong>Saved notes</strong>
          <span>Newest first</span>
        </div>
        {logs.slice(0, compact ? 4 : 12).map((log: any) => (
          <article key={log.id}>
            <span>{log.type}</span>
            <p>{log.text}</p>
            <time>{log.date}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 14. Shared Editors & Right-Rail Panels
// ==========================================

function EvidenceLinksEditor({
  links,
  setLinks,
  compact = false,
}: {
  links: EvidenceLink[];
  setLinks: any;
  compact?: boolean;
}) {
  const visibleLinks = compact ? links.slice(0, 4) : links;

  function updateLink(id: string, patch: any) {
    setLinks((current: any) =>
      current.map((item: any) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function addLink() {
    setLinks((current: any) => [
      ...current,
      {
        id: generateId(),
        label: 'New evidence link',
        owner: 'Erik',
        status: 'Unknown',
        href: '',
        notes: 'What truth does this prove?',
      },
    ]);
  }

  function deleteLink(id: string) {
    setLinks((current: any) => current.filter((item: any) => item.id !== id));
  }

  return (
    <section className={compact ? 'evidence-board compact' : 'evidence-board'}>
      <div className="daily-section-heading">
        <strong>Evidence Links</strong>
        <span>
          {links.filter((item) => item.status === 'Verified').length} verified
        </span>
      </div>
      <div className="evidence-list">
        {visibleLinks.map((item) => (
          <article key={item.id}>
            <input
              value={item.label}
              onChange={(event) =>
                updateLink(item.id, { label: event.target.value })
              }
              aria-label={`${item.label} label`}
            />
            <input
              value={item.owner}
              onChange={(event) =>
                updateLink(item.id, { owner: event.target.value })
              }
              aria-label={`${item.label} owner`}
            />
            <select
              value={item.status}
              onChange={(event) =>
                updateLink(item.id, { status: event.target.value })
              }
              aria-label={`${item.label} status`}
            >
              {[
                'Need link Monday',
                'Need evidence',
                'Unknown',
                'Verified',
                'Blocked',
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <input
              value={item.href}
              onChange={(event) =>
                updateLink(item.id, { href: event.target.value })
              }
              placeholder="URL"
              aria-label={`${item.label} URL`}
            />
            <textarea
              value={item.notes}
              onChange={(event) =>
                updateLink(item.id, { notes: event.target.value })
              }
              aria-label={`${item.label} notes`}
            />
            <div>
              {item.href && (
                <a
                  href={normaliseUrl(item.href)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> Open
                </a>
              )}
              {!compact && (
                <button onClick={() => deleteLink(item.id)}>Delete</button>
              )}
            </div>
          </article>
        ))}
      </div>
      <button className="small-add" onClick={addLink}>
        <Plus size={15} /> Add evidence link
      </button>
    </section>
  );
}

function OwnerQuestionBoard({
  questions,
  setQuestions,
  compact = false,
}: {
  questions: OwnerQuestion[];
  setQuestions: any;
  compact?: boolean;
}) {
  const visibleQuestions = compact ? questions.slice(0, 4) : questions;

  function updateQuestion(id: string, patch: any) {
    setQuestions((current: any) =>
      current.map((item: any) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  }

  function addQuestion() {
    setQuestions((current: any) => [
      ...current,
      {
        id: generateId(),
        owner: 'Owner to confirm',
        askWhen: 'This week',
        question: 'What do I need to verify?',
        status: 'Open',
        evidence: '',
        nextAction: 'Name the next action.',
      },
    ]);
  }

  function deleteQuestion(id: string) {
    setQuestions((current: any) =>
      current.filter((item: any) => item.id !== id)
    );
  }

  return (
    <section className={compact ? 'question-board compact' : 'question-board'}>
      <div className="daily-section-heading">
        <strong>Owner Questions</strong>
        <span>
          {questions.filter((item) => item.status !== 'Closed').length} open
        </span>
      </div>
      <div className="question-list">
        {visibleQuestions.map((item) => (
          <article key={item.id}>
            <div>
              <input
                value={item.owner}
                onChange={(event) =>
                  updateQuestion(item.id, { owner: event.target.value })
                }
                aria-label={`${item.owner} owner`}
              />
              <input
                value={item.askWhen}
                onChange={(event) =>
                  updateQuestion(item.id, { askWhen: event.target.value })
                }
                aria-label={`${item.owner} ask when`}
              />
              <select
                value={item.status}
                onChange={(event) =>
                  updateQuestion(item.id, { status: event.target.value })
                }
                aria-label={`${item.owner} question status`}
              >
                {['Open', 'Asked', 'Waiting', 'Blocked', 'Closed'].map(
                  (status) => (
                    <option key={status}>{status}</option>
                  )
                )}
              </select>
            </div>
            <textarea
              value={item.question}
              onChange={(event) =>
                updateQuestion(item.id, { question: event.target.value })
              }
              aria-label={`${item.owner} question`}
            />
            <input
              value={item.evidence}
              onChange={(event) =>
                updateQuestion(item.id, { evidence: event.target.value })
              }
              placeholder="Evidence link or answer source"
              aria-label={`${item.owner} evidence`}
            />
            <textarea
              value={item.nextAction}
              onChange={(event) =>
                updateQuestion(item.id, { nextAction: event.target.value })
              }
              aria-label={`${item.owner} next action`}
            />
            {!compact && (
              <button onClick={() => deleteQuestion(item.id)}>Delete</button>
            )}
          </article>
        ))}
      </div>
      <button className="small-add" onClick={addQuestion}>
        <Plus size={15} /> Add question
      </button>
    </section>
  );
}

function BossFights({ bossDone, setBossDone }: any) {
  const [openBoss, setOpenBoss] = useState(bossFights[0].id);

  function taskKey(fightId: string, phaseIndex: number, taskIndex: number) {
    return `${fightId}-${phaseIndex}-${taskIndex}`;
  }

  function completionFor(fight: BossFight) {
    const tasks = fight.attackPlan.flatMap(([, steps]) => steps);
    const doneCount = fight.attackPlan.reduce(
      (count, [, steps], phaseIndex) =>
        count +
        steps.filter(
          (_, taskIndex) => bossDone[taskKey(fight.id, phaseIndex, taskIndex)]
        ).length,
      0
    );
    return { doneCount, total: tasks.length };
  }

  return (
    <section className="boss-panel">
      <PanelTitle
        icon={AlertTriangle}
        title="Boss Fights"
        meta="Reduce early"
      />
      {bossFights.map((fight) => {
        const Icon = fight.icon;
        const expanded = openBoss === fight.id;
        const { doneCount, total } = completionFor(fight);
        const progress = total ? Math.round((doneCount / total) * 100) : 0;
        return (
          <article
            className={`boss-card ${fight.severity} ${expanded ? 'expanded' : ''}`}
            key={fight.id}
          >
            <button
              className="boss-card-summary"
              aria-expanded={expanded}
              aria-controls={`boss-plan-${fight.id}`}
              onClick={() => setOpenBoss(expanded ? '' : fight.id)}
            >
              <div className="boss-icon">
                <Icon size={25} />
              </div>
              <div>
                <strong>{fight.title}</strong>
                <p>{fight.summary}</p>
                <small>{fight.counter}</small>
              </div>
              <span>{fight.severity}</span>
              <div
                className="boss-progress"
                aria-label={`${doneCount} of ${total} boss tasks complete`}
              >
                <b>
                  {doneCount}/{total}
                </b>
                <i>
                  <em style={{ width: `${progress}%` }} />
                </i>
              </div>
              <ChevronRight className="boss-chevron" size={18} />
            </button>
            {expanded && (
              <div className="boss-attack-plan" id={`boss-plan-${fight.id}`}>
                <div className="boss-attack-header">
                  <strong>Attack plan</strong>
                  <span>{progress}% clear</span>
                </div>
                {fight.attackPlan.map(([phase, steps], phaseIndex) => (
                  <div className="boss-phase" key={phase}>
                    <h3>{phase}</h3>
                    {steps.map((step, taskIndex) => {
                      const key = taskKey(fight.id, phaseIndex, taskIndex);
                      return (
                        <label
                          className={bossDone[key] ? 'done' : ''}
                          key={step}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(bossDone[key])}
                            onChange={() =>
                              setBossDone((current: any) => ({
                                ...current,
                                [key]: !current[key],
                              }))
                            }
                          />
                          <span>{step}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
