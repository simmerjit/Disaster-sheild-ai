import survivalDAO from './survival.dao.js';
import AppError from '../../utils/AppError.js';

// Curated default survival lessons and emergency guides library
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
    title: 'Surviving Structural Collapse & Urban Search and Rescue Extraction',
    description: 'Tactical survival postures to create survivable void spaces during catastrophic structural collapse.',
    disasterType: 'earthquake',
    category: 'Search and Rescue',
    videoUrl: 'https://www.youtube.com/watch?v=G9jZ5V5p_Ew',
    videoId: 'G9jZ5V5p_Ew',
    embedUrl: 'https://www.youtube.com/embed/G9jZ5V5p_Ew',
    thumbnail: 'https://img.youtube.com/vi/G9jZ5V5p_Ew/hqdefault.jpg',
    channelName: 'Urban Rescue First Responders',
    duration: '11:20',
    difficulty: 'Intermediate',
    estimatedTime: '12 mins watch',
    tags: ['search and rescue', 'earthquake', 'void space', 'structural collapse'],
    language: 'en',
    source: 'INSARAG Urban Search & Rescue',
    verified: true,
    featured: false,
    views: 9800,
    likes: 830,
    quickGuide: {
      steps: [
        'Identify triangular void spaces near heavy foundational pillars or bulky furniture.',
        'Cover nose and mouth with cotton cloth to filter particulate concrete dust.',
        'Tap rhythms on pipes or concrete to conserve voice and alert canine sensors.',
      ],
      dos: ['Conserve your oxygen and stay calm', 'Use metal or stone to tap SOS rhythm (3 short, 3 long, 3 short)'],
      donts: ['Do not shout continuously to avoid inhaling toxic silica dust', 'Do not ignite matches or lighters due to gas line rupture risks'],
      emergencyChecklist: ['Dust mask / N95 respirator', 'LED compact headlamp', 'Emergency signal whistle'],
    },
  },

  // ── 2. FLOOD & SWIFT WATER ────────────────────────────────────────────────
  {
    title: 'Flash Flood Survival & High-Ground Evacuation Strategies',
    description: 'Understanding water velocity, escaping sinking vehicles, avoiding electrocution hazards, and swift water defense.',
    disasterType: 'flood',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=43M5mZuz35I',
    videoId: '43M5mZuz35I',
    embedUrl: 'https://www.youtube.com/embed/43M5mZuz35I',
    thumbnail: 'https://img.youtube.com/vi/43M5mZuz35I/hqdefault.jpg',
    channelName: 'National Disaster Response Corps',
    duration: '8:15',
    difficulty: 'Beginner',
    estimatedTime: '8 mins watch',
    tags: ['flood', 'flash flood', 'water safety', 'evacuation', 'high ground'],
    language: 'en',
    source: 'NDRF Water Safety Division',
    verified: true,
    featured: true,
    pinned: true,
    views: 18450,
    likes: 1620,
    quickGuide: {
      steps: [
        'Move immediately to designated high ground or multi-story concrete structures upon alert.',
        'Turn Around, Don’t Drown: Never drive or walk through moving water over 6 inches deep.',
        'Disconnect main electrical breakers before water enters living premises.',
        'Signal rescue boats using high-visibility neon cloths or reflective mirrors.',
      ],
      dos: [
        'Climb onto roofs rather than enclosed attics if trapped by rapid rising waters.',
        'Wear personal flotation devices or improvise with buoyant plastic containers.',
        'Boil all water before consumption due to heavy sewage contamination.',
      ],
      donts: [
        'Never walk through moving floodwater; 6 inches can sweep a person off their feet.',
        'Never touch downed electrical lines or water in contact with utility poles.',
        'Do not swim against swift water currents; angle 45 degrees towards the shore.',
      ],
      emergencyChecklist: [
        'Waterproof dry-bag for essential identity documents and medicine',
        'Portable water purification tablets (Aquatabs / Chlorine dioxide)',
        'Heavy-duty life vest / PFD',
        'Emergency high-decibel airhorn',
      ],
    },
  },
  {
    title: 'Emergency Water Purification: 4 Fail-Safe Survival Methods',
    description: 'Learn how to filter biological contaminants, viruses, and turbid sediments using heat, chemical tablets, SODIS, and gravity filters.',
    disasterType: 'water_purification',
    category: 'Water Purification',
    videoUrl: 'https://www.youtube.com/watch?v=gA_05yq0kCg',
    videoId: 'gA_05yq0kCg',
    embedUrl: 'https://www.youtube.com/embed/gA_05yq0kCg',
    thumbnail: 'https://img.youtube.com/vi/gA_05yq0kCg/hqdefault.jpg',
    channelName: 'Wilderness & Crisis Survival Lab',
    duration: '14:10',
    difficulty: 'Intermediate',
    estimatedTime: '15 mins watch',
    tags: ['water purification', 'chlorine', 'boiling', 'filter', 'hydration', 'flood'],
    language: 'en',
    source: 'WHO Water & Sanitation Standard',
    verified: true,
    featured: true,
    views: 21300,
    likes: 1980,
    quickGuide: {
      steps: [
        'Pre-filter turbid water through layers of clean sand, charcoal, and dense cloth.',
        'Bring water to a rolling boil for a minimum of 1 full minute (3 minutes at high altitude).',
        'Alternatively, use 2 drops of unscented household bleach (6% sodium hypochlorite) per liter and wait 30 minutes.',
        'Store purified water in airtight, UV-resistant sanitized containers.',
      ],
      dos: ['Allow suspended particles to settle before applying chemical purifiers', 'Keep water storage vessels covered at all times'],
      donts: ['Never use scented bleach or industrial pool chlorine', 'Do not assume crystal-clear water is free of microscopic pathogens'],
      emergencyChecklist: ['0.1 Micron Hollow Fiber Filter (Sawyer / LifeStraw)', 'Water purification chlorine tablets', 'Stainless steel boiling canteen'],
    },
  },

  // ── 3. CYCLONE & HURRICANE ────────────────────────────────────────────────
  {
    title: 'Cyclone & Hurricane Fortification: Wind Proofing and Shelter Anchoring',
    description: 'Step-by-step structural preparation for category 3-5 tropical cyclones, boarding windows, safe room reinforcement, and wind mitigation.',
    disasterType: 'cyclone',
    category: 'Disaster Preparedness',
    videoUrl: 'https://www.youtube.com/watch?v=aG3F_H-K8Vw',
    videoId: 'aG3F_H-K8Vw',
    embedUrl: 'https://www.youtube.com/embed/aG3F_H-K8Vw',
    thumbnail: 'https://img.youtube.com/vi/aG3F_H-K8Vw/hqdefault.jpg',
    channelName: 'Coastal Resilience Network',
    duration: '9:30',
    difficulty: 'Beginner',
    estimatedTime: '10 mins watch',
    tags: ['cyclone', 'hurricane', 'typhoon', 'wind safety', 'preparedness'],
    language: 'en',
    source: 'IMD & NOAA Cyclone Defense',
    verified: true,
    featured: true,
    views: 12100,
    likes: 1040,
    quickGuide: {
      steps: [
        'Secure exterior doors, shutters, and loose yard debris that could become high-speed projectiles.',
        'Identify an interior windowless room (hallway, bathroom) on the lowest floor as your storm refuge.',
        'Fill bathtubs, barrels, and clean jugs with potable water before municipal water grids lose pressure.',
        'Stay indoors during the eye of the storm; extreme counter-winds will resume suddenly.',
      ],
      dos: ['Keep a battery-powered radio tuned to emergency storm updates', 'Charge all phones and power banks in advance'],
      donts: ['Do not tape windows with masking tape; it provides zero structural strength and creates large glass shards', 'Do not venture outside when the calm "eye" passes over'],
      emergencyChecklist: ['Marine-grade storm tarp and tie-downs', 'Plywood window covers and fasteners', 'Solar generator / high-capacity battery bank', 'Emergency food provisions (7-day supply)'],
    },
  },

  // ── 4. WILDFIRE & HEAT ───────────────────────────────────────────────────
  {
    title: 'Wildfire Defensive Space & Rapid Evacuation Protocol',
    description: 'Critical evacuation trigger points, smoke inhalation defense, fire shelter deployment, and vehicle escape tactics.',
    disasterType: 'wildfire',
    category: 'Emergency Response',
    videoUrl: 'https://www.youtube.com/watch?v=Kz6aHqP8G0Y',
    videoId: 'Kz6aHqP8G0Y',
    embedUrl: 'https://www.youtube.com/embed/Kz6aHqP8G0Y',
    thumbnail: 'https://img.youtube.com/vi/Kz6aHqP8G0Y/hqdefault.jpg',
    channelName: 'Wildland Fire Safety Command',
    duration: '10:45',
    difficulty: 'Intermediate',
    estimatedTime: '11 mins watch',
    tags: ['wildfire', 'fire safety', 'smoke', 'evacuation', 'respirator'],
    language: 'en',
    source: 'CalFire & Forestry Defense',
    verified: true,
    featured: true,
    views: 15600,
    likes: 1390,
    quickGuide: {
      steps: [
        'Evacuate immediately upon mandatory orders; fire fronts can advance faster than human running speed (over 20 km/h).',
        'Wear 100% natural wool or heavy cotton clothing; avoid synthetic nylon/polyester fabrics that melt.',
        'Seal doors and windows, turn on exterior lights so property is visible through dense smoke plumes.',
        'Equip N95 or P100 respirators and protective goggles against particulate smoke and ember showers.',
      ],
      dos: ['Drive with headlights on and windows closed', 'Keep car recirculating air on to block carbon monoxide'],
      donts: ['Never delay evacuation to gather non-essential personal belongings', 'Do not attempt to outrun uphill fires; heat travels rapidly up slopes'],
      emergencyChecklist: ['P100 / N95 smoke-rated respirators', 'Googles with non-vented eye seals', '100% cotton/wool emergency blanket', 'Leather work gloves'],
    },
  },

  // ── 5. MEDICAL FIRST AID ─────────────────────────────────────────────────
  {
    title: 'Disaster Triage & Trauma Hemorrhage Control (Stop the Bleed)',
    description: 'Mastering life-saving tourniquet application, wound packing, pressure dressings, and emergency airway management in mass-casualty events.',
    disasterType: 'emergency_first_aid',
    category: 'Medical First Aid',
    videoUrl: 'https://www.youtube.com/watch?v=NxO_hA6a_jQ',
    videoId: 'NxO_hA6a_jQ',
    embedUrl: 'https://www.youtube.com/embed/NxO_hA6a_jQ',
    thumbnail: 'https://img.youtube.com/vi/NxO_hA6a_jQ/hqdefault.jpg',
    channelName: 'Emergency Trauma & Tactical Medicine',
    duration: '15:20',
    difficulty: 'Intermediate',
    estimatedTime: '16 mins watch',
    tags: ['first aid', 'tourniquet', 'hemorrhage', 'triage', 'cpr', 'bleeding'],
    language: 'en',
    source: 'American College of Surgeons / Stop The Bleed',
    verified: true,
    featured: true,
    pinned: true,
    views: 28900,
    likes: 2750,
    quickGuide: {
      steps: [
        'Apply direct, firm pressure on open wounds with sterile gauze or clean cloth.',
        'For severe arterial limb bleeding, apply a combat tourniquet (CAT) 2-3 inches above the wound (not over joints).',
        'Tighten the windlass until bright red pulsing bleeding ceases completely and lock in the windlass clip.',
        'Mark the exact application time on the tourniquet time strap (e.g., "TK 14:35").',
      ],
      dos: ['Place patient in the recovery posture to prevent airway obstruction', 'Keep trauma victims warm to prevent hypothermia-induced shock'],
      donts: ['Never loosen or remove an applied tourniquet; only trained hospital surgical staff should release it', 'Do not apply tourniquets directly over knee or elbow joints'],
      emergencyChecklist: ['Combat Application Tourniquet (CAT Gen 7)', 'Hemostatic QuikClot / ChitoGauze', 'Israeli pressure emergency bandage', 'Nitrile medical examination gloves'],
    },
  },
  {
    title: 'Hands-Only CPR & Resuscitation in Crisis Conditions',
    description: 'Immediate bystander CPR protocol for cardiac arrest during trauma, electrocution, or drowning incidents.',
    disasterType: 'emergency_first_aid',
    category: 'Medical First Aid',
    videoUrl: 'https://www.youtube.com/watch?v=M4ACYp75mjU',
    videoId: 'M4ACYp75mjU',
    embedUrl: 'https://www.youtube.com/embed/M4ACYp75mjU',
    thumbnail: 'https://img.youtube.com/vi/M4ACYp75mjU/hqdefault.jpg',
    channelName: 'Heart & Emergency First Responders',
    duration: '5:45',
    difficulty: 'Beginner',
    estimatedTime: '6 mins watch',
    tags: ['cpr', 'cardiac arrest', 'first aid', 'resuscitation', 'emergency'],
    language: 'en',
    source: 'American Heart Association & Red Cross',
    verified: true,
    featured: false,
    views: 19400,
    likes: 1810,
    quickGuide: {
      steps: [
        'Check patient responsiveness and verify breathing by looking at chest rise.',
        'Place heel of one hand in the center of the chest, interlock fingers with second hand.',
        'Compress hard and fast at 100 to 120 beats per minute (to the rhythm of "Stayin Alive").',
        'Allow full chest recoil between compressions; continue until AED arrives or patient shows life.',
      ],
      dos: ['Push down at least 2 inches (5 cm) deep', 'Switch rescuers every 2 minutes if tired to maintain compression depth'],
      donts: ['Do not stop compressions for more than 10 seconds', 'Do not hesitate; early CPR triples cardiac arrest survival rates'],
      emergencyChecklist: ['Pocket CPR barrier mask', 'Automatic External Defibrillator (AED) locator', 'Emergency contact dispatch speed dial'],
    },
  },

  // ── 6. BASIC SURVIVAL & SHELTER ───────────────────────────────────────────
  {
    title: 'Emergency Tarp & Cordage Shelter Configurations in Harsh Weather',
    description: 'Master 5 rapid survival shelter pitches (A-Frame, Lean-To, Diamond Fly, Plowpoint) using lightweight silnylon tarps and paracord.',
    disasterType: 'survival_skills',
    category: 'Shelter Building',
    videoUrl: 'https://www.youtube.com/watch?v=uK1XWc1oY8g',
    videoId: 'uK1XWc1oY8g',
    embedUrl: 'https://www.youtube.com/embed/uK1XWc1oY8g',
    thumbnail: 'https://img.youtube.com/vi/uK1XWc1oY8g/hqdefault.jpg',
    channelName: 'Field Survival Academy',
    duration: '12:30',
    difficulty: 'Beginner',
    estimatedTime: '13 mins watch',
    tags: ['shelter', 'tarp', 'paracord', 'bushcraft', 'survival skills'],
    language: 'en',
    source: 'Special Operations Survival School',
    verified: true,
    featured: false,
    views: 11200,
    likes: 950,
    quickGuide: {
      steps: [
        'Select elevated ground away from falling tree branches ("widowmakers") and flood drainages.',
        'String a taut ridge-line using the Siberian hitch or taut-line knot.',
        'Stake corners into windward side at 45 degree angles to shed high winds and rain.',
        'Create a ground insulation layer with pine boughs or dry leaf litter to prevent conductive heat loss.',
      ],
      dos: ['Angle shelter entrance away from prevailing winds', 'Dig shallow perimeter runoff trenches in heavy rain'],
      donts: ['Never sleep directly on bare cold ground without an insulation pad', 'Do not pitch shelters under dead or leaning trees'],
      emergencyChecklist: ['10x10ft Heavy Duty Grommeted Tarp', '550lb Mil-Spec Paracord (50ft)', 'Lightweight aluminum tent stakes', 'Reflective thermal space bivy'],
    },
  },
  {
    title: 'Building a 72-Hour Survival Go-Bag (Bug Out Bag Architecture)',
    description: 'Comprehensive breakdown of the essential 10 survival systems: Water, Food, Fire, Shelter, First Aid, Tools, Navigation, Lighting, Power, and Comms.',
    disasterType: 'general',
    category: 'Emergency Kits',
    videoUrl: 'https://www.youtube.com/watch?v=XzUvM4f9W5s',
    videoId: 'XzUvM4f9W5s',
    embedUrl: 'https://www.youtube.com/embed/XzUvM4f9W5s',
    thumbnail: 'https://img.youtube.com/vi/XzUvM4f9W5s/hqdefault.jpg',
    channelName: 'Preparedness Protocol International',
    duration: '16:40',
    difficulty: 'Beginner',
    estimatedTime: '17 mins watch',
    tags: ['emergency kit', 'go bag', 'bug out bag', 'preparedness', 'survival kit'],
    language: 'en',
    source: 'Red Cross Preparedness Doctrine',
    verified: true,
    featured: true,
    views: 34100,
    likes: 3120,
    quickGuide: {
      steps: [
        'Pack 3 liters of water per person plus compact filtration device.',
        'Include 3 days of high-calorie, non-perishable emergency food bars (2000 kcal/day).',
        'Store physical copies of critical IDs, property records, and emergency contact list in a waterproof pouch.',
        'Include emergency cash in small denominations ($10, $20) as ATMs go offline during power grid failures.',
      ],
      dos: ['Keep the pack under 15-20% of your body weight for mobility', 'Inspect and rotate emergency rations and batteries every 6 months'],
      donts: ['Do not overpack heavy bulky canned goods requiring openers', 'Do not rely entirely on smartphone GPS for navigation'],
      emergencyChecklist: ['35L Weatherproof Backpack', 'Multi-tool with pliers and wire cutter', 'AM/FM/NOAA Hand-Crank Solar Radio', 'Compact Trauma First Aid Kit'],
    },
  },
];

