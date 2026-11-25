import type { Trip } from "./types";

/**
 * STARTER TRIPS
 * Shown while Supabase is not connected, and loaded into the database by
 * supabase/seed.sql. Anything not finalised is clearly marked "to be confirmed"
 * — no itinerary, accommodation, price or availability is invented.
 */

export const demoTrips: Trip[] = [
  {
    id: "demo-bali-girls-escape",
    slug: "bali-girls-escape",
    title: "Bali Girls Escape 🌺",
    destination: "Bali",
    country: "Indonesia",
    arrival_airport: "Bali (DPS)",
    trip_type: "Organized girls-only luxury group escape",
    start_date: "2026-12-07",
    end_date: "2026-12-15",
    duration_days: 9,
    duration_nights: 8,
    price: 1499,
    deposit_amount: 1049,
    balance_due_date: "2026-12-06",
    deposit_due_date: "2026-12-01",
    currency: "EUR",
    status: "open",
    inquiry_only: true,
    group_size_min: 8,
    group_size_max: 10,
    spots_available: null,
    tagline: "Luxury villas. New besties. No travel bestie needed. 💗",
    short_description: "9 days of luxury villa living, waterfalls, rafting, surf, perfume-making and Uluwatu sunsets with a group of girls. Come solo, leave with new besties.",
    description: "No travel bestie? No problem! 💗\n\nJoin us for 9 unforgettable days of luxury in Bali with a group of girls who are just as excited to explore the world as you are.\n\nYou’ll stay in beautiful, luxurious villas in Ubud, Canggu and Uluwatu — think stylish living spaces, tropical gardens and pool days with the girls between adventures.\n\nWe start in Ubud with a welcome pajama party and a private chef dinner at the villa, waterfalls, rice terraces and white-water rafting, move on to Canggu for surfing, shopping, Pilates, a Balinese massage and a signature perfume workshop, and finish in Uluwatu with dreamy beaches, the sunset Kecak Fire Dance and a farewell dinner on Jimbaran Beach.\n\nCome solo. Leave with new besties.",
    audience: "Girls aged 18+",
    group_note: "Approximately 8–10 travelers (subject to confirmation)",
    stays: [
  {
    "name": "Ubud",
    "start": "2026-12-07",
    "end": "2026-12-10",
    "nights": 3,
    "summary": "Luxury villa life, waterfalls, rice terraces and rafting.",
    "image": "/images/villa-sunset.jpg"
  },
  {
    "name": "Canggu",
    "start": "2026-12-10",
    "end": "2026-12-13",
    "nights": 3,
    "summary": "A stylish villa base for surf, boutiques, Pilates and perfume-making.",
    "image": "/images/surf-lesson.jpg"
  },
  {
    "name": "Uluwatu",
    "start": "2026-12-13",
    "end": "2026-12-15",
    "nights": 2,
    "summary": "Villa pool days, beaches, clifftop temples and the Kecak Fire Dance.",
    "image": "/images/jimbaran-dinner.jpg"
  }
],
    highlights: [],
    itinerary: [
  {
    "date": "2026-12-07",
    "location": "Ubud",
    "title": "Welcome to Bali — Pajama Party & Private Chef",
    "emoji": "🎀",
    "image": "/images/villa-dinner.jpg",
    "overnight": "Ubud",
    "summary": "Arrive, settle into our luxury Ubud villa and meet the girls at a welcome pajama party with a private chef dinner.",
    "timeline": [
      {
        "time": "Arrival",
        "title": "Welcome to Bali",
        "items": [
          "Arrival at Bali airport",
          "Airport pickup",
          "Private transfer to our luxury villa in Ubud",
          "Luxury villa check-in and free time"
        ]
      },
      {
        "time": "Evening",
        "title": "Welcome pajama party",
        "items": [
          "Meet the other girls",
          "Welcome pajama party",
          "Private chef prepares dinner at the villa",
          "Music, games, and bonding activities"
        ]
      }
    ]
  },
  {
    "date": "2026-12-08",
    "location": "Ubud",
    "title": "Chasing Waterfalls & Bali Magic",
    "emoji": "🌿",
    "image": "/images/waterfall-hike.jpg",
    "overnight": "Ubud",
    "summary": "A private guided Ubud tour: two waterfalls, coffee and tea tasting, Tirta Empul Temple, the rice terraces and the jungle swing.",
    "timeline": [
      {
        "time": "Morning",
        "title": "Breakfast at the villa",
        "items": [
          "Breakfast at the villa"
        ]
      },
      {
        "time": "Day",
        "title": "Private guided Ubud tour",
        "items": [
          "Kanto Lampo Waterfall",
          "Tibumana Waterfall",
          "Traditional Balinese coffee and tea tasting",
          "Tirta Empul Temple",
          "Tegalalang Rice Terraces",
          "Bali jungle swing",
          "Return to the villa"
        ]
      },
      {
        "time": "Optional",
        "title": "ATV quad biking",
        "items": [
          "For guests who want more adventure.",
          "Not included in the package price — requires an additional payment.",
          "Guests who don't want to take part can enjoy a more relaxed alternative."
        ],
        "optional": true,
        "extra_cost": true
      }
    ]
  },
  {
    "date": "2026-12-09",
    "location": "Ubud",
    "title": "Rapids, Rainforest & Girls' Adventure",
    "emoji": "🌊",
    "image": "/images/rafting.jpg",
    "overnight": "Ubud",
    "summary": "Guided white-water rafting through the rainforest, then pool time and a free evening.",
    "timeline": [
      {
        "time": "Morning",
        "title": "Breakfast & transfer",
        "items": [
          "Breakfast at the villa",
          "Transfer to the rafting activity"
        ]
      },
      {
        "time": "Rafting",
        "title": "White-water rafting",
        "items": [
          "Safety briefing and equipment",
          "Guided white-water rafting experience",
          "Shower and changing facilities after rafting"
        ]
      },
      {
        "time": "Lunch",
        "title": "Indonesian buffet lunch",
        "items": [
          "Guests can choose to enjoy an Indonesian buffet lunch after rafting.",
          "Optional and not compulsory.",
          "Not included in the €1,499 package — paid separately by each guest."
        ],
        "optional": true,
        "extra_cost": true
      },
      {
        "time": "Afternoon",
        "title": "Back to the villa",
        "items": [
          "Return to the villa",
          "Pool time and relaxation",
          "Free evening"
        ]
      }
    ]
  },
  {
    "date": "2026-12-10",
    "location": "Ubud → Canggu",
    "title": "Hello, Canggu! Sunset & Girls' Dinner",
    "emoji": "🌅",
    "image": "/images/villa-garden.jpg",
    "overnight": "Canggu",
    "summary": "Transfer to Canggu, a free afternoon, sunset at the beach and a girls' dinner.",
    "timeline": [
      {
        "time": "Morning",
        "title": "Goodbye, Ubud",
        "items": [
          "Breakfast",
          "Check out from Ubud",
          "Private transfer to Canggu",
          "Check into our luxury Canggu villa when available"
        ]
      },
      {
        "time": "Afternoon",
        "title": "Free afternoon",
        "items": [
          "Free afternoon to relax or explore"
        ]
      },
      {
        "time": "Evening",
        "title": "Sunset & girls' dinner",
        "items": [
          "Sunset at the beach",
          "Girls' dinner at a restaurant (not included — paid individually)"
        ]
      }
    ]
  },
  {
    "date": "2026-12-11",
    "location": "Canggu",
    "title": "Surf, Shop & Party",
    "emoji": "🏄‍♀️",
    "image": "/images/surf-golden.jpg",
    "overnight": "Canggu",
    "summary": "A beginner surf lesson, café lunch, boutique shopping and an optional night out with free guest-list entry.",
    "timeline": [
      {
        "time": "Morning",
        "title": "Beginner surfing lesson",
        "items": [
          "Breakfast",
          "Morning beginner surfing lesson"
        ]
      },
      {
        "time": "Midday",
        "title": "Lunch & free time",
        "items": [
          "Lunch at a cute Canggu café (not included — paid individually)",
          "Free time"
        ]
      },
      {
        "time": "Afternoon / Evening",
        "title": "Boutique shopping",
        "items": [
          "Afternoon/evening shopping at local boutiques"
        ]
      },
      {
        "time": "Night",
        "title": "Nightclub outing — guest list",
        "items": [
          "Optional — guests can choose to stay in.",
          "We arrange guest-list access, so entry is free.",
          "Drinks and personal expenses are not included.",
          "Venue age restrictions apply."
        ],
        "optional": true,
        "extra_cost": false
      }
    ]
  },
  {
    "date": "2026-12-12",
    "location": "Canggu",
    "title": "Pilates, Perfume & Sunset Diaries",
    "emoji": "🎀",
    "image": "/images/yoga-pool.jpg",
    "overnight": "Canggu",
    "summary": "Our wellness and self-care day: yoga or Pilates, a Balinese massage, a signature perfume workshop and Pererenan sunset.",
    "timeline": [
      {
        "time": "9:00 AM",
        "title": "Breakfast",
        "items": [
          "Breakfast at the villa."
        ]
      },
      {
        "time": "10:00 AM",
        "title": "Yoga or Pilates",
        "items": [
          "A relaxing, beginner-friendly yoga or Pilates session with the girls."
        ]
      },
      {
        "time": "11:30 AM",
        "title": "Balinese Massage",
        "items": [
          "A relaxing massage at a local spa."
        ]
      },
      {
        "time": "1:00 PM",
        "title": "Lunch",
        "items": [
          "Lunch together at a beautiful Canggu café.",
          "Lunch is not included in the package — paid individually."
        ]
      },
      {
        "time": "2:30 PM",
        "title": "Signature Perfume Workshop",
        "items": [
          "A personalized perfume-making experience.",
          "Discover more than 33 fragrance notes",
          "Learn the basics of perfume creation",
          "Choose your favorite scents",
          "Create a unique perfume formula",
          "Blend the ingredients with guidance from the host",
          "Bottle your personalized perfume",
          "Take your own perfume home as a souvenir"
        ]
      },
      {
        "time": "5:30 PM",
        "title": "Pererenan Beach Sunset",
        "items": [
          "Enjoy golden hour at Pererenan Beach."
        ]
      },
      {
        "time": "7:30 PM",
        "title": "Girls' Dinner",
        "items": [
          "Dinner together at a restaurant in Canggu or Pererenan. Dinner is not included — paid individually."
        ]
      }
    ]
  },
  {
    "date": "2026-12-13",
    "location": "Canggu → Uluwatu",
    "title": "Hello, Uluwatu! Beach Days & Golden Skies",
    "emoji": "🏝️",
    "image": "/images/uluwatu-sunset.jpg",
    "overnight": "Uluwatu",
    "summary": "Transfer to Uluwatu, villa pool time, an afternoon at the beach, sunset and a girls' dinner.",
    "timeline": [
      {
        "time": "Morning",
        "title": "Goodbye, Canggu",
        "items": [
          "Breakfast",
          "Check out from Canggu",
          "Private transfer to Uluwatu",
          "Arrive at our luxury Uluwatu villa",
          "Check in when rooms are ready"
        ]
      },
      {
        "time": "Afternoon",
        "title": "Pool & beach",
        "items": [
          "Free time to relax, swim in the villa pool, and unwind",
          "Afternoon beach visit, such as Melasti Beach"
        ]
      },
      {
        "time": "Evening",
        "title": "Sunset & girls' dinner",
        "items": [
          "Sunset by the ocean",
          "Girls' dinner (not included — paid individually)"
        ]
      }
    ]
  },
  {
    "date": "2026-12-14",
    "location": "Uluwatu",
    "title": "Uluwatu Magic — Beaches, Culture & Sunset Fire Dance",
    "emoji": "🔥",
    "image": "/images/jimbaran-dinner.jpg",
    "overnight": "Uluwatu",
    "summary": "Our final full day: beach, GWK Cultural Park, Uluwatu Temple, the Kecak Fire Dance and a farewell dinner at Jimbaran (dinner paid individually).",
    "timeline": [
      {
        "time": "11:00 AM",
        "title": "Private Pickup",
        "items": [
          "Our private English-speaking driver picks us up from the accommodation."
        ]
      },
      {
        "time": "Stop 1",
        "title": "Padang Padang Beach or Tanah Barak",
        "items": [
          "Relax at the beach, enjoy the dramatic cliffs, and take beautiful photos."
        ]
      },
      {
        "time": "Stop 2",
        "title": "Garuda Wisnu Kencana Cultural Park",
        "items": [
          "Visit the iconic GWK Cultural Park and admire its enormous statue."
        ]
      },
      {
        "time": "Stop 3",
        "title": "Uluwatu Temple",
        "items": [
          "Explore the famous cliffside temple overlooking the Indian Ocean."
        ]
      },
      {
        "time": "6:00 PM",
        "title": "Kecak Fire Dance",
        "items": [
          "Watch Bali's traditional Kecak performance during sunset, subject to ticket availability."
        ]
      },
      {
        "time": "8:00 PM",
        "title": "Farewell Dinner at Jimbaran",
        "items": [
          "A special seafood dinner on Jimbaran Beach, with alternatives for guests who don't eat seafood.",
          "Not included in the package price — paid individually."
        ],
        "extra_cost": false
      },
      {
        "time": "After Dinner",
        "title": "Back to Uluwatu",
        "items": [
          "Private transfer back to the Uluwatu accommodation."
        ]
      }
    ]
  },
  {
    "date": "2026-12-15",
    "location": "Uluwatu → Airport",
    "title": "Until Next Time, Bali!",
    "emoji": "✈️",
    "image": "/images/wing-sky.jpg",
    "overnight": "",
    "summary": "Final breakfast, check-out, airport transfers and goodbyes.",
    "timeline": [
      {
        "time": "Morning",
        "title": "Final morning",
        "items": [
          "Final breakfast",
          "Pack bags",
          "Check out"
        ]
      },
      {
        "time": "Departure",
        "title": "Goodbye, Bali",
        "items": [
          "Airport transfer according to flight schedules",
          "Say goodbye to the girls"
        ]
      }
    ]
  }
],
    itinerary_confirmed: false,
    accommodation: "8 nights in luxurious villas, shared with the girls, across three destinations: Ubud (December 7–10, 4 days), Canggu (December 10–13, 4 days) and Uluwatu (December 13–15, 3 days). Expect beautiful, stylish villas with pool time built into the schedule. The specific villas will be confirmed with suppliers.",
    accommodation_confirmed: false,
    included: [
  "8 nights in luxurious shared villas",
  "Breakfast at the villas",
  "Airport pickup and departure transfer",
  "Private group transportation for scheduled activities",
  "Welcome pajama party",
  "Private chef welcome dinner",
  "Ubud sightseeing experience",
  "White-water rafting activity",
  "Beginner surfing lesson",
  "Yoga or Pilates session",
  "Balinese massage",
  "Signature perfume-making workshop",
  "Personalized perfume to take home",
  "Uluwatu sightseeing experience",
  "Uluwatu Temple and Kecak Fire Dance",
  "Free guest-list entry for the optional nightclub outing",
  "Group coordination and planned experiences"
],
    inclusions_confirmed: false,
    excluded: [
  "International flights",
  "Visa fees",
  "Travel insurance",
  "Optional ATV quad biking",
  "Lunches (including the Day 3 optional Indonesian buffet lunch)",
  "Dinners, including the Jimbaran farewell dinner (except the private chef welcome dinner)",
  "Meals not specifically included",
  "Nightclub drinks and personal spending",
  "Shopping and personal expenses",
  "Optional additional activities",
  "Tips and personal purchases"
],
    excluded_note: "Lunches and dinners are not included and are paid individually — including the Jimbaran farewell dinner. The only included dinner is the private chef welcome dinner at the villa on Day 1. Optional extras marked “Optional — Extra Cost” are paid separately by each guest. Prices for optional extras will be shared before the trip.",
    faqs: [
  {
    "q": "How much does the trip cost?",
    "a": "€1,499 / person, including 8 nights in luxurious villas. International flights, lunches, dinners (except the private chef welcome dinner), the Jimbaran farewell dinner, optional extras (such as ATV quad biking and the Day 3 buffet lunch), drinks and personal expenses are not included."
  },
  {
    "q": "Can I come on my own?",
    "a": "Yes! This trip is made for solo travelers. Come solo, leave with new besties."
  },
  {
    "q": "Are meals included?",
    "a": "Breakfast at the villas and the private chef welcome dinner (Day 1) are included. All other lunches and dinners — including the Jimbaran farewell dinner on Day 8 — are not included and are paid individually."
  },
  {
    "q": "Where will we stay?",
    "a": "In luxurious villas, shared with the girls — Ubud (4 days), Canggu (4 days) and Uluwatu (3 days). The specific villas will be confirmed with suppliers."
  },
  {
    "q": "Who is this trip for?",
    "a": "Girls aged 18 and over — there's no upper age limit. It's an organized, girls-only group escape of approximately 8–10 travelers (subject to confirmation)."
  },
  {
    "q": "Are the optional activities included?",
    "a": "ATV quad biking and the Day 3 Indonesian buffet lunch are marked “Optional — Extra Cost” and are paid separately. The nightclub outing is optional too — we arrange guest-list access so entry is free, but drinks are not included. Anyone who prefers not to join can enjoy a more relaxed alternative or stay in."
  },
  {
    "q": "Are flights included?",
    "a": "No. International flights are not included in the €1,499 package. Our team can provide a personalized flight quotation — Economy, Premium Economy, Business or First Class."
  },
  {
    "q": "Is my spot confirmed when I submit the form?",
    "a": "No. Submitting the form is a request, not a confirmed booking, and no payment is required at that stage. If your request is approved, you'll receive a secure link to your personalised booking agreement. Once you've signed it, message us on WhatsApp and we'll send you the bank details. The first payment (70% deposit, €1,049) is due by December 1, 2026, and the remaining 30% (€450) by December 6, 2026. Your booking is only confirmed after we've received your payment in our official account and sent you written confirmation."
  }
],
    // Gallery photos supplied by The Elsewhere Club.
    cover_image: "/images/girls-pool.jpg",
    gallery: ["/images/surf-lesson.jpg", "/images/waterfall-hike.jpg", "/images/villa-dinner.jpg", "/images/villa-sunset.jpg", "/images/rafting.jpg", "/images/surf-golden.jpg", "/images/jimbaran-dinner.jpg"],
    published: true,
    featured: true,
    sort_order: 1,
  },
  {
    id: "demo-our-next-escape",
    slug: "our-next-escape",
    title: "Our Next Escape",
    destination: "Coming Soon",
    country: "",
    arrival_airport: "",
    trip_type: "Curated group travel",
    start_date: null,
    end_date: null,
    duration_days: null,
    duration_nights: null,
    price: null,
    deposit_amount: null,
    balance_due_date: null,
    deposit_due_date: null,
    currency: "USD",
    status: "waitlist",
    inquiry_only: true,
    group_size_min: null,
    group_size_max: null,
    spots_available: null,
    tagline: "A new destination is on its way.",
    short_description: "A new destination is on its way. Join the waitlist to hear first.",
    audience: "",
    group_note: "",
    stays: [],
    description: "We’re curating our next group escape. Join the waitlist and you’ll be the first to hear where we’re going, when, and how much it costs.",
    highlights: [],
    itinerary: [],
    itinerary_confirmed: false,
    accommodation: "",
    accommodation_confirmed: false,
    included: [],
    inclusions_confirmed: false,
    excluded: [],
    excluded_note: "",
    faqs: [{ q: "When will the destination be announced?", a: "Waitlist members hear first — join to be notified." }],
    cover_image: "/images/flight-departure.jpg",
    gallery: [],
    published: true,
    featured: true,
    sort_order: 2,
  },
];

/** Used when a trip has no "Not included" list of its own. */
export const ALWAYS_EXCLUDED = [
  "International flights (we can quote these separately)",
  "Travel insurance",
  "Visa fees and any local tourist levies",
  "Meals and drinks not listed as included",
  "Personal spending, tips and optional extras",
];

export const BOOKING_TERMS =
  "Requesting a spot doesn’t guarantee a booking, and no payment is required at that stage. If your request is approved, you’ll review and sign a personalised booking agreement — including the payment deadlines and the full cancellation and refund policy — before you pay anything. Your booking is confirmed only once your payment has cleared and we’ve sent you written confirmation.";

export const TRAVEL_REQUIREMENTS =
  "A passport valid for at least 6 months from arrival. Check visa requirements for your nationality on official government sources. We strongly advise suitable travel insurance covering emergency medical treatment, evacuation, trip cancellation and adventure activities. Speak to a travel health professional about vaccinations at least 6 weeks before travel.";
