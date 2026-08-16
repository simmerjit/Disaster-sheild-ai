import Disaster from '../models/disaster.model.js';
import Shelter from '../models/shelter.model.js';
import ChatSession from '../models/chatSession.model.js';
import { chatResponseCache } from '../utils/cache.js';

/**
 * @module controllers/chat.controller
 * @desc AI Emergency Chatbot & Decision Support Engine with In-Memory Caching & Non-blocking Session Persistence
 */

// Emergency Helpline Directory
const EMERGENCY_CONTACTS = [
  { name: 'National Emergency Helpline', number: '112', type: 'universal' },
  { name: 'NDRF Disaster Helpline', number: '1078', type: 'disaster' },
  { name: 'Ambulance & Medical Emergency', number: '108', type: 'medical' },
  { name: 'Fire Services', number: '101', type: 'fire' },
  { name: 'Police Control Room', number: '100', type: 'police' },
  { name: 'State Disaster Management (SDMA)', number: '1070', type: 'disaster' },
  { name: 'Women Helpline', number: '1091', type: 'support' },
  { name: 'Childline Emergency', number: '1098', type: 'support' },
];

// Pre-packaged Expert Safety Protocols for immediate, zero-latency life-saving advice
const SAFETY_KNOWLEDGE_BASE = {
  earthquake: {
    category: 'Earthquake Protocol',
    headline: 'DROP, COVER, AND HOLD ON',
    steps: [
      '**DROP** onto your hands and knees to prevent being knocked down.',
      '**COVER** your head and neck under a sturdy table or desk. If no shelter is nearby, drop next to an interior wall and protect your head with your arms.',
      '**HOLD ON** to your shelter until shaking stops. Be prepared to move with it.',
      '**STAY AWAY** from windows, exterior walls, glass facades, heavy lighting fixtures, and tall furniture.',
      '**IF OUTDOORS**: Move away from buildings, streetlights, overhead power lines, and sinkholes. Drop to the ground in an open area.',
      '**AFTER SHAKING**: Check for gas leaks (smell of sulfur/gas). Do NOT use open flames or matches. Prepare for aftershocks.',
    ],
    actions: [
      { label: '🏥 Find Nearby Hospitals', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
      { label: '📍 Find Verified Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
      { label: '🚨 Call NDRF (1078)', action: 'CALL', payload: { number: '1078' } },
    ],
    suggestions: [
      'What should I do if an aftershock occurs?',
      'How to treat earthquake crush injuries?',
      'How to turn off gas and electricity safely?',
    ],
  },
  flood: {
    category: 'Flood & Flash Flood Protocol',
    headline: 'SEEK HIGH GROUND & AVOID MOVING WATER',
    steps: [
      '**MOVE TO HIGHER GROUND IMMEDIATELY**: Flash floods can develop within minutes. Do not wait for formal evacuation orders if water is rising.',
      '**TURN AROUND, DON\'T DROWN**: Never walk, swim, or drive through floodwater. Just 6 inches (15 cm) of fast-moving water can knock you down; 12 inches (30 cm) can float most cars.',
      '**AVOID BRIDGES OVER FAST-MOVING WATER**: Floodwaters can scour foundation footings and cause sudden structural collapse.',
      '**ELECTRICAL HAZARDS**: Disconnect electrical appliances and main breaker before water enters. Stay clear of submerged power lines.',
      '**WATER PURIFICATION**: Boil all drinking water vigorously for at least 1 minute or use purification tablets before consuming.',
    ],
    actions: [
      { label: '🗺️ Open Evacuation Tool', action: 'OPEN_NAVIGATION' },
      { label: '📍 Find Nearby Safe Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
      { label: '🚨 Call Disaster Helpline (1070)', action: 'CALL', payload: { number: '1070' } },
    ],
    suggestions: [
      'What items should be in a flood emergency kit?',
      'How to purify contaminated drinking water?',
      'How to report stranded victims for rescue?',
    ],
  },
  cyclone: {
    category: 'Cyclone & Severe Storm Protocol',
    headline: 'SECURE SHELTER & MONITOR WARNING BULLETINS',
    steps: [
      '**STAY INDOORS**: Remain in the strongest part of your house (interior bathroom, hallway, or basement) away from windows and glass doors.',
      '**BOARD UP & SECURE**: Fasten loose outdoor objects (tin roofs, signboards, water tanks) that could become lethal wind-borne missiles.',
      '**BEWARE OF THE EYE OF THE STORM**: If winds suddenly die down, do NOT go outside. The opposite side of the storm wall will hit shortly with equal or greater ferocity.',
      '**UNPLUG APPLIANCES**: Disconnect sensitive electronic equipment and charge all phones/power banks in advance.',
      '**EMERGENCY KIT**: Keep battery-operated transistor radio, waterproof torches, dry rations, and potable water ready for at least 72 hours.',
    ],
    actions: [
      { label: '🌤️ Check Live Weather Radar', action: 'OPEN_WEATHER' },
      { label: '🗺️ Find Cyclone Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
      { label: '🚨 Call NDRF Helpline (1078)', action: 'CALL', payload: { number: '1078' } },
    ],
    suggestions: [
      'When is it safe to leave a cyclone shelter?',
      'What precautions to take after a cyclone passes?',
      'Show active cyclones on the map',
    ],
  },
  wildfire: {
    category: 'Wildfire & Fire Safety Protocol',
    headline: 'EVACUATE EARLY & PROTECT RESPIRATORY AIRWAYS',
    steps: [
      '**EVACUATE IMMEDIATELY** if instructed by local disaster authorities. Leave early to avoid getting trapped by smoke and gridlock.',
      '**RESPIRATORY PROTECTION**: Wear an N95 or P100 respirator mask, or cover your nose and mouth with a damp cloth to filter particulate matter.',
      '**DEFENSIVE PERIMETER**: Clear dry leaves, flammable outdoor furniture, and propane tanks away from structural walls.',
      '**IF TRAPPED INDOORS**: Keep all doors and windows closed but unlocked. Fill sinks, tubs, and buckets with water.',
      '**CLOTHING**: Wear long-sleeved 100% cotton or wool clothing, heavy boots, and protective goggles. Avoid synthetic fabrics that melt.',
    ],
    actions: [
      { label: '🗺️ Calculate Evacuation Route', action: 'OPEN_NAVIGATION' },
      { label: '🚒 Call Fire Helpline (101)', action: 'CALL', payload: { number: '101' } },
      { label: '🏥 Nearby Burn & Trauma Centers', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
    ],
    suggestions: [
      'How to treat minor and major burn injuries?',
      'What should go in an emergency fire go-bag?',
      'How to navigate through dense smoke safely?',
    ],
  },
  tsunami: {
    category: 'Tsunami Emergency Protocol',
    headline: 'HEAD TO HIGH GROUND IMMEDIATELY (>30M / 100FT)',
    steps: [
      '**NATURAL WARNING SIGNS**: A severe coastal earthquake lasting >20s, a roaring ocean sound like a train, or sudden receding of the sea exposing seabed are IMMEDIATE tsunami warnings.',
      '**DO NOT WAIT FOR OFFICIAL ALERTS**: Move inland at least 2 km or ascend to ground at least 30 meters (100 feet) above sea level.',
      '**NEVER GO TO THE BEACH TO WATCH**: A tsunami travels faster than a person can run (over 500 km/h in deep water).',
      '**MULTIPLE WAVES**: The first wave is almost never the largest. Successive waves can arrive over several hours.',
    ],
    actions: [
      { label: '🗺️ Find Safe Elevated Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
      { label: '🚨 National Disaster Helpline (112)', action: 'CALL', payload: { number: '112' } },
    ],
    suggestions: [
      'How long do tsunami waves continue arriving?',
      'What vertical evacuation buildings are safe?',
      'How to assist disabled or elderly during rapid evacuation?',
    ],
  },
  firstaid: {
    category: 'Emergency First Aid & Trauma Protocol',
    headline: 'IMMEDIATE LIFE-SAVING MEDICAL INTERVENTIONS',
    steps: [
      '**SEVERE BLEEDING**: Apply direct, continuous pressure with a clean cloth or sterile gauze. If bleeding continues through dressing, add more layers without removing the first. If limbs and trained, apply a tourniquet 2-3 inches above the wound.',
      '**BURNS**: Cool immediately under clean, running, cool (not ice-cold) water for 10-20 minutes. Cover loosely with sterile non-stick bandage. Do NOT pop blisters or apply oils/toothpaste.',
      '**ADULT CPR**: Check responsiveness and breathing. If unresponsive: Place hands on center of chest, push hard and fast (100-120 bpm, to the beat of "Stayin\' Alive") to depth of 2 inches (5 cm). 30 compressions followed by 2 rescue breaths.',
      '**CHOKING (HEIMLICH)**: Stand behind the person, wrap arms around waist, place fist thumb-side above navel, perform quick upward and inward thrusts.',
      '**FRACTURES**: Immobilize the limb in the position found using splints/rolled towels. Do not attempt to force bone back into place.',
    ],
    actions: [
      { label: '🏥 Locate Nearest Hospital/ER', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
      { label: '🚑 Call Ambulance (108)', action: 'CALL', payload: { number: '108' } },
      { label: '🚨 Call Emergency (112)', action: 'CALL', payload: { number: '112' } },
    ],
    suggestions: [
      'How to treat heat stroke and dehydration?',
      'What are the signs of internal bleeding or shock?',
      'How to stabilize someone with a spinal injury?',
    ],
  },
  gobag: {
    category: 'Emergency Kit & Go-Bag Checklist',
    headline: '72-HOUR SURVIVAL ESSENTIALS',
    steps: [
      '**WATER**: 1 gallon (3.8 liters) per person per day for at least 3-7 days.',
      '**FOOD**: Non-perishable, ready-to-eat canned meats, fruits, energy bars, and a manual can opener.',
      '**LIGHT & POWER**: High-lumen LED flashlight, headlamp, spare batteries, solar/hand-crank power bank, and USB cables.',
      '**MEDICAL & HYGIENE**: Comprehensive first aid kit, 14-day supply of prescription medications, water purification tablets, antiseptic wipes, N95 masks, sanitizer.',
      '**COMMUNICATION**: Portable battery-powered AM/FM radio, emergency high-decibel whistle (to signal search and rescue teams).',
      '**CRITICAL DOCUMENTS**: Waterproof pouch with IDs, passports, insurance policies, medical records, and emergency cash in small denominations.',
      '**TOOLS & GEAR**: Multi-tool / Swiss army knife, duct tape, waterproof matches / lighter, thermal foil space blankets, rain ponchos.',
    ],
    actions: [
      { label: '📍 Locate Nearest Safe Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
      { label: '🌤️ Check Local Weather Forecast', action: 'OPEN_WEATHER' },
    ],
    suggestions: [
      'What should be in an emergency kit for pets?',
      'How to prepare an offline communication plan for family?',
      'How to store potable water long-term?',
    ],
  },
};

/**
 * Identify intent and keywords from user query
 */
function analyzeIntent(query = '') {
  const q = query.toLowerCase();

  if (q.includes('earthquake') || q.includes('quake') || q.includes('tremor') || q.includes('shaking') || q.includes('richter')) {
    return 'earthquake';
  }
  if (q.includes('flood') || q.includes('flash flood') || q.includes('water rising') || q.includes('submerged') || q.includes('drown')) {
    return 'flood';
  }
  if (q.includes('cyclone') || q.includes('hurricane') || q.includes('typhoon') || q.includes('storm') || q.includes('tornado') || q.includes('gale')) {
    return 'cyclone';
  }
  if (q.includes('fire') || q.includes('wildfire') || q.includes('smoke') || q.includes('burn') || q.includes('blaze')) {
    return 'wildfire';
  }
  if (q.includes('tsunami') || q.includes('tidal wave') || q.includes('sea wave')) {
    return 'tsunami';
  }
  if (q.includes('first aid') || q.includes('cpr') || q.includes('bleeding') || q.includes('choking') || q.includes('fracture') || q.includes('wound') || q.includes('injured') || q.includes('bandage')) {
    return 'firstaid';
  }
  if (q.includes('kit') || q.includes('bag') || q.includes('pack') || q.includes('supplies') || q.includes('checklist') || q.includes('prepare') || q.includes('water storage')) {
    return 'gobag';
  }
  if (q.includes('shelter') || q.includes('camp') || q.includes('refuge') || q.includes('safe place') || q.includes('evacuat')) {
    return 'shelter_search';
  }
  if (q.includes('hospital') || q.includes('doctor') || q.includes('clinic') || q.includes('ambulance') || q.includes('medical') || q.includes('police') || q.includes('station')) {
    return 'facility_search';
  }
  if (q.includes('number') || q.includes('helpline') || q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('ndrf') || q.includes('sos')) {
    return 'contacts';
  }
  if (q.includes('active') || q.includes('live') || q.includes('ongoing') || q.includes('map') || q.includes('feed') || q.includes('hazard') || q.includes('current')) {
    return 'live_disasters';
  }
  if (q.includes('weather') || q.includes('rain') || q.includes('wind') || q.includes('temperature') || q.includes('forecast')) {
    return 'weather';
  }

  return 'general_emergency';
}

/**
 * Helper: Asynchronously persist chat messages without blocking the response
 */
function recordChatSessionAsync(sessionId, userMessage, botMessage, userCoordinates = null) {
  if (!sessionId) return;

  setImmediate(async () => {
    try {
      await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: { sessionId, userCoordinates },
          $push: {
            messages: {
              $each: [
                { sender: 'user', text: userMessage, timestamp: new Date() },
                { sender: 'bot', text: botMessage.reply, category: botMessage.category, timestamp: new Date() },
              ],
            },
          },
          $set: { lastActivity: new Date() },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn('Background chat session persist error:', err.message);
    }
  });
}

/**
 * @desc Process chat message and return intelligent emergency response
 * @route POST /api/chat/message
 */
export const handleChatMessage = async (req, res) => {
  try {
    const { message, sessionId, latitude, longitude, activeDisasterId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required.',
      });
    }

    const cleanQuery = message.trim();
    const intent = analyzeIntent(cleanQuery);

    // Cache key for intent query
    const cacheKey = `intent_${intent}_${activeDisasterId || 'none'}`;
    const cachedResponse = chatResponseCache.get(cacheKey);

    if (cachedResponse && intent !== 'live_disasters') {
      const responseData = {
        ...cachedResponse,
        timestamp: new Date().toISOString(),
      };

      // Record async session
      recordChatSessionAsync(sessionId, cleanQuery, responseData, { latitude, longitude });

      return res.json({
        success: true,
        data: responseData,
        cached: true,
      });
    }

    let responseData = null;

    // 1. Direct Knowledge Base Match
    if (SAFETY_KNOWLEDGE_BASE[intent]) {
      const entry = SAFETY_KNOWLEDGE_BASE[intent];
      responseData = {
        reply: `### 🚨 ${entry.category}\n\n**Key Directive:** ${entry.headline}\n\n${entry.steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`,
        category: entry.category,
        actions: entry.actions,
        suggestions: entry.suggestions,
        source: 'DisasterShield AI Knowledge Base (NDMA / UNDRR Standards)',
        timestamp: new Date().toISOString(),
      };
    }
    // 2. Emergency Contacts Query
    else if (intent === 'contacts') {
      const contactList = EMERGENCY_CONTACTS.map((c) => `- **${c.name}**: \`${c.number}\``).join('\n');
      responseData = {
        reply: `### 📞 Verified Emergency Helplines (24/7 National Dispatch)\n\n${contactList}\n\n> ⚠️ *In an immediate life-threatening emergency, dial **112** or **1078** immediately.*`,
        category: 'Emergency Directory',
        actions: [
          { label: '🚨 Call National Emergency (112)', action: 'CALL', payload: { number: '112' } },
          { label: '🛡️ Call NDRF Helpline (1078)', action: 'CALL', payload: { number: '1078' } },
          { label: '🚑 Call Ambulance (108)', action: 'CALL', payload: { number: '108' } },
        ],
        suggestions: [
          'What should I tell the emergency dispatcher?',
          'How to request NDRF search and rescue?',
          'Find nearest emergency hospital',
        ],
        source: 'NDMA National Disaster Directory',
        timestamp: new Date().toISOString(),
      };
    }
    // 3. Live Active Disasters Query
    else if (intent === 'live_disasters') {
      let recentDisasters = [];
      try {
        recentDisasters = await Disaster.find({ status: { $ne: 'past' } })
          .select('title type severity location country affectedRadius')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();
      } catch (dbErr) {
        console.warn('Could not query DB for disasters:', dbErr.message);
      }

      let summaryText = '';
      if (recentDisasters.length > 0) {
        summaryText = recentDisasters
          .map(
            (d, idx) =>
              `${idx + 1}. **${d.title || 'Disaster Incident'}**\n   - Type: \`${(d.type || 'unknown').toUpperCase()}\` | Severity: **${(d.severity || 'medium').toUpperCase()}**\n   - Location: ${d.location || d.country || 'Global Coordinates'}\n   - Affected Radius: ~${d.affectedRadius || 20} km`
          )
          .join('\n\n');
      } else {
        summaryText = 'Currently tracking real-time global telemetry feeds from **GDACS**, **USGS**, and **NASA EONET**. Check the interactive live map for real-time pinpoint coordinates.';
      }

      responseData = {
        reply: `### 🛰️ Live Disaster Feed & Early Warnings\n\n${summaryText}\n\nUse the map filters to inspect specific hazard types like Cyclones, Earthquakes, and Floods in high-risk zones.`,
        category: 'Live Incident Telemetry',
        actions: [
          { label: '🗺️ Explore Interactive Map', action: 'VIEW_MAP' },
          { label: '🌪️ Filter Cyclones', action: 'FILTER_MAP', payload: { type: 'cyclone' } },
          { label: '⚡ Filter Earthquakes', action: 'FILTER_MAP', payload: { type: 'earthquake' } },
        ],
        suggestions: [
          'How are affected radius zones calculated?',
          'Show active severe storms near me',
          'What are the GDACS alert level thresholds?',
        ],
        source: 'GDACS / USGS / NASA / DisasterShield Live Feed',
        timestamp: new Date().toISOString(),
      };
    }
    // 4. Shelter & Safe Refuge Search
    else if (intent === 'shelter_search') {
      responseData = {
        reply: `### 🏕️ Emergency Shelter & Relief Centers\n\nVerified emergency shelters provide potable water, power backup, medical triage, and emergency rations.\n\nTo locate the closest available facility with live capacity statistics, tap **"Locate Nearest Shelters"** below to trigger GPS geospatial discovery.`,
        category: 'Shelter Locator',
        actions: [
          { label: '📍 Locate Nearest Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
          { label: '🗺️ Plan Safe Evacuation Route', action: 'OPEN_NAVIGATION' },
        ],
        suggestions: [
          'What items are allowed in emergency shelters?',
          'Are pets allowed in public disaster shelters?',
          'How to register as an displaced person?',
        ],
        source: 'NDMA Shelter Management Guidelines',
        timestamp: new Date().toISOString(),
      };
    }
    // 5. Emergency Facilities (Hospitals, Police, Fire)
    else if (intent === 'facility_search') {
      responseData = {
        reply: `### 🏥 Emergency Medical & Protective Facilities\n\nDisasterShield AI integrates directly with **Google Places API (New)** to detect nearby trauma centers, pharmacies, police stations, and fire services in real-time.\n\nTap a button below to launch instantaneous radius scanning:`,
        category: 'Facility Discovery',
        actions: [
          { label: '🏥 Search Hospitals & ERs', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
          { label: '🚒 Search Fire Stations', action: 'OPEN_FACILITIES', payload: { type: 'fire_station' } },
          { label: '🚓 Search Police Stations', action: 'OPEN_FACILITIES', payload: { type: 'police' } },
        ],
        suggestions: [
          'How to get emergency transport to a hospital?',
          'Find nearest 24/7 pharmacy',
          'Emergency burns & trauma response steps',
        ],
        source: 'Google Places API (New) Discovery Layer',
        timestamp: new Date().toISOString(),
      };
    }
    // 6. Live Weather & Meteorological Inspector
    else if (intent === 'weather') {
      responseData = {
        reply: `### 🌤️ Real-Time Atmospheric & Weather Telemetry\n\nDisasterShield AI tracks live wind velocity, barometric pressure, precipitation, and storm trajectories from Open-Meteo and ISRO MOSDAC.\n\nTap below to open the live weather dashboard for your current coordinates or a disaster zone:`,
        category: 'Weather Telemetry',
        actions: [
          { label: '🌤️ Launch Weather Tool', action: 'OPEN_WEATHER' },
          { label: '🗺️ View High-Wind Hazard Zones', action: 'FILTER_MAP', payload: { type: 'cyclone' } },
        ],
        suggestions: [
          'What is the threshold for a severe cyclone warning?',
          'How to interpret barometric pressure drop before storms?',
          'Check heatwave safety tips',
        ],
        source: 'Open-Meteo / ISRO MOSDAC',
        timestamp: new Date().toISOString(),
      };
    }
    // 7. General Emergency AI Fallback
    else {
      responseData = {
        reply: `### 🛡️ DisasterShield AI Assistant\n\nI am your 24/7 AI Emergency & Disaster Response Assistant. I can guide you through immediate safety procedures, locate emergency facilities, track live global disaster telemetry, and provide first aid instructions.\n\n**How can I assist you right now?**\n- 🚨 **Immediate Safety Steps** for Earthquakes, Floods, Cyclones, Wildfires, or Tsunamis\n- 🩹 **Emergency First Aid & Trauma CPR** instructions\n- 🏥 **Nearby Hospitals, Shelters, and Police Stations**\n- 📞 **24/7 Emergency Contacts** (NDRF 1078, Police 112, Ambulance 108)\n- 🎒 **72-Hour Evacuation Go-Bag** checklist`,
        category: 'General Safety Assistant',
        actions: [
          { label: '🚨 Emergency SOS Directives', action: 'QUICK_QUERY', payload: { query: 'first aid emergency protocol' } },
          { label: '🏥 Find Nearby Hospitals', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
          { label: '🏕️ Find Safe Shelters', action: 'OPEN_FACILITIES', payload: { type: 'shelter' } },
          { label: '🗺️ Open Evacuation Route', action: 'OPEN_NAVIGATION' },
        ],
        suggestions: [
          'What should I do during an Earthquake?',
          'How to prepare for a Cyclone warning?',
          'What are the emergency helpline numbers?',
          'What items go in a 72-hour survival kit?',
        ],
        source: 'DisasterShield AI Intelligence Engine',
        timestamp: new Date().toISOString(),
      };
    }

    // Cache the response
    chatResponseCache.set(cacheKey, responseData);

    // Asynchronously log to session
    recordChatSessionAsync(sessionId, cleanQuery, responseData, { latitude, longitude });

    return res.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (err) {
    console.error('Chat controller error:', err);
    return res.status(500).json({
      success: false,
      error: 'Emergency Chatbot encountered an internal error. Please dial 112 for direct assistance.',
    });
  }
};

/**
 * @desc Get persisted chat history for a session
 * @route GET /api/chat/session/:sessionId
 */
export const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const session = await ChatSession.findOne({ sessionId })
      .select('sessionId messages lastActivity')
      .lean();

    return res.json({
      success: true,
      data: session || { sessionId, messages: [] },
    });
  } catch (err) {
    console.error('Get chat session error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc Clear chat history for a session
 * @route DELETE /api/chat/session/:sessionId
 */
export const clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await ChatSession.deleteOne({ sessionId });
    return res.json({ success: true, message: 'Session history deleted successfully' });
  } catch (err) {
    console.error('Clear chat session error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc Telemetry & Cache Health Metrics
 * @route GET /api/chat/metrics
 */
export const getChatMetrics = (req, res) => {
  return res.json({
    success: true,
    data: {
      cache: chatResponseCache.getMetrics(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  });
};