class SurvivalService {
  /**
   * Automatically initializes and seeds the database with curated survival academy content if empty
   */
  async ensureSeededData() {
    try {
      const count = await survivalDAO.count();
      if (count < DEFAULT_SURVIVAL_LIBRARY.length) {
        for (const item of DEFAULT_SURVIVAL_LIBRARY) {
          const existing = await survivalDAO.find({ title: item.title });
          if (!existing || existing.total === 0) {
            await survivalDAO.create(item);
          }
        }
      }
    } catch (err) {
      console.warn(`[SurvivalService] Seed verification note: ${err.message}`);
    }
  }

  /**
   * Get all survival content with flexible filtering, search, pagination, and sorting
   */
  async getAllContent(queryParams = {}) {
    await this.ensureSeededData();

    const {
      page = 1,
      limit = 24,
      category,
      disasterType,
      difficulty,
      search,
      tags,
      featured,
      sortBy = 'trending', // 'trending' | 'recent' | 'views' | 'likes' | 'title'
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

    // Determine sorting
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

    return result;
  }

  /**
   * Get single content by ID & automatically increment view counter
   */
  async getContentById(id, recordView = true) {
    if (!id) throw new AppError('Content ID is required.', 400);

    let content = null;
    if (recordView) {
      content = await survivalDAO.incrementViews(id);
    } else {
      content = await survivalDAO.findById(id);
    }

    if (!content) {
      throw new AppError('Survival lesson content not found.', 404);
    }

    return content;
  }

  /**
   * Get content for specific disaster type
   */
  async getContentByDisasterType(disasterType, limit = 10) {
    await this.ensureSeededData();
    const type = (disasterType || 'general').toLowerCase();

    return await survivalDAO.find(
      { disasterType: { $in: [type, 'general'] } },
      { limit: Number(limit) || 10, sort: { pinned: -1, views: -1 } }
    );
  }

  /**
   * Get trending survival content
   */
  async getTrendingContent(limit = 6) {
    await this.ensureSeededData();
    return await survivalDAO.find({}, { limit: Number(limit) || 6, sort: { views: -1 } });
  }

  /**
   * Get featured & pinned survival lessons
   */
  async getFeaturedContent(limit = 6) {
    await this.ensureSeededData();
    return await survivalDAO.find(
      { $or: [{ featured: true }, { pinned: true }] },
      { limit: Number(limit) || 6, sort: { pinned: -1, views: -1 } }
    );
  }

  /**
   * Auto-Survival Recommendation Engine:
   * When a disaster is selected or detected, recommends:
   * 1. Top video lessons tailored to the specific disaster
   * 2. Emergency Quick Action Guide (DOs, DONTs, Steps, Checklist)
   * 3. Complementary Medical / First Aid & Survival Skills
   */
  async getDisasterRecommendations(disasterType = 'general') {
    await this.ensureSeededData();
    const dType = (disasterType || 'general').toLowerCase();

    // Fetch primary disaster lessons
    const primaryResult = await survivalDAO.find(
      { disasterType: dType },
      { limit: 6, sort: { pinned: -1, views: -1 } }
    );

    let primaryVideos = primaryResult.items;

    // Fallback if few items found
    if (primaryVideos.length < 3) {
      const generalResult = await survivalDAO.find(
        { disasterType: 'general' },
        { limit: 4 - primaryVideos.length }
      );
      primaryVideos = [...primaryVideos, ...generalResult.items];
    }

    // Complementary First Aid & Water Sanitation
    const firstAidResult = await survivalDAO.find(
      { category: { $in: ['Medical First Aid', 'Water Purification', 'Emergency Response'] } },
      { limit: 4, sort: { views: -1 } }
    );

    // Extract best quick guide for the disaster
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
      firstAidVideos: firstAidResult.items,
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
    await this.ensureSeededData();
    const items = await survivalDAO.find(
      { 'quickGuide.steps.0': { $exists: true } },
      { limit: 20, sort: { pinned: -1, views: -1 } }
    );

    return items.items.map((item) => ({
      id: item._id,
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
    await this.ensureSeededData();
    const stats = await survivalDAO.getCategoryStats();
    return stats;
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
    const liked = await survivalDAO.incrementLikes(id);
    if (!liked) throw new AppError('Survival content item not found.', 404);
    return liked;
  }
}

export default new SurvivalService();
