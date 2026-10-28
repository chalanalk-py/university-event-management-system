const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let mysqlPool = null;
let useMySQL = false;

// Initial Seed Data
const getInitialSeed = () => {
  const hash = bcrypt.hashSync('password123', 8);
  const adminHash = bcrypt.hashSync('admin123', 8);

  return {
    users: [
      {
        id: 1,
        email: 'admin@unisphere.edu',
        username: 'alex_admin',
        password_hash: adminHash,
        full_name: 'Alex Turner (OC Head)',
        role: 'admin',
        coordinator_area: 'Executive OC',
        phone: '+1 (555) 019-2831',
        avatar_color: '#111827',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        email: 'student@unisphere.edu',
        username: 'sarah_student',
        password_hash: hash,
        full_name: 'Sarah Chen',
        role: 'student',
        coordinator_area: null,
        phone: '+1 (555) 438-9102',
        avatar_color: '#3B82F6',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        email: 'transport@unisphere.edu',
        username: 'david_transport',
        password_hash: hash,
        full_name: 'David Miller',
        role: 'coordinator',
        coordinator_area: 'Transportation',
        phone: '+1 (555) 782-3490',
        avatar_color: '#10B981',
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        email: 'designer@unisphere.edu',
        username: 'elena_designer',
        password_hash: hash,
        full_name: 'Elena Rostova',
        role: 'designer',
        coordinator_area: 'Media & Branding',
        phone: '+1 (555) 901-2384',
        avatar_color: '#8B5CF6',
        created_at: new Date().toISOString()
      },
      {
        id: 5,
        email: 'controller@unisphere.edu',
        username: 'marcus_agenda',
        password_hash: hash,
        full_name: 'Marcus Vance',
        role: 'live_agenda_controller',
        coordinator_area: 'Stage Operations',
        phone: '+1 (555) 349-8210',
        avatar_color: '#F59E0B',
        created_at: new Date().toISOString()
      },
      {
        id: 6,
        email: 'refreshments@unisphere.edu',
        username: 'priya_food',
        password_hash: hash,
        full_name: 'Priya Sharma',
        role: 'coordinator',
        coordinator_area: 'Refreshments',
        phone: '+1 (555) 612-4932',
        avatar_color: '#EC4899',
        created_at: new Date().toISOString()
      }
    ],
    events: [
      {
        id: 1,
        title: 'UniSphere Nexus Gala & Tech Fest 2026',
        description: 'The flagship annual university celebration featuring musical circles, technical showcases, design exhibits, and stage performances.',
        venue: 'Main University Auditorium & North Lawn',
        event_date: '2026-11-15',
        start_time: '09:00',
        end_time: '21:00',
        status: 'active',
        total_budget: 45000,
        created_by_user_id: 1,
        agenda_controller_id: 5,
        created_at: new Date().toISOString()
      }
    ],
    schedules: [
      {
        id: 1,
        event_id: 1,
        activity_title: 'Grand Inauguration & Keynote Address',
        description: 'Opening remarks by Dean of Student Affairs followed by national anthem and lamp lighting.',
        speaker_performer: 'Prof. Julian Brooks & Guest Dignitaries',
        start_time: '09:00',
        end_time: '10:00',
        location_venue: 'Auditorium - Main Stage',
        color_tag: '#3B82F6'
      },
      {
        id: 2,
        event_id: 1,
        activity_title: 'Campus Hackathon & Robotics Expo',
        description: 'Live student robotics battle and software project presentations.',
        speaker_performer: 'IEEE & Tech Society',
        start_time: '10:30',
        end_time: '13:00',
        location_venue: 'Engineering Quad / Hall B',
        color_tag: '#10B981'
      },
      {
        id: 3,
        event_id: 1,
        activity_title: 'Refreshments & Networking Buffet',
        description: 'Gourmet lunch and beverage stalls managed by hospitality team.',
        speaker_performer: 'Catering Service / Priya Sharma',
        start_time: '13:00',
        end_time: '14:30',
        location_venue: 'Central Dining Court',
        color_tag: '#F59E0B'
      },
      {
        id: 4,
        event_id: 1,
        activity_title: 'Inter-College Drama & Costume Showcase',
        description: 'Theatrical performance with custom historical costumes and musical scoring.',
        speaker_performer: 'Drama Guild & Musical Circle',
        start_time: '15:00',
        end_time: '17:30',
        location_venue: 'Auditorium - Main Stage',
        color_tag: '#8B5CF6'
      },
      {
        id: 5,
        event_id: 1,
        activity_title: 'Live Band Concert & Electronic Music Finale',
        description: 'High-energy musical performance featuring university rock band and DJ set.',
        speaker_performer: 'The Sound Waves & DJ Neon',
        start_time: '18:00',
        end_time: '21:00',
        location_venue: 'North Lawn Open Arena',
        color_tag: '#EF4444'
      }
    ],
    committee_positions: [
      {
        id: 1,
        event_id: 1,
        position_title: 'Organizing Committee (OC) President',
        description: 'Directs all overall committee operations, liaises with faculty and manages event execution.',
        nomination_open: true,
        voting_open: true,
        is_closed: false,
        elected_winner_id: null
      },
      {
        id: 2,
        event_id: 1,
        position_title: 'Head of Transportation & Logistics',
        description: 'Coordinates bus shuttles, rental vans, parking permits, and equipment transit.',
        nomination_open: true,
        voting_open: true,
        is_closed: false,
        elected_winner_id: null
      },
      {
        id: 3,
        event_id: 1,
        position_title: 'Lead Stage & Sound Coordinator',
        description: 'Manages stage equipment, microphone setups, lighting sequences, and audio cues.',
        nomination_open: true,
        voting_open: true,
        is_closed: false,
        elected_winner_id: null
      },
      {
        id: 4,
        event_id: 1,
        position_title: 'Head of Refreshments & Catering',
        description: 'Oversees food vendor selection, hygienic meal distribution, and beverage counters.',
        nomination_open: true,
        voting_open: true,
        is_closed: false,
        elected_winner_id: null
      }
    ],
    nominations: [
      {
        id: 1,
        position_id: 1,
        candidate_id: 1,
        candidate_name: 'Alex Turner',
        nominated_by_id: 1,
        manifesto: 'Committed to flawless execution, transparent financial reporting, and student-first planning.',
        status: 'approved'
      },
      {
        id: 2,
        position_id: 1,
        candidate_id: 2,
        candidate_name: 'Sarah Chen',
        nominated_by_id: 2,
        manifesto: 'Promoting inclusive student participation, sustainability in event logistics, and real-time alerts.',
        status: 'approved'
      },
      {
        id: 3,
        position_id: 2,
        candidate_id: 3,
        candidate_name: 'David Miller',
        nominated_by_id: 1,
        manifesto: 'Experienced with university transport fleet and municipal logistics partnerships.',
        status: 'approved'
      },
      {
        id: 4,
        position_id: 3,
        candidate_id: 5,
        candidate_name: 'Marcus Vance',
        nominated_by_id: 1,
        manifesto: '3 years audio engineer for Campus Radio, zero delay target on stage transitions.',
        status: 'approved'
      }
    ],
    votes: [
      { id: 1, position_id: 1, candidate_id: 1, voter_id: 3 },
      { id: 2, position_id: 1, candidate_id: 2, voter_id: 4 },
      { id: 3, position_id: 1, candidate_id: 2, voter_id: 5 },
      { id: 4, position_id: 2, candidate_id: 3, voter_id: 1 },
      { id: 5, position_id: 3, candidate_id: 5, voter_id: 2 }
    ],
    designs: [
      {
        id: 1,
        event_id: 1,
        designer_id: 4,
        designer_name: 'Elena Rostova',
        title: 'Official Gala Poster - Cyber Minimalist',
        category: 'Poster',
        image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        description: 'High-contrast typography with Royal Blue gradient elements for campus-wide board printing.'
      },
      {
        id: 2,
        event_id: 1,
        designer_id: 4,
        designer_name: 'Elena Rostova',
        title: 'Crew & Volunteer T-Shirt Design - Dark Edition',
        category: 'T-shirt',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        description: 'Cotton crewneck featuring glowing neon UniSphere emblem on back and role identifier on front chest.'
      },
      {
        id: 3,
        event_id: 1,
        designer_id: 4,
        designer_name: 'Elena Rostova',
        title: 'Main Stage Backdrop 3D Render',
        category: 'Stage',
        image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        description: 'Geometric LED truss configuration with ambient backlighting and acoustic wing panels.'
      },
      {
        id: 4,
        event_id: 1,
        designer_id: 4,
        designer_name: 'Elena Rostova',
        title: 'UniSphere Emblem & Social Media Kit',
        category: 'Logo',
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        description: 'Vector SVG logo marks suitable for Instagram avatars, badges, and wristbands.'
      }
    ],
    design_comments: [
      {
        id: 1,
        design_id: 1,
        author_id: 2,
        comment_text: 'The blue accent looks fantastic, but can we increase the font size of the venue name so students can read it from a distance?',
        is_anonymous: true,
        anonymous_alias: 'Anonymous Student #104',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 2,
        design_id: 1,
        author_id: 3,
        comment_text: 'Very modern design! Perfect for digital banners as well.',
        is_anonymous: true,
        anonymous_alias: 'Anonymous Student #218',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 3,
        design_id: 2,
        author_id: 5,
        comment_text: 'Dark fabric will be much easier for the backstage sound team since white shirts reflect stage lights.',
        is_anonymous: true,
        anonymous_alias: 'Anonymous Student #349',
        created_at: new Date(Date.now() - 3600000 * 1).toISOString()
      }
    ],
    contacts: [
      {
        id: 1,
        event_id: 1,
        name: 'Metro City Coach Services',
        phone: '+1 (555) 234-8899',
        email: 'charters@metrocoach.com',
        category: 'Transportation',
        notes: 'Provides 40-seater university shuttle buses. Contract negotiated at 15% student discount.',
        is_valuable: true
      },
      {
        id: 2,
        event_id: 1,
        name: 'Campus Harmony Musical Circle',
        phone: '+1 (555) 890-1234',
        email: 'music.circle@university.edu',
        category: 'Music Circle',
        notes: 'Lead contact: Julian (Violinist & Sound Engineer). Bringing acoustic amps and cables.',
        is_valuable: true
      },
      {
        id: 3,
        event_id: 1,
        name: 'Royal Heritage Costume Rentals',
        phone: '+1 (555) 441-7722',
        email: 'rentals@royalheritage.org',
        category: 'Costume Rental',
        notes: 'Reserved 24 period drama costumes and 8 dance cloaks. Return deadline: Nov 17.',
        is_valuable: true
      },
      {
        id: 4,
        event_id: 1,
        name: 'Campus Dining & Refreshment Services',
        phone: '+1 (555) 555-0144',
        email: 'catering@unisphere.edu',
        category: 'Refreshments',
        notes: 'Providing 500 meal boxes, iced coolers, and coffee stations across 3 venues.',
        is_valuable: false
      },
      {
        id: 5,
        event_id: 1,
        name: 'David Miller (Transportation Coordinator)',
        phone: '+1 (555) 782-3490',
        email: 'transport@unisphere.edu',
        category: 'Coordinator',
        notes: 'Head coordinator for transit and parking permit distribution.',
        is_valuable: true
      },
      {
        id: 6,
        event_id: 1,
        name: 'Priya Sharma (Refreshment Coordinator)',
        phone: '+1 (555) 612-4932',
        email: 'refreshments@unisphere.edu',
        category: 'Coordinator',
        notes: 'Manages food hygiene, vendor vouchers, and emergency water refills.',
        is_valuable: true
      },
      {
        id: 7,
        event_id: 1,
        name: 'StagePro Audio & Lighting Rentals',
        phone: '+1 (555) 302-9988',
        email: 'gear@stagepro.live',
        category: 'Technical/AV',
        notes: 'Supplying 4 wireless mics, stage smoke machine, and mixer console.',
        is_valuable: false
      }
    ],
    tasks: [
      {
        id: 1,
        event_id: 1,
        title: 'Finalize Shuttle Bus Route & Parking Permits',
        description: 'Confirm timetable with Metro City Coach and submit clearance request to University Campus Security.',
        assigned_to_user_id: 3,
        assigned_to_name: 'David Miller',
        status: 'done',
        priority: 'high',
        due_date: '2026-11-02',
        category: 'Transportation'
      },
      {
        id: 2,
        event_id: 1,
        title: 'Inspect Sound Console & Microphones in Main Hall',
        description: 'Test wireless transmitter batteries, eliminate feedback on stage monitors, and calibrate EQ levels.',
        assigned_to_user_id: 5,
        assigned_to_name: 'Marcus Vance',
        status: 'in_progress',
        priority: 'urgent',
        due_date: '2026-11-08',
        category: 'Stage & Sound'
      },
      {
        id: 3,
        event_id: 1,
        title: 'Collect and Label Borrowed Costumes from Royal Rentals',
        description: 'Itemize all 24 costumes in the Lending Tracker with student borrower names and phone numbers.',
        assigned_to_user_id: 1,
        assigned_to_name: 'Alex Turner',
        status: 'in_progress',
        priority: 'high',
        due_date: '2026-11-10',
        category: 'Costumes'
      },
      {
        id: 4,
        event_id: 1,
        title: 'Print Event Posters & Distribute to Notice Boards',
        description: 'Print 150 A3 color copies and pin them in Faculty of Science, Engineering Quad, and Student Union.',
        assigned_to_user_id: 4,
        assigned_to_name: 'Elena Rostova',
        status: 'done',
        priority: 'medium',
        due_date: '2026-11-05',
        category: 'Media & Design'
      },
      {
        id: 5,
        event_id: 1,
        title: 'Assemble 500 Welcome Badges & Lanyards',
        description: 'Package VIP attendee tags and color-coded wristbands for security checkpoints.',
        assigned_to_user_id: 2,
        assigned_to_name: 'Sarah Chen',
        status: 'todo',
        priority: 'medium',
        due_date: '2026-11-12',
        category: 'Logistics'
      },
      {
        id: 6,
        event_id: 1,
        title: 'Confirm Vegetarian & Halal Dietary Ratios with Caterer',
        description: 'Verify 200 veg boxes and 300 non-veg meals with Priya Sharma and supplier.',
        assigned_to_user_id: 6,
        assigned_to_name: 'Priya Sharma',
        status: 'todo',
        priority: 'medium',
        due_date: '2026-11-11',
        category: 'Refreshments'
      }
    ],
    budget_allocations: [
      { id: 1, event_id: 1, category: 'Stage & Sound', allocated_amount: 14000 },
      { id: 2, event_id: 1, category: 'Refreshments & Catering', allocated_amount: 12000 },
      { id: 3, event_id: 1, category: 'Transportation & Logistics', allocated_amount: 8000 },
      { id: 4, event_id: 1, category: 'Costumes & Props', allocated_amount: 5000 },
      { id: 5, event_id: 1, category: 'Design & Marketing', allocated_amount: 4000 },
      { id: 6, event_id: 1, category: 'Contingency / Emergency', allocated_amount: 2000 }
    ],
    expenses: [
      {
        id: 1,
        event_id: 1,
        category: 'Stage & Sound',
        title: 'Audio Line-Array Speaker Rental Deposit',
        amount: 8500,
        expense_date: '2026-10-24',
        recorded_by_name: 'Marcus Vance',
        receipt_note: 'Paid to StagePro AV Services. Receipt #SP-9921'
      },
      {
        id: 2,
        event_id: 1,
        category: 'Refreshments & Catering',
        title: 'Catering Advance for 500 Lunch Packs',
        amount: 6000,
        expense_date: '2026-10-25',
        recorded_by_name: 'Priya Sharma',
        receipt_note: 'Bank transfer to University Hospitality Board.'
      },
      {
        id: 3,
        event_id: 1,
        category: 'Transportation & Logistics',
        title: 'Metro Coach Shuttle Fleet Booking',
        amount: 5200,
        expense_date: '2026-10-26',
        recorded_by_name: 'David Miller',
        receipt_note: '4 buses for 12 hours. Fuel surcharge included.'
      },
      {
        id: 4,
        event_id: 1,
        category: 'Design & Marketing',
        title: 'Vinyl Stage Backdrop and 150 A3 Posters',
        amount: 2800,
        expense_date: '2026-10-25',
        recorded_by_name: 'Elena Rostova',
        receipt_note: 'QuickPrint Campus Store invoice #QP-4402'
      },
      {
        id: 5,
        event_id: 1,
        category: 'Costumes & Props',
        title: 'Royal Heritage Drama Costume Security Deposit',
        amount: 3200,
        expense_date: '2026-10-26',
        recorded_by_name: 'Alex Turner',
        receipt_note: 'Rental agreement receipt #RH-1823'
      }
    ],
    live_agenda_items: [
      {
        id: 1,
        event_id: 1,
        order_index: 1,
        title: 'Welcoming & National Anthem',
        performer_speaker: 'Campus Choir & Student President',
        scheduled_time: '09:00 AM',
        duration_minutes: 20,
        status: 'completed',
        delay_minutes: 0,
        notes: 'Completed right on time. Standing ovation.'
      },
      {
        id: 2,
        event_id: 1,
        order_index: 2,
        title: 'Keynote: Artificial Intelligence in 2030',
        performer_speaker: 'Dr. Evelyn Martinez (Guest Scientist)',
        scheduled_time: '09:30 AM',
        duration_minutes: 45,
        status: 'now_performing',
        delay_minutes: 0,
        notes: 'Currently presenting slide 14 on quantum neural networks.'
      },
      {
        id: 3,
        event_id: 1,
        order_index: 3,
        title: 'Robotics Demo & Drone Formation Flight',
        performer_speaker: 'RoboKnights Club',
        scheduled_time: '10:30 AM',
        duration_minutes: 30,
        status: 'upcoming',
        delay_minutes: 0,
        notes: 'Pre-flight check in progress at North staging area.'
      },
      {
        id: 4,
        event_id: 1,
        order_index: 4,
        title: 'Inter-College Drama: The Echoes of Time',
        performer_speaker: 'Drama Guild & Musical Circle',
        scheduled_time: '11:15 AM',
        duration_minutes: 60,
        status: 'upcoming',
        delay_minutes: 10,
        notes: 'Pushed by 10 minutes to allow backstage costume changes.'
      },
      {
        id: 5,
        event_id: 1,
        order_index: 5,
        title: 'Battle of the University Bands',
        performer_speaker: 'Acoustic Waves, Red Shift & Neon Groove',
        scheduled_time: '01:00 PM',
        duration_minutes: 90,
        status: 'upcoming',
        delay_minutes: 0,
        notes: 'Sound check scheduled at 12:45 PM.'
      }
    ],
    lost_found_items: [
      {
        id: 1,
        event_id: 1,
        type: 'lost',
        title: 'Black Leather Student Card Holder with Uni ID',
        description: 'Contains University Student ID for Sarah Chen and transit pass. Last seen near Main Auditorium Row G.',
        location: 'Main Auditorium Row G',
        collection_point: 'Return to Security Desk or Call Sarah',
        contact_info: '+1 (555) 438-9102',
        item_date: '2026-10-26',
        image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=80',
        status: 'open',
        posted_by_name: 'Sarah Chen'
      },
      {
        id: 2,
        event_id: 1,
        type: 'found',
        title: 'Sony Wireless Over-Ear Headphones (Silver)',
        description: 'Found on the bench outside Central Dining Hall after lunch session. In a black protective case.',
        location: 'Central Dining Court Bench',
        collection_point: 'UniSphere Helpdesk Desk 2',
        contact_info: 'helpdesk@unisphere.edu / Desk 2',
        item_date: '2026-10-27',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        status: 'open',
        posted_by_name: 'Marcus Vance'
      },
      {
        id: 3,
        event_id: 1,
        type: 'lost',
        title: 'Canon 50mm f/1.8 Camera Lens in Pouch',
        description: 'Fell out of photographer bag during opening ceremony. Has yellow label "Media Team".',
        location: 'North Lawn Photo Booth',
        collection_point: 'Media & Branding Room 102',
        contact_info: '+1 (555) 901-2384',
        item_date: '2026-10-25',
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80',
        status: 'resolved',
        posted_by_name: 'Elena Rostova'
      }
    ],
    lent_items: [
      {
        id: 1,
        event_id: 1,
        item_name: 'Victorian Embroidered Velvet Coat (Size M)',
        category: 'Costume',
        borrower_name: 'Liam Neeson (Drama Lead)',
        borrower_phone: '+1 (555) 819-2044',
        borrowed_date: '2026-10-25',
        expected_return_date: '2026-11-16',
        is_returned: false,
        notes: 'Borrowed for Act 2 of Drama. In pristine condition.'
      },
      {
        id: 2,
        event_id: 1,
        item_name: 'Shure Wireless Lapel Microphone Kit #4',
        category: 'AV Equipment',
        borrower_name: 'Marcus Vance',
        borrower_phone: '+1 (555) 349-8210',
        borrowed_date: '2026-10-26',
        expected_return_date: '2026-11-15',
        is_returned: false,
        notes: 'Assigned to Guest Keynote speaker.'
      },
      {
        id: 3,
        event_id: 1,
        item_name: 'Gold Classical Acoustic Guitar & Hard Case',
        category: 'Musical Instrument',
        borrower_name: 'Julian (Music Circle)',
        borrower_phone: '+1 (555) 890-1234',
        borrowed_date: '2026-10-24',
        expected_return_date: '2026-10-26',
        is_returned: true,
        notes: 'Returned on time and verified by stage team.'
      }
    ],
    notifications: [
      {
        id: 1,
        event_id: 1,
        user_id: null,
        title: 'Live Agenda Alert: Keynote is Now Performing!',
        message: 'Dr. Evelyn Martinez is currently speaking on Main Stage. Head over to Auditorium.',
        type: 'agenda',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        event_id: 1,
        user_id: null,
        title: 'New Committee Nomination Open',
        message: 'Voting is active for OC President and Stage Coordinator. Cast your vote now!',
        type: 'election',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 3,
        event_id: 1,
        user_id: null,
        title: 'Design Proposal Feedback Requested',
        message: 'Elena Rostova uploaded 4 new design concepts. Comment anonymously to give your thoughts.',
        type: 'design',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 4,
        event_id: 1,
        user_id: null,
        title: 'Transportation Shuttle Schedule Confirmed',
        message: 'Campus buses will run every 20 minutes between North Gate and Main Auditorium.',
        type: 'schedule',
        is_read: true,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ]
  };
};

// Initialize file store if not present
if (!fs.existsSync(STORE_FILE)) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(getInitialSeed(), null, 2), 'utf8');
}

function readStore() {
  try {
    const data = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading store.json, re-initializing...', err);
    const initial = getInitialSeed();
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT || 3306;
  const database = process.env.DB_NAME || 'unisphere_db';

  try {
    console.log(`[UniSphere DB] Testing MySQL connection to ${user}@${host}:${port}...`);
    const tempConn = await mysql.createConnection({ host, user, password, port });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4;`);
    await tempConn.end();

    mysqlPool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const [rows] = await mysqlPool.query('SELECT 1 as connected');
    if (rows && rows[0]?.connected === 1) {
      useMySQL = true;
      console.log(`[UniSphere DB] MySQL successfully connected and active on database "${database}"!`);
    }
  } catch (err) {
    console.log(`[UniSphere DB] MySQL connection not established (${err.message}).`);
    console.log(`[UniSphere DB] Activating high-speed persistent JSON fallback store at "${STORE_FILE}". All features are fully functional!`);
    useMySQL = false;
  }
}

module.exports = {
  initDB,
  isUsingMySQL: () => useMySQL,
  getStore: readStore,
  saveStore: writeStore,
  getPool: () => mysqlPool
};
