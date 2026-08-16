import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const chatClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SESSION_STORAGE_KEY = 'disastershield_chat_session_id';

/**
 * Get or generate persistent UUID for current user chat session
 */
export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
};

/**
 * Send user message to AI Emergency Chatbot with session tracking
 * @param {Object} payload - { message, latitude, longitude, activeDisasterId }
 * @returns {Promise<Object>} { success, data: { reply, category, actions, suggestions, source, timestamp } }
 */
export const sendChatMessage = async (payload) => {
  try {
    const sessionId = getOrCreateSessionId();
    const response = await chatClient.post('/chat/message', {
      ...payload,
      sessionId,
    });
    return response.data;
  } catch (error) {
    console.warn('Chat API offline/error, using resilient local fallback:', error.message);
    // Offline / Network Failure Fallback
    return {
      success: true,
      data: getOfflineFallbackResponse(payload.message),
    };
  }
};

/**
 * Fetch persisted conversation history from backend
 */
export const fetchChatSessionHistory = async () => {
  try {
    const sessionId = getOrCreateSessionId();
    const response = await chatClient.get(`/chat/session/${sessionId}`);
    return response.data;
  } catch (err) {
    console.warn('Could not fetch server session history:', err.message);
    return { success: false, data: null };
  }
};

/**
 * Clear chat session on backend & local storage
 */
export const clearChatSessionHistory = async () => {
  try {
    const sessionId = getOrCreateSessionId();
    await chatClient.delete(`/chat/session/${sessionId}`);
  } catch (err) {
    console.warn('Could not clear server session history:', err.message);
  } finally {
    const newSessionId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
  }
};

/**
 * Resilient Offline Fallback for critical life-saving advice when network is severed
 */
function getOfflineFallbackResponse(query = '') {
  const q = query.toLowerCase();

  if (q.includes('earthquake') || q.includes('quake') || q.includes('shake')) {
    return {
      reply: `### 🚨 EARTHQUAKE IMMEDIATE SAFETY\n\n1. **DROP** to your hands and knees.\n2. **COVER** your head and neck under a sturdy table or desk.\n3. **HOLD ON** until the shaking completely stops.\n4. Stay away from glass, windows, and exterior walls.\n5. If outdoors, move to an open area away from power lines.`,
      category: 'Earthquake Protocol (Offline Mode)',
      actions: [
        { label: '🚨 Emergency Helpline (112)', action: 'CALL', payload: { number: '112' } },
        { label: '🛡️ NDRF Helpline (1078)', action: 'CALL', payload: { number: '1078' } },
      ],
      suggestions: ['What to do after an earthquake?', 'Emergency kit checklist'],
      source: 'DisasterShield Offline Emergency Cache',
      timestamp: new Date().toISOString(),
    };
  }

  if (q.includes('flood') || q.includes('water')) {
    return {
      reply: `### 🌊 FLOOD & FLASH FLOOD SAFETY\n\n1. **GET TO HIGHER GROUND**: Do not wait if water levels are rising.\n2. **NEVER WALK OR DRIVE THROUGH FLOODWATER**: 6 inches of rushing water can sweep you off your feet.\n3. **AVOID BRIDGES** over fast-moving rivers.\n4. Turn off electricity at the main breaker before water reaches outlets.\n5. Boil all drinking water before consumption.`,
      category: 'Flood Protocol (Offline Mode)',
      actions: [
        { label: '🚨 Call Disaster Control (1070)', action: 'CALL', payload: { number: '1070' } },
        { label: '🚑 Call Ambulance (108)', action: 'CALL', payload: { number: '108' } },
      ],
      suggestions: ['How to purify flood water', 'What to pack in a flood go-bag'],
      source: 'DisasterShield Offline Emergency Cache',
      timestamp: new Date().toISOString(),
    };
  }

  if (q.includes('first aid') || q.includes('cpr') || q.includes('bleed') || q.includes('burn')) {
    return {
      reply: `### 🩹 EMERGENCY FIRST AID ESSENTIALS\n\n- **Severe Bleeding**: Apply firm, continuous pressure with clean cloth.\n- **Burns**: Cool immediately under running cool water for 10-20 min. Cover loosely.\n- **CPR**: 30 hard and fast chest compressions (100-120 bpm) followed by 2 breaths.\n- **Choking**: Perform 5 sharp back blows followed by 5 abdominal thrusts (Heimlich).`,
      category: 'First Aid Triage (Offline Mode)',
      actions: [
        { label: '🚑 Call Ambulance (108)', action: 'CALL', payload: { number: '108' } },
        { label: '🚨 National Emergency (112)', action: 'CALL', payload: { number: '112' } },
      ],
      suggestions: ['How to treat burn blisters', 'Adult CPR steps'],
      source: 'DisasterShield Offline Emergency Cache',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    reply: `### 🛡️ DisasterShield AI (Offline Assistance)\n\nIn an emergency situation, please prioritize your immediate physical safety:\n\n- **National Emergency Helpline**: Dial \`112\`\n- **NDRF Disaster Response**: Dial \`1078\`\n- **Ambulance / Medical**: Dial \`108\`\n- **Fire Department**: Dial \`101\``,
    category: 'Emergency Dispatch (Offline)',
    actions: [
      { label: '🚨 Call 112', action: 'CALL', payload: { number: '112' } },
      { label: '🛡️ Call NDRF 1078', action: 'CALL', payload: { number: '1078' } },
    ],
    suggestions: [
      'Earthquake safety steps',
      'Flood emergency rules',
      'First aid for bleeding and burns',
    ],
    source: 'DisasterShield Offline Emergency Cache',
    timestamp: new Date().toISOString(),
  };
}

export default {
  sendChatMessage,
  getOrCreateSessionId,
  fetchChatSessionHistory,
  clearChatSessionHistory,
};
