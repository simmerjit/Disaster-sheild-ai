import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage, clearChatSessionHistory } from '../services/chatApi';

const LOCAL_STORAGE_CHAT_KEY = 'ds_cached_chat_messages';

const loadPersistedMessages = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read cached chat messages:', err);
  }
  return [INITIAL_GREETING];
};
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  RefreshCw,
  PhoneCall,
  Flame,
  Waves,
  Activity,
  HeartPulse,
  Package,
  AlertTriangle,
  Radio,
} from 'lucide-react';

const INITIAL_GREETING = {
  id: 'init-msg-1',
  sender: 'bot',
  text: `### 🛡️ Welcome to DisasterShield AI Assistant

I am your 24/7 AI Emergency Decision & Disaster Safety Companion. I monitor global incident feeds, NDMA protocols, weather telemetry, and nearby emergency services.

**How can I protect or guide you right now?**
- 🚨 **Immediate Evacuation & Survival Directives**
- 🩹 **Emergency First Aid, Burns & CPR Triage**
- 🏕️ **Nearest Shelter & Hospital Locators**
- 🎒 **72-Hour Survival Go-Bag Checklist**
- 📞 **24/7 National Emergency Helplines**`,
  category: 'AI Disaster Protocol System',
  actions: [
    { label: '🚨 Earthquake Survival', action: 'QUICK_QUERY', payload: { query: 'What to do during an earthquake?' } },
    { label: '🌊 Flood Safety Protocol', action: 'QUICK_QUERY', payload: { query: 'Flood and flash flood safety rules' } },
    { label: '🩹 First Aid & CPR', action: 'QUICK_QUERY', payload: { query: 'Emergency first aid and CPR instructions' } },
    { label: '🏥 Find Nearby Hospitals', action: 'OPEN_FACILITIES', payload: { type: 'hospital' } },
  ],
  suggestions: [
    'What should I do during an Earthquake?',
    'How to prepare for a Cyclone warning?',
    'What are the 24/7 emergency helpline numbers?',
    'What goes into a 72-hour survival kit?',
  ],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  source: 'DisasterShield AI Intelligence Engine',
};

const QUICK_TOPICS = [
  { label: '🚨 Helplines', query: 'What are the emergency helpline numbers?', icon: PhoneCall },
  { label: '⚡ Earthquake', query: 'What should I do during an Earthquake?', icon: Activity },
  { label: '🌊 Floods', query: 'Flood safety and flash flood protocol', icon: Waves },
  { label: '🌪️ Cyclone', query: 'Cyclone warning safety precautions', icon: Radio },
  { label: '🔥 Wildfire', query: 'Wildfire and smoke safety guidelines', icon: Flame },
  { label: '🩹 First Aid', query: 'Emergency first aid and CPR steps', icon: HeartPulse },
  { label: '🎒 Go-Bag', query: 'What items go into a 72-hour disaster survival kit?', icon: Package },
];

