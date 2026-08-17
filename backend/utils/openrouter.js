/**
 * OpenRouter AI Integration for DisasterShield AI
 * Uses Google Gemini 2.5 Flash (via OpenRouter) to provide real-time, life-saving emergency guidance.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

const SYSTEM_PROMPT = `You are DisasterShield AI — an elite, 24/7 AI Emergency Decision & Disaster Safety Companion.
Your mission is to provide life-saving, direct, actionable, and calm emergency directives adhering to NDMA, UNDRR, and WHO emergency standards.

Instructions:
1. Prioritize immediate human physical safety above all else.
2. Structure your replies using clear Markdown headings (e.g. ### 🚨 Action Title), bold keywords, and concise numbered/bulleted steps.
3. Keep the response concise, clear, and scannable so users in an emergency can read it instantly.
4. Include verified national dispatch numbers when relevant:
   - National Emergency Helpline: 112
   - NDRF Disaster Response: 1078
   - Ambulance / Medical: 108
   - Fire Services: 101
5. At the very end of your response, ALWAYS append a JSON block inside a \`\`\`json\`\`\` code fence with this exact format:
\`\`\`json
{
  "category": "Disaster / Safety Category Name",
  "actions": [
    {"label": "🚨 Call Emergency (112)", "action": "CALL", "payload": {"number": "112"}},
    {"label": "🏥 Nearby Hospitals", "action": "OPEN_FACILITIES", "payload": {"type": "hospital"}},
    {"label": "🏕️ Find Safe Shelters", "action": "OPEN_FACILITIES", "payload": {"type": "shelter"}}
  ],
  "suggestions": [
    "Suggested question 1?",
    "Suggested question 2?",
    "Suggested question 3?"
  ]
}
\`\`\`
Actions can use:
- "CALL" with payload {"number": "112" / "1078" / "108"}
- "OPEN_FACILITIES" with payload {"type": "hospital" | "shelter" | "fire_station" | "police"}
- "OPEN_WEATHER"
- "OPEN_NAVIGATION"
- "QUICK_QUERY" with payload {"query": "text to ask"}
`;

/**
 * Generate AI disaster safety guidance using OpenRouter
 * @param {Object} options
 * @param {string} options.message - User prompt
 * @param {Array} [options.history] - Previous chat messages
 * @param {Object} [options.userCoordinates] - { latitude, longitude }
 * @param {Object} [options.activeDisaster] - Active incident context if any
 * @returns {Promise<Object|null>} { reply, category, actions, suggestions, source }
 */
export async function generateOpenRouterChatResponse({ message, history = [], userCoordinates = null, activeDisaster = null }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('OpenRouter API Key not configured.');
    return null;
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Append context about active disaster if present
    if (activeDisaster) {
      messages.push({
        role: 'system',
        content: `Active Emergency Context: Incident "${activeDisaster.title || 'Unknown'}", Type: ${activeDisaster.type || 'Hazard'}, Severity: ${activeDisaster.severity || 'Moderate'}, Location: ${activeDisaster.location || 'Area'}. Affected radius: ~${activeDisaster.affectedRadius || 20}km.`,
      });
    }

    if (userCoordinates && userCoordinates.latitude && userCoordinates.longitude) {
      messages.push({
        role: 'system',
        content: `User GPS Location: Latitude ${userCoordinates.latitude}, Longitude ${userCoordinates.longitude}.`,
      });
    }

    // Add recent history (up to last 6 messages)
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      for (const h of recent) {
        if (h.sender === 'user') {
          messages.push({ role: 'user', content: h.text });
        } else if (h.sender === 'bot') {
          messages.push({ role: 'assistant', content: h.text });
        }
      }
    }

    // Add current query
    messages.push({ role: 'user', content: message });

    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://disastershield.ai',
        'X-Title': 'DisasterShield AI Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 900,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`OpenRouter API error (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return null;
    }

    // Parse JSON metadata block from end of response if present
    let cleanReply = rawContent;
    let category = 'AI Emergency Protocol';
    let actions = [
      { label: '🚨 Call Emergency (112)', action: 'CALL', payload: { number: '112' } },
      { label: '🛡️ NDRF Helpline (1078)', action: 'CALL', payload: { number: '1078' } },
      { label: '🏥 Find Nearby Hospitals', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
    ];
    let suggestions = [
      'What should I do during an Earthquake?',
      'How to prepare an emergency Go-Bag?',
      'Find safe emergency shelters near me',
    ];

    const jsonMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const meta = JSON.parse(jsonMatch[1]);
        if (meta.category) category = meta.category;
        if (Array.isArray(meta.actions) && meta.actions.length > 0) actions = meta.actions;
        if (Array.isArray(meta.suggestions) && meta.suggestions.length > 0) suggestions = meta.suggestions;
        cleanReply = rawContent.replace(jsonMatch[0], '').trim();
      } catch (parseErr) {
        // Fallback to raw text without error
      }
    }

    return {
      reply: cleanReply,
      category,
      actions,
      suggestions,
      source: `DisasterShield AI (${model})`,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('OpenRouter generation error:', err.message);
    return null;
  }
}
