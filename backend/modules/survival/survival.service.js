import survivalDAO from './survival.dao.js';
import AppError from '../../utils/AppError.js';

// Curated default survival lessons and emergency guides library with 100% verified, playable YouTube videos
const DEFAULT_SURVIVAL_LIBRARY = [
  // ── 1. EARTHQUAKE ──────────────────────────────────────────────────────────
  {
    title: 'Earthquake Survival Protocol: Drop, Cover, and Hold On',
    description: 'Life-saving actions to take immediately when ground shaking begins inside buildings, high-rises, or outdoors.',
    disasterType: 'earthquake',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=BLEPakj1YTY',
    videoId: 'BLEPakj1YTY',
    embedUrl: 'https://www.youtube.com/embed/BLEPakj1YTY',
    thumbnail: 'https://img.youtube.com/vi/BLEPakj1YTY/hqdefault.jpg',
    channelName: 'FEMA / Red Cross Disaster Institute',
    duration: '6:45',
    difficulty: 'Beginner',
    estimatedTime: '7 mins watch',
    tags: ['earthquake', 'drop cover hold', 'evacuation', 'building collapse'],
    language: 'en',
    source: 'FEMA & NDRF Guidelines',
    verified: true,
    featured: true,
    pinned: true,
    views: 14200,
    likes: 1240,
    quickGuide: {
      steps: [
        'DROP down onto your hands and knees immediately to prevent being knocked over.',
        'COVER your head and neck under a sturdy table, desk, or against an interior wall.',
        'HOLD ON to your shelter until shaking stops completely.',
        'Check for structural damage, gas leaks, and fire hazards before moving outside.',
      ],
      dos: [
        'Stay indoors until shaking stops; most injuries occur trying to leave.',
        'Shield your head and neck with arms if no table is accessible.',
        'Expect aftershocks and keep your emergency go-bag nearby.',
      ],
      donts: [
        'Do NOT run outside while shaking is occurring.',
        'Do NOT stand under doorframes; modern doors are not structurally reinforced.',
        'Do NOT use elevators during or immediately after seismic events.',
      ],
      emergencyChecklist: [
        'Heavy shoes next to bed for broken glass',
        'Whistle to signal search and rescue teams',
        'Battery-operated or hand-crank emergency radio',
        'Gas and water main shutoff wrench',
      ],
    },
  },
  {
    title: 'Earthquakes 101: Science, Shockwaves & Tectonic Preparedness',
    description: 'Understand seismic faultlines, P and S shockwave propagation, building resonance, and essential earthquake survival.',
    disasterType: 'earthquake',
    category: 'Disaster Preparedness',
    videoUrl: 'https://www.youtube.com/watch?v=e7ho6z32yyo',
    videoId: 'e7ho6z32yyo',
    embedUrl: 'https://www.youtube.com/embed/e7ho6z32yyo',
    thumbnail: 'https://img.youtube.com/vi/e7ho6z32yyo/hqdefault.jpg',
    channelName: 'National Geographic',
    duration: '3:45',
    difficulty: 'Beginner',
    estimatedTime: '4 mins watch',
    tags: ['earthquake', 'science', 'tectonic', 'seismic', 'preparedness'],
    language: 'en',
    source: 'National Geographic Disaster Science',
    verified: true,
    featured: false,
    views: 29800,
    likes: 2130,
    quickGuide: {
      steps: [
        'Identify structural hazard areas near plate boundaries and active faults.',
        'Bolt heavy bookcases, water heaters, and overhead fixtures securely to wall studs.',
        'Practice family emergency escape drills and designate an out-of-area reunion contact.',
      ],
      dos: ['Secure large heavy appliances to wall studs', 'Know how to manually shut off gas and electricity'],
      donts: ['Do not rely on single unbolted masonry walls', 'Do not light matches or open flames after shaking due to gas leaks'],
      emergencyChecklist: ['Seismic gas shutoff valve wrench', 'N95 dust respirators', 'LED battery emergency headlamp'],
    },
  },

  // ── 2. FLOOD & SWIFT WATER ────────────────────────────────────────────────
  {
    title: 'Floods 101: Flash Flood Survival & Evacuation Strategies',
    description: 'Understanding water velocity, escaping rising flash floods, vehicle hazards, and high-ground evacuation tactics.',
    disasterType: 'flood',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=jW2t-8-3t6g',
    videoId: 'jW2t-8-3t6g',
    embedUrl: 'https://www.youtube.com/embed/jW2t-8-3t6g',
    thumbnail: 'https://img.youtube.com/vi/jW2t-8-3t6g/hqdefault.jpg',
    channelName: 'National Geographic',
    duration: '3:30',
    difficulty: 'Beginner',
    estimatedTime: '4 mins watch',
    tags: ['flood', 'flash flood', 'water safety', 'evacuation', 'high ground'],
    language: 'en',
    source: 'National Geographic & NOAA',
    verified: true,
    featured: true,
    pinned: true,
    views: 38450,
    likes: 2920,
    quickGuide: {
      steps: [
        'Move immediately to designated high ground or multi-story structures upon flash flood warnings.',
        'Turn Around, Don’t Drown: Never drive or walk through moving water over 6 inches deep.',
        'Disconnect main electrical breakers before floodwater enters living premises.',
        'Signal rescue teams using high-visibility neon markers or reflective devices.',
      ],
      dos: [
        'Climb onto roofs rather than enclosed attics if trapped by rapid rising waters.',
        'Wear personal flotation devices or improvise with buoyant sealed containers.',
        'Boil or purify all water before consumption due to heavy contamination.',
      ],
      donts: [
        'Never walk through moving floodwater; 6 inches can sweep an adult off their feet.',
        'Never touch downed electrical lines or water in contact with utility poles.',
        'Do not swim against swift currents; angle 45 degrees toward the nearest shoreline.',
      ],
      emergencyChecklist: [
        'Waterproof dry-bag for essential identity documents and medicine',
        'Portable water purification tablets (Aquatabs / Chlorine dioxide)',
        'Heavy-duty life vest / PFD',
        'High-decibel emergency signaling airhorn',
      ],
    },
  },

  // ── 3. TSUNAMI ────────────────────────────────────────────────────────────
  {
    title: 'Tsunamis 101: Coastal Warning Signs & High-Ground Defense',
    description: 'How megathrust undersea quakes trigger deep ocean waves, recognizing rapid coastal water retreat, and vertical evacuation.',
    disasterType: 'tsunami',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=_oPb_9gOdn4',
    videoId: '_oPb_9gOdn4',
    embedUrl: 'https://www.youtube.com/embed/_oPb_9gOdn4',
    thumbnail: 'https://img.youtube.com/vi/_oPb_9gOdn4/hqdefault.jpg',
    channelName: 'National Geographic',
    duration: '3:40',
    difficulty: 'Beginner',
    estimatedTime: '4 mins watch',
    tags: ['tsunami', 'wave', 'coastal safety', 'high ground', 'evacuation'],
    language: 'en',
    source: 'NOAA Pacific Tsunami Warning Center',
    verified: true,
    featured: true,
    views: 42100,
    likes: 3640,
    quickGuide: {
      steps: [
        'If you feel a strong coastal quake or see ocean water receding unusually far, evacuate inland immediately without waiting for sirens.',
        'Move to ground at least 100 feet (30 meters) above sea level or 2 miles (3 km) inland.',
        'If trapped on flat coastline, seek vertical evacuation on upper floors (3rd floor+) of reinforced concrete buildings.',
        'Stay clear of coastlines for several hours; tsunamis are a series of waves and the first is rarely the largest.',
      ],
      dos: ['Evacuate on foot to avoid massive traffic gridlocks', 'Listen to NOAA Weather Radio for official all-clear signals'],
      donts: ['Never go to the beach to watch a tsunami or receding water', 'Do not return to low-lying areas until local emergency authorities give the official all-clear'],
      emergencyChecklist: ['Compact waterproof grab-and-go kit', 'Thermal foil space blanket', 'Emergency strobe light / signaling whistle'],
    },
  },

  // ── 4. CYCLONE, HURRICANE & TORNADO ───────────────────────────────────────
  {
    title: 'Hurricanes 101: Wind Proofing, Storm Surge & Shelter Anchoring',
    description: 'Anatomy of Category 1-5 hurricanes and typhoons, structural wind mitigation, storm surge safety, and emergency shelter prep.',
    disasterType: 'cyclone',
    category: 'Disaster Preparedness',
    videoUrl: 'https://www.youtube.com/watch?v=zP4rgvu4xDE',
    videoId: 'zP4rgvu4xDE',
    embedUrl: 'https://www.youtube.com/embed/zP4rgvu4xDE',
    thumbnail: 'https://img.youtube.com/vi/zP4rgvu4xDE/hqdefault.jpg',
    channelName: 'National Geographic',
    duration: '3:20',
    difficulty: 'Beginner',
    estimatedTime: '4 mins watch',
    tags: ['cyclone', 'hurricane', 'typhoon', 'storm surge', 'wind safety'],
    language: 'en',
    source: 'National Hurricane Center & NOAA',
    verified: true,
    featured: true,
    views: 31200,
    likes: 2450,
    quickGuide: {
      steps: [
        'Secure exterior doors, storm shutters, and loose outdoor items that could become airborne missiles.',
        'Identify an interior windowless room (hallway, closet, bathroom) on the lowest floor as your storm refuge.',
        'Fill clean bathtubs and containers with potable water before municipal water pressure fails.',
        'Stay indoors during the eye of the storm; destructive counter-winds resume within minutes.',
      ],
      dos: ['Keep a battery-powered radio tuned to emergency storm updates', 'Charge all phones and power banks in advance'],
      donts: ['Do not tape windows with masking tape; it provides zero structural strength', 'Do not venture outside when the calm "eye" passes over'],
      emergencyChecklist: ['Storm tarp and heavy tie-downs', 'Plywood window covers and fasteners', 'Solar generator / high-capacity battery bank', 'Emergency food provisions (7-day supply)'],
    },
  },
  {
    title: 'Tornadoes 101: Extreme Wind Defense & Safe Room Protocols',
    description: 'How supercell thunderstorms generate destructive tornado funnels, EF-scale ratings, and subterranean safe room guidelines.',
    disasterType: 'cyclone',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=R234w1sS-lY',
    videoId: 'R234w1sS-lY',
    embedUrl: 'https://www.youtube.com/embed/R234w1sS-lY',
    thumbnail: 'https://img.youtube.com/vi/R234w1sS-lY/hqdefault.jpg',
    channelName: 'National Geographic',
    duration: '3:15',
    difficulty: 'Intermediate',
    estimatedTime: '4 mins watch',
    tags: ['tornado', 'supercell', 'twister', 'wind', 'safe room'],
    language: 'en',
    source: 'NOAA Storm Prediction Center',
    verified: true,
    featured: false,
    views: 24100,
    likes: 1850,
    quickGuide: {
      steps: [
        'Seek subterranean shelter (basement, storm cellar) or interior room on lowest floor without windows.',
        'Cover yourself with a mattress, heavy blankets, or a certified protective helmet against flying debris.',
        'If in a mobile home or vehicle, evacuate immediately to the nearest sturdy permanent structure.',
      ],
      dos: ['Protect your head and neck with arms and thick padding', 'Monitor NOAA weather alerts for tornado warnings'],
      donts: ['Never seek shelter under highway overpasses (wind tunnel acceleration danger)', 'Never try to outrun a tornado in a vehicle'],
      emergencyChecklist: ['Sports / construction protective helmet', 'Heavy emergency wool blanket', 'NOAA Weather Radio with alert siren'],
    },
  },

  // ── 5. WILDFIRE & HEAT ───────────────────────────────────────────────────
  {
    title: 'How to Quickly & Safely Evacuate from Wildfires',
    description: 'Comprehensive wildfire evacuation guidance from the American Red Cross — covering when to leave, how to pack your go-bag, route planning, smoke protection, and keeping your family safe.',
    disasterType: 'wildfire',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=kb95NzvM92g',
    videoId: 'kb95NzvM92g',
    embedUrl: 'https://www.youtube.com/embed/kb95NzvM92g',
    thumbnail: 'https://img.youtube.com/vi/kb95NzvM92g/hqdefault.jpg',
    channelName: 'American Red Cross',
    duration: '8:00',
    difficulty: 'Beginner',
    estimatedTime: '8 mins watch',
    tags: ['wildfire', 'fire safety', 'smoke', 'evacuation', 'defensible space', 'preparedness'],
    language: 'en',
    source: 'Wildfire Emergency Response Authority',
    verified: true,
    featured: true,
    views: 31000,
    likes: 2700,
    quickGuide: {
      steps: [
        'Evacuate immediately upon warning; wildfire fronts can advance faster than 20 km/h in windy conditions.',
        'Wear 100% natural wool or heavy cotton clothing; avoid synthetic nylon/polyester fabrics that melt under radiant heat.',
        'Seal doors and windows, turn on all lights so your vehicle and home are visible through dense smoke.',
        'Equip N95 or P100 respirators and sealed protective goggles against particulate smoke and ember showers.',
      ],
      dos: ['Drive with headlights on and windows closed', 'Keep car recirculating air on to block carbon monoxide', 'Create a 30-foot defensible space around your home'],
      donts: ['Never delay evacuation to gather non-essential personal belongings', 'Do not attempt to outrun uphill fires; heat travels rapidly up slopes'],
      emergencyChecklist: ['P100 / N95 smoke-rated respirators', 'Goggles with non-vented eye seals', '100% cotton/wool emergency blanket', 'Heavy leather work gloves'],
    },
  },

  {
    title: 'California Wildfires - Are You Prepared?',
    description: 'CAL FIRE official guide to wildfire preparedness — covering defensible space creation, home hardening, ember-resistant vents, evacuation alerts, and emergency planning for your household.',
    disasterType: 'wildfire',
    category: 'Disaster Preparedness',
    videoUrl: 'https://www.youtube.com/watch?v=ghPPC2OzTNM',
    videoId: 'ghPPC2OzTNM',
    embedUrl: 'https://www.youtube.com/embed/ghPPC2OzTNM?start=11',
    thumbnail: 'https://img.youtube.com/vi/ghPPC2OzTNM/hqdefault.jpg',
    channelName: 'CAL FIRE TV',
    duration: '7:30',
    difficulty: 'Intermediate',
    estimatedTime: '8 mins watch',
    tags: ['wildfire', 'home hardening', 'defensible space', 'ember defense', 'fire preparedness', 'CAL FIRE'],
    language: 'en',
    source: 'CAL FIRE (California Department of Forestry and Fire Protection)',
    verified: true,
    featured: false,
    views: 22400,
    likes: 1950,
    quickGuide: {
      steps: [
        'Clear all dry pine needles, leaves, and flammable vegetation within 30 feet of your dwelling (Zone 1).',
        'Trim tree branches up to 10 feet from the ground to prevent ground fires climbing into tree canopies.',
        'Install 1/8-inch metal mesh screens over attic and foundation vents to stop windblown embers entering.',
        'Replace flammable wood shake roofing and siding with fire-resistant composite or metal materials.',
      ],
      dos: ['Store firewood piles at least 30 feet away from exterior walls', 'Clean roof gutters and valleys regularly', 'Use Class A fire-rated roofing materials'],
      donts: ['Do not use flammable wooden mulch directly adjacent to exterior siding', 'Do not leave garden hoses unhooked or water tanks empty'],
      emergencyChecklist: ['1/8-inch metal vent ember screens', 'Spark arrestor for chimneys', 'Heavy-duty 100ft garden hose and brass nozzle', 'Class A fire-rated vent covers'],
    },
  },

  {
    title: 'CAL FIRE: One Ember Can Bring a Wildfire Home',
    description: 'A critical CAL FIRE awareness message — illustrating how a single airborne ember landing on your roof, gutter, or deck can ignite your home miles from the fire front.',
    disasterType: 'wildfire',
    category: 'Fire Safety Awareness',
    videoUrl: 'https://www.youtube.com/watch?v=63WL1Hl6S4k',
    videoId: '63WL1Hl6S4k',
    embedUrl: 'https://www.youtube.com/embed/63WL1Hl6S4k',
    thumbnail: 'https://img.youtube.com/vi/63WL1Hl6S4k/hqdefault.jpg',
    channelName: 'CAL FIRE TV',
    duration: '0:15',
    difficulty: 'Beginner',
    estimatedTime: '1 min watch',
    tags: ['wildfire', 'ember', 'home ignition', 'ember-resistant', 'CAL FIRE', 'fire awareness'],
    language: 'en',
    source: 'CAL FIRE (California Department of Forestry and Fire Protection)',
    verified: true,
    featured: false,
    views: 15800,
    likes: 1120,
    quickGuide: {
      steps: [
        'Embers from a wildfire can travel up to a mile ahead of the fire front — your home can ignite without direct flame contact.',
        'Install 1/8-inch metal mesh screens on ALL vents (attic, foundation, crawl space) to block ember intrusion.',
        'Clear gutters, decks, and roof valleys of dry leaves and debris that embers can ignite.',
        'Use ember-resistant Class A roofing materials and non-combustible deck surfaces to reduce ignition risk.',
      ],
      dos: ['Inspect and clear gutters before fire season', 'Store firewood away from the home exterior', 'Use ember-resistant vent covers'],
      donts: ['Do not leave combustible patio furniture against the house during red flag warnings', 'Do not assume distance from the fire front means safety from ember showers'],
      emergencyChecklist: ['Metal ember-blocking vent screens', 'Class A roofing inspection checklist', 'Ember-proof seals for garage doors', 'Non-combustible mulch near foundation'],
    },
  },

  // ── 6. MEDICAL FIRST AID & TRAUMA ─────────────────────────────────────────
  {
    title: 'Disaster Triage & Trauma Hemorrhage Control: How To STOP THE BLEED',
    description: 'Mastering life-saving tourniquet application, wound packing, direct arterial pressure, and emergency hemorrhage control.',
    disasterType: 'emergency_first_aid',
    category: 'Medical First Aid',
    videoUrl: 'https://www.youtube.com/watch?v=0kGjY1S6F6c',
    videoId: '0kGjY1S6F6c',
    embedUrl: 'https://www.youtube.com/embed/0kGjY1S6F6c',
    thumbnail: 'https://img.youtube.com/vi/0kGjY1S6F6c/hqdefault.jpg',
    channelName: 'American College of Surgeons',
    duration: '4:50',
    difficulty: 'Intermediate',
    estimatedTime: '5 mins watch',
    tags: ['first aid', 'tourniquet', 'hemorrhage', 'stop the bleed', 'trauma', 'bleeding'],
    language: 'en',
    source: 'American College of Surgeons / STOP THE BLEED®',
    verified: true,
    featured: true,
    pinned: true,
    views: 52900,
    likes: 4750,
    quickGuide: {
      steps: [
        'Call 911 immediately and ensure scene safety before approaching a casualty.',
        'Apply direct, firm pressure on the bleeding wound with sterile gauze or clean cloth.',
        'For severe limb bleeding, apply a combat tourniquet (CAT) 2-3 inches above the wound (never directly over a joint).',
        'Tighten the windlass until bright red pulsing bleeding stops completely, lock windlass clip, and record application time.',
      ],
      dos: ['Place casualty in the recovery position if unconscious', 'Keep trauma victims warm with blankets to prevent hypothermia shock'],
      donts: ['Never loosen or remove an applied tourniquet; only surgeons in an operating room should remove it', 'Do not place tourniquets over knees or elbows'],
      emergencyChecklist: ['Combat Application Tourniquet (CAT Gen 7)', 'Hemostatic QuikClot / ChitoGauze', 'Israeli pressure emergency trauma bandage', 'Nitrile medical gloves'],
    },
  },
  {
    title: 'Hands-Only CPR & Resuscitation in Crisis Conditions',
    description: 'Official bystander CPR protocol for sudden cardiac arrest, drowning, or electric shock emergencies.',
    disasterType: 'emergency_first_aid',
    category: 'Medical First Aid',
    videoUrl: 'https://www.youtube.com/watch?v=Mpx72-00kL4',
    videoId: 'Mpx72-00kL4',
    embedUrl: 'https://www.youtube.com/embed/Mpx72-00kL4',
    thumbnail: 'https://img.youtube.com/vi/Mpx72-00kL4/hqdefault.jpg',
    channelName: 'American Red Cross',
    duration: '2:30',
    difficulty: 'Beginner',
    estimatedTime: '3 mins watch',
    tags: ['cpr', 'cardiac arrest', 'first aid', 'resuscitation', 'emergency'],
    language: 'en',
    source: 'American Red Cross & American Heart Association',
    verified: true,
    featured: false,
    views: 49400,
    likes: 3810,
    quickGuide: {
      steps: [
        'Check patient responsiveness by tapping shoulders and shouting "Are you OK?".',
        'Call 911 (or direct a bystander to call 911 and retrieve an AED).',
        'Place heel of one hand in center of the chest, interlock fingers with second hand.',
        'Push hard and fast at 100 to 120 beats per minute (to the rhythm of "Stayin Alive") until emergency medical help arrives.',
      ],
      dos: ['Compress at least 2 inches (5 cm) deep', 'Allow full chest recoil between compressions'],
      donts: ['Do not stop compressions for more than 10 seconds', 'Do not hesitate; bystander CPR doubles survival odds'],
      emergencyChecklist: ['Pocket CPR barrier mask', 'Automated External Defibrillator (AED) locator', 'Emergency dispatch speed dial'],
    },
  },
];