export const DisasterChatbot = ({
  isOpen,
  onClose,
  userCoords,
  selectedDisaster,
  onOpenFacilities,
  onOpenWeather,
  onOpenNavigation,
  onFilterDisasterType,
}) => {
  const [messages, setMessages] = useState(loadPersistedMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-persist messages to localStorage (capped at 50 to prevent storage exhaustion)
  useEffect(() => {
    try {
      const trimmed = messages.slice(-50);
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('Could not persist chat messages to localStorage:', err);
    }
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // Text-to-Speech Helper
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech

    // Clean markdown symbols for cleaner audio narration
    const cleanText = text
      .replace(/[#*`_>[\]]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/-\s+/g, '. ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Copy message text to clipboard
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Action Button Clicks
  const handleActionClick = (actionObj) => {
    if (!actionObj) return;
    const { action, payload } = actionObj;

    switch (action) {
      case 'QUICK_QUERY':
        handleSend(payload.query);
        break;

      case 'OPEN_FACILITIES':
        if (onOpenFacilities) {
          const origin = selectedDisaster
            ? {
                latitude: Number(selectedDisaster.latitude),
                longitude: Number(selectedDisaster.longitude),
                name: selectedDisaster.title,
                type: 'disaster',
              }
            : userCoords
            ? {
                latitude: Number(userCoords.latitude),
                longitude: Number(userCoords.longitude),
                name: 'Your Location',
                type: 'user',
              }
            : null;
          onOpenFacilities(origin, payload?.type || 'hospital');
        }
        break;

      case 'OPEN_WEATHER':
        if (onOpenWeather) {
          const target = selectedDisaster
            ? {
                latitude: Number(selectedDisaster.latitude),
                longitude: Number(selectedDisaster.longitude),
                name: selectedDisaster.title,
                type: selectedDisaster.type,
              }
            : userCoords
            ? {
                latitude: Number(userCoords.latitude),
                longitude: Number(userCoords.longitude),
                name: 'Your Location',
                type: 'user_location',
              }
            : {
                latitude: 20.5937,
                longitude: 78.9629,
                name: 'Regional Center',
                type: 'region_center',
              };
          onOpenWeather(target);
        }
        break;

      case 'OPEN_NAVIGATION':
        if (onOpenNavigation) {
          onOpenNavigation();
        }
        break;

      case 'FILTER_MAP':
        if (onFilterDisasterType && payload?.type) {
          onFilterDisasterType(payload.type);
        }
        break;

      case 'VIEW_MAP':
        if (onClose) {
          onClose();
        }
        break;

      case 'CALL':
        if (payload?.number) {
          window.location.href = `tel:${payload.number}`;
        }
        break;

      default:
        console.log('Action triggered:', actionObj);
    }
  };

  // Submit User Message
  const handleSend = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputValue;
    if (!textToSend || !textToSend.trim() || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        message: textToSend,
        latitude: userCoords?.latitude,
        longitude: userCoords?.longitude,
        activeDisasterId: selectedDisaster?._id || selectedDisaster?.id,
      });

      if (response && response.data) {
        const botMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response.data.reply,
          category: response.data.category || 'AI Disaster Protocol',
          actions: response.data.actions || [],
          suggestions: response.data.suggestions || [],
          source: response.data.source || 'DisasterShield AI Intelligence Engine',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botMessage]);

        if (speechEnabled) {
          speakText(response.data.reply);
        }
      }
    } catch (err) {
      console.error('Chat submit error:', err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `### ⚠️ Connection Alert\n\nCould not reach the remote AI server, but your local safety protocol remains active. In an immediate emergency, please dial **112** (Universal Emergency) or **1078** (NDRF).`,
        category: 'Emergency Dispatch Notice',
        actions: [
          { label: '🚨 Call 112', action: 'CALL', payload: { number: '112' } },
          { label: '🛡️ Call NDRF 1078', action: 'CALL', payload: { number: '1078' } },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Render Markdown-like formatting safely
  const renderFormattedText = (rawText = '') => {
    const lines = rawText.split('\n');

    return lines.map((line, idx) => {
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="chat-md-h3">
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Heading 4
      if (line.startsWith('#### ')) {
        return (
          <h4 key={idx} className="chat-md-h4">
            {line.replace('#### ', '')}
          </h4>
        );
      }
      // Blockquote / Alert
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="chat-md-quote">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      // Bullet list
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.substring(2);
        return (
          <div key={idx} className="chat-md-bullet">
            <span className="chat-bullet-dot">&bull;</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
          </div>
        );
      }
      // Numbered list
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="chat-md-num-item">
            <span className="chat-num-badge">{numMatch[1]}</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="chat-md-spacer" />;
      }
      // Standard paragraph
      return (
        <p
          key={idx}
          className="chat-md-p"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    });
  };

  // Inline formatting parser (bold, code, tags)
  const formatInline = (str = '') => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="chat-highlight">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>');
  };

  if (!isOpen) return null;

  return (
    <div className={`disaster-chatbot-container ${isExpanded ? 'expanded' : ''}`}>
      {/* Chatbot Header */}
      <header className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="bot-avatar-wrapper">
            <Bot size={20} className="bot-avatar-icon" />
            <span className="bot-online-dot"></span>
          </div>
          <div>
            <div className="bot-header-title-row">
              <h2 className="bot-title">DisasterShield AI Assistant</h2>
              <span className="bot-ai-badge">
                <Sparkles size={11} />
                <span>AI 24/7</span>
              </span>
            </div>
            <p className="bot-subtitle">Live Incident Telemetry & Life-Saving Guidance</p>
          </div>
        </div>

        <div className="chatbot-header-actions">
          {/* Audio TTS toggle */}
          <button
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (!next && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`bot-tool-btn ${speechEnabled ? 'active' : ''}`}
            title={speechEnabled ? 'Mute AI Voice' : 'Enable AI Voice Narration'}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Reset/Clear Chat */}
          <button
            onClick={async () => {
              if (window.confirm('Reset conversation history?')) {
                setMessages([INITIAL_GREETING]);
                localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
                await clearChatSessionHistory();
              }
            }}
            className="bot-tool-btn"
            title="Reset Chat History"
          >
            <RefreshCw size={15} />
          </button>

          {/* Expand / Minimize Window */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bot-tool-btn"
            title={isExpanded ? 'Restore Size' : 'Expand Window'}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Close Chatbot */}
          <button onClick={onClose} className="bot-tool-btn close-btn" title="Close AI Assistant">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Quick Topic Chips Strip */}
      <div className="chatbot-quick-topics">
        {QUICK_TOPICS.map((topic, i) => {
          const IconComponent = topic.icon;
          return (
            <button
              key={i}
              onClick={() => handleSend(topic.query)}
              className="quick-topic-chip"
              title={`Ask: ${topic.query}`}
            >
              <IconComponent size={13} className="topic-icon" />
              <span>{topic.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div className="chatbot-messages-area">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';

          return (
            <div key={msg.id} className={`chat-message-row ${isBot ? 'bot-row' : 'user-row'}`}>
              {isBot && (
                <div className="msg-avatar bot-avatar">
                  <ShieldAlert size={16} />
                </div>
              )}

              <div className={`chat-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
                {/* Bot Category Tag */}
                {isBot && msg.category && (
                  <div className="bubble-category-tag">
                    <span className="cat-pulse"></span>
                    <span>{msg.category}</span>
                  </div>
                )}

                {/* Message Body Content */}
                <div className="chat-bubble-text">
                  {isBot ? renderFormattedText(msg.text) : msg.text}
                </div>

                {/* Interactive Action Buttons */}
                {isBot && msg.actions && msg.actions.length > 0 && (
                  <div className="chat-action-buttons-group">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act)}
                        className={`chat-action-btn ${
                          act.action === 'CALL' ? 'call-act-btn' : ''
                        }`}
                      >
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Follow-up Suggestions Chips */}
                {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="chat-suggestions-group">
                    <span className="suggestions-label">Suggested follow-ups:</span>
                    <div className="suggestions-list">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(sug)}
                          className="suggestion-pill"
                        >
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bubble Footer (Time, Copy, TTS) */}
                <div className="bubble-footer">
                  <span className="bubble-time">{msg.timestamp}</span>
                  {isBot && (
                    <div className="bubble-controls">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="bubble-ctrl-btn"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check size={13} className="text-green" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      <button
                        onClick={() => speakText(msg.text)}
                        className="bubble-ctrl-btn"
                        title="Read aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!isBot && (
                <div className="msg-avatar user-avatar">
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Animation State */}
        {isTyping && (
          <div className="chat-message-row bot-row">
            <div className="msg-avatar bot-avatar">
              <ShieldAlert size={16} />
            </div>
            <div className="chat-bubble bot-bubble typing-bubble">
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
              <span className="typing-label">Analyzing emergency protocols...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chatbot Input Footer */}
      <footer className="chatbot-footer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chatbot-input-form"
        >
          <div className="input-field-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask safety steps, first aid, active hazards, or nearest shelters..."
              className="chat-textarea"
              rows={1}
            />

            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Listening... click to stop' : 'Voice Input (Speak your query)'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="chat-send-btn"
            title="Send Message (Enter)"
          >
            <Send size={16} />
          </button>
        </form>

        {/* SOS One-Tap Quick Emergency Bar */}
        <div className="chatbot-emergency-bar">
          <button
            onClick={() => handleActionClick({ action: 'CALL', payload: { number: '112' } })}
            className="quick-sos-pill"
          >
            <AlertTriangle size={13} />
            <span>Emergency SOS (112)</span>
          </button>

          <button
            onClick={() => handleActionClick({ action: 'CALL', payload: { number: '1078' } })}
            className="quick-ndrf-pill"
          >
            <ShieldAlert size={13} />
            <span>NDRF Helpline (1078)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DisasterChatbot;