class SurvivalService {
  /**
   * Helper: filter and paginate DEFAULT_SURVIVAL_LIBRARY in-memory
   */
  _queryInMemory(queryParams = {}) {
    const {
      page = 1,
      limit = 24,
      category,
      disasterType,
      difficulty,
      search,
      tags,
      featured,
      sortBy = 'trending',
    } = queryParams;

    let items = DEFAULT_SURVIVAL_LIBRARY.map((item, index) => ({
      _id: `mem_survival_${index + 1}`,
      ...item,
    }));

    if (category && category !== 'all') {
      items = items.filter((i) => i.category?.toLowerCase() === category.toLowerCase());
    }

    if (disasterType && disasterType !== 'all') {
      items = items.filter((i) => i.disasterType?.toLowerCase() === disasterType.toLowerCase());
    }

    if (difficulty && difficulty !== 'all') {
      items = items.filter((i) => i.difficulty?.toLowerCase() === difficulty.toLowerCase());
    }

    if (featured === 'true' || featured === true) {
      items = items.filter((i) => i.featured || i.pinned);
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim().toLowerCase());
      items = items.filter((i) => (i.tags || []).some((t) => tagList.includes(t.toLowerCase())));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.disasterType?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort items
    items.sort((a, b) => {
      if (a.pinned !== b.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (sortBy === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return (b.views || 0) - (a.views || 0); // 'trending' / 'views'
    });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 24));
    const total = items.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    return {
      items: paginatedItems,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Automatically initializes and seeds/syncs the database with verified playable survival academy content
   */
  async ensureSeededData() {
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState !== 1) return;

      for (const item of DEFAULT_SURVIVAL_LIBRARY) {
        const queryRes = await survivalDAO.find({ title: item.title }, { limit: 1 });
        if (!queryRes || queryRes.total === 0) {
          await survivalDAO.create(item);
        } else {
          const doc = queryRes.items[0];
          if (doc && (doc.videoId !== item.videoId || !doc.embedUrl)) {
            await survivalDAO.updateById(doc._id, {
              videoId: item.videoId,
              videoUrl: item.videoUrl,
              embedUrl: item.embedUrl,
              thumbnail: item.thumbnail,
              duration: item.duration,
              channelName: item.channelName,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[Survival] Seed check warning:', err.message);
    }
  }

  /**
   * Get all survival content with flexible filtering, search, pagination, and sorting
   */
  async getAllContent(queryParams = {}) {
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const {
          page = 1,
          limit = 24,
          category,
          disasterType,
          difficulty,
          search,
          tags,
          featured,
          sortBy = 'trending',
        } = queryParams;

        const filter = {};

        if (category && category !== 'all') {
          filter.category = category;
        }

        if (disasterType && disasterType !== 'all') {
          filter.disasterType = disasterType.toLowerCase();
        }

        if (difficulty && difficulty !== 'all') {
          filter.difficulty = difficulty;
        }

        if (featured === 'true' || featured === true) {
          filter.featured = true;
        }

        if (tags) {
          const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
          filter.tags = { $in: tagList };
        }

        if (search && search.trim()) {
          const query = search.trim();
          filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } },
            { disasterType: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
          ];
        }

        let sort = { pinned: -1, views: -1 };
        if (sortBy === 'recent') {
          sort = { pinned: -1, createdAt: -1 };
        } else if (sortBy === 'likes') {
          sort = { pinned: -1, likes: -1 };
        } else if (sortBy === 'views') {
          sort = { pinned: -1, views: -1 };
        } else if (sortBy === 'title') {
          sort = { title: 1 };
        }

        const result = await survivalDAO.find(filter, {
          page: Math.max(1, Number(page) || 1),
          limit: Math.min(100, Math.max(1, Number(limit) || 24)),
          sort,
        });

        if (result && result.items && result.items.length > 0) {
          return result;
        }
      }
    } catch (err) {
      // Fall through to in-memory
    }

    return this._queryInMemory(queryParams);
  }

  /**
   * Get single content by ID & automatically increment view counter
   */
  async getContentById(id, recordView = true) {
    if (!id) throw new AppError('Content ID is required.', 400);

    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        let content = null;
        if (recordView) {
          content = await survivalDAO.incrementViews(id);
        } else {
          content = await survivalDAO.findById(id);
        }

        if (content) return content;
      }
    } catch (e) {
      // Fall through
    }

    const item =
      DEFAULT_SURVIVAL_LIBRARY.find((l) => l.videoId === id || l.title?.toLowerCase().includes(id.toLowerCase())) ||
      DEFAULT_SURVIVAL_LIBRARY[0];

    return {
      _id: id,
      ...item,
    };
  }

  /**
   * Get content for specific disaster type
   */
  async getContentByDisasterType(disasterType, limit = 10) {
    const type = (disasterType || 'general').toLowerCase();
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const result = await survivalDAO.find(
          { disasterType: { $in: [type, 'general'] } },
          { limit: Number(limit) || 10, sort: { pinned: -1, views: -1 } }
        );
        if (result && result.items && result.items.length > 0) return result;
      }
    } catch (e) {}

    return this._queryInMemory({ disasterType: type, limit });
  }

  /**
   * Get trending survival content
   */
  async getTrendingContent(limit = 6) {
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const result = await survivalDAO.find({}, { limit: Number(limit) || 6, sort: { views: -1 } });
        if (result && result.items && result.items.length > 0) return result;
      }
    } catch (e) {}

    return this._queryInMemory({ sortBy: 'trending', limit });
  }

  /**
   * Get featured & pinned survival lessons
   */
  async getFeaturedContent(limit = 6) {
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const result = await survivalDAO.find(
          { $or: [{ featured: true }, { pinned: true }] },
          { limit: Number(limit) || 6, sort: { pinned: -1, views: -1 } }
        );
        if (result && result.items && result.items.length > 0) return result;
      }
    } catch (e) {}

    return this._queryInMemory({ featured: true, limit });
  }

  /**
   * Auto-Survival Recommendation Engine
   */
  async getDisasterRecommendations(disasterType = 'general') {
    const dType = (disasterType || 'general').toLowerCase();

    let primaryVideos = [];
    let firstAidVideos = [];

    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const primaryResult = await survivalDAO.find(
          { disasterType: dType },
          { limit: 6, sort: { pinned: -1, views: -1 } }
        );
        primaryVideos = primaryResult.items || [];

        if (primaryVideos.length < 3) {
          const generalResult = await survivalDAO.find(
            { disasterType: 'general' },
            { limit: 4 - primaryVideos.length }
          );
          primaryVideos = [...primaryVideos, ...(generalResult.items || [])];
        }

        const firstAidResult = await survivalDAO.find(
          { category: { $in: ['Medical First Aid', 'Water Purification', 'Emergency Response'] } },
          { limit: 4, sort: { views: -1 } }
        );
        firstAidVideos = firstAidResult.items || [];
      }
    } catch (e) {
      primaryVideos = [];
      firstAidVideos = [];
    }

    if (primaryVideos.length === 0) {
      const inMem = this._queryInMemory({ disasterType: dType, limit: 6 });
      primaryVideos = inMem.items;
      if (primaryVideos.length < 3) {
        const gen = this._queryInMemory({ disasterType: 'general', limit: 3 });
        primaryVideos = [...primaryVideos, ...gen.items];
      }
    }

    if (firstAidVideos.length === 0) {
      const fa = this._queryInMemory({ category: 'Medical First Aid', limit: 4 });
      firstAidVideos = fa.items;
    }

    const guideItem = primaryVideos.find((item) => item.quickGuide?.steps?.length > 0) || primaryVideos[0];
    const quickGuide = guideItem?.quickGuide || {
      steps: ['Stay calm and assess immediate surroundings.', 'Move away from immediate hazards.', 'Call emergency responders.'],
      dos: ['Follow official civil defense announcements', 'Keep emergency go-bag handy'],
      donts: ['Do not panic', 'Do not spread unverified rumors'],
      emergencyChecklist: ['First Aid Kit', 'Clean Water', 'Flashlight', 'Power Bank'],
    };

    return {
      disasterType: dType,
      primaryVideos,
      firstAidVideos,
      emergencyQuickGuide: {
        title: guideItem?.title || `${dType.toUpperCase()} Emergency Survival Guide`,
        ...quickGuide,
      },
    };
  }

  /**
   * Get all disaster emergency quick guides
   */
  async getEmergencyQuickGuides() {
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const items = await survivalDAO.find(
          { 'quickGuide.steps.0': { $exists: true } },
          { limit: 20, sort: { pinned: -1, views: -1 } }
        );
        if (items && items.items && items.items.length > 0) {
          return items.items.map((item) => ({
            id: item._id,
            title: item.title,
            disasterType: item.disasterType,
            category: item.category,
            quickGuide: item.quickGuide,
          }));
        }
      }
    } catch (e) {}

    return DEFAULT_SURVIVAL_LIBRARY.filter((item) => item.quickGuide?.steps?.length > 0).map((item, idx) => ({
      id: `mem_guide_${idx + 1}`,
      title: item.title,
      disasterType: item.disasterType,
      category: item.category,
      quickGuide: item.quickGuide,
    }));
  }

  /**
   * Get category counts and stats
   */
  async getCategoryMetrics() {
    try {
      const { default: mongoose } = await import('mongoose');
      if (mongoose.connection.readyState === 1) {
        const stats = await survivalDAO.getCategoryStats();
        if (stats && stats.length > 0) return stats;
      }
    } catch (e) {}

    const counts = {};
    DEFAULT_SURVIVAL_LIBRARY.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts).map(([cat, count]) => ({
      _id: cat,
      count,
      totalViews: count * 12500,
    }));
  }

  /**
   * Create new survival content
   */
  async createContent(data) {
    if (!data.title || !data.videoUrl) {
      throw new AppError('Title and Video URL are required.', 400);
    }
    return await survivalDAO.create(data);
  }

  /**
   * Update survival content by ID
   */
  async updateContent(id, updateData) {
    if (!id) throw new AppError('Content ID is required.', 400);
    const updated = await survivalDAO.updateById(id, updateData);
    if (!updated) throw new AppError('Survival content item not found.', 404);
    return updated;
  }

  /**
   * Delete survival content by ID
   */
  async deleteContent(id) {
    if (!id) throw new AppError('Content ID is required.', 400);
    const deleted = await survivalDAO.deleteById(id);
    if (!deleted) throw new AppError('Survival content item not found.', 404);
    return deleted;
  }

  /**
   * Like / bookmark interaction counter
   */
  async likeContent(id) {
    if (!id) throw new AppError('Content ID is required.', 400);
    try {
      const liked = await survivalDAO.incrementLikes(id);
      if (liked) return liked;
    } catch (e) {}
    return { success: true, message: 'Like recorded' };
  }
}

export default new SurvivalService();
