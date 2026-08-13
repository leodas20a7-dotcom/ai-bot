import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createEnquiry } from '../lib/api';
import { supabase } from '../lib/supabase';

const getSystemPrompt = (collectBudget = false) => {
  const commonRules = `
STRICT ENQUIRY RULE:
- If the user asks ANY question about the franchise (e.g., "why should I invest", "tell me details", "what is the process", "how much cost"):
  DO NOT give long explanations or details!
  Simply respond with 1 short polite sentence: "Our senior franchise manager will call you shortly to explain all the details." and then immediately ask for their contact detail.
- Keep all responses extremely brief (1-2 short sentences max).

LEAD COLLECTION STEPS (COLLECT ONE DETAIL AT A TIME SEPARATELY):
1. FIRST TURN: Ask for their **Name**. (Do not ask for location or phone number yet).
2. SECOND TURN: After they give Name, ask for their **City / Location**.
${collectBudget ? '3. THIRD TURN: After Location, ask for their **Investment Budget**.\n4. FOURTH TURN: Ask for their **10-digit Mobile Phone Number**.' : '3. THIRD TURN: After Location, ask for their **10-digit Mobile Phone Number**.'}

STRICT CONVERSATION RULES:
- Ask ONE detail per turn. Never combine multiple questions in one turn.
- PHONE NUMBER VALIDATION: Verify phone number has exactly 10 digits. If not 10 digits, politely ask them to re-enter a valid 10-digit number.
`;

  if (!collectBudget) {
    return `You are Convi, the AI Franchise Consultant for Convenio Mart.
${commonRules}

***END OF CONVERSATION TRIGGER***
As soon as you have collected Name, Location, and valid 10-digit Phone Number:
Output the summary with EACH DETAIL ON A SEPARATE LINE using bullet points:

- **Name:** [Their Name]
- **Phone:** [Their Phone Number]
- **Area:** [Their Location]

After the summary on a new line, say:
"Great! Our team will reach out to you shortly to discuss further." and stop asking questions.`;
  }

  return `You are Convi, the AI Franchise Consultant for Convenio Mart.
${commonRules}

***END OF CONVERSATION TRIGGER***
As soon as you have collected Name, Location, Budget, and valid 10-digit Phone Number:
Output the summary with EACH DETAIL ON A SEPARATE LINE using bullet points:

- **Name:** [Their Name]
- **Phone:** [Their Phone Number]
- **Area:** [Their Location]
- **Budget:** [Their Budget]

After the summary on a new line, say:
"Great! Our team will reach out to you shortly to discuss further." and stop asking questions.`;
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [collectBudget, setCollectBudget] = useState(() => {
    return localStorage.getItem('collect_budget_setting') === 'true';
  });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! 👋 I'm Convi, the AI Franchise Consultant. May I know your name?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const leadSavedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSetting = () => {
      const stored = localStorage.getItem('collect_budget_setting');
      if (stored !== null) {
        setCollectBudget(stored === 'true');
      }
    };
    fetchSetting();
  }, []);

  useEffect(() => {
    if (location.pathname === '/ai-chat') {
      setIsOpen(true);
    }
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, [location.pathname]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Precise JS digit validation to prevent LLM token counting hallucination
    const digitsOnly = userMessage.replace(/\D/g, '');
    let systemHint = '';
    if (digitsOnly.length === 10) {
      systemHint = `[SYSTEM NOTE: User provided phone number "${digitsOnly}" which is VALID (exactly 10 digits). Accept it as valid immediately and output the final summary.]`;
    } else if (digitsOnly.length > 0 && digitsOnly.length !== 10 && !(digitsOnly.length === 12 && digitsOnly.startsWith('91'))) {
      systemHint = `[SYSTEM NOTE: User provided number "${userMessage}" which has ${digitsOnly.length} digits. It is NOT 10 digits. Ask them politely to re-enter a valid 10-digit mobile number.]`;
    }

    const payloadMessages = [
      { role: 'system', content: getSystemPrompt(collectBudget) },
      ...newMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    if (systemHint) {
      payloadMessages.push({ role: 'system', content: systemHint });
    }

    try {
      const response = await fetch('/api/groq/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: payloadMessages,
          temperature: 0.3,
          max_tokens: 300
        })
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`API returned non-JSON response. Status: ${response.status}. Response: ${rawText.substring(0, 100)}...`);
      }

      if (data.choices && data.choices[0]) {
        let aiResponse = data.choices[0].message.content;

        // Line-by-line extraction of lead details
        const cleanLines = aiResponse.split('\n').map(l => l.replace(/[*_#\-]/g, '').trim());

        let extractedName = null;
        let extractedPhone = null;
        let extractedArea = null;
        let extractedBudget = null;

        cleanLines.forEach(line => {
          if (!extractedName && /^(?:Name|Full Name)\s*:\s*(.+)$/i.test(line)) {
            extractedName = line.match(/^(?:Name|Full Name)\s*:\s*(.+)$/i)[1].trim();
          }
          if (!extractedPhone && /^(?:Phone|Mobile|Contact|Number)\s*:\s*(.+)$/i.test(line)) {
            extractedPhone = line.match(/^(?:Phone|Mobile|Contact|Number)\s*:\s*(.+)$/i)[1].trim();
          }
          if (!extractedArea && /^(?:Area|Location|City|Place)\s*:\s*(.+)$/i.test(line)) {
            extractedArea = line.match(/^(?:Area|Location|City|Place)\s*:\s*(.+)$/i)[1].trim();
          }
          if (!extractedBudget && /^(?:Budget|Investment)\s*:\s*(.+)$/i.test(line)) {
            extractedBudget = line.match(/^(?:Budget|Investment)\s*:\s*(.+)$/i)[1].trim();
          }
        });

        // Fallback: Scan user messages for a 10-digit phone number if missing from summary
        if (!extractedPhone) {
          for (let i = newMessages.length - 1; i >= 0; i--) {
            const msg = newMessages[i];
            if (msg.role === 'user') {
              const digits = msg.content.replace(/\D/g, '');
              if (digits.length === 10) {
                extractedPhone = digits;
                break;
              }
            }
          }
        }

        // If phone is found (or Name + Phone present) and lead hasn't been saved for this session yet
        if (extractedPhone && !leadSavedRef.current) {
          leadSavedRef.current = true;
          try {
            // Find name fallback from early user messages if not explicitly captured
            const userMessages = newMessages.filter(m => m.role === 'user');
            const fallbackName = userMessages.length > 0 ? userMessages[0].content.trim() : 'Guest';

            const leadData = {
              name: extractedName || fallbackName,
              phone: extractedPhone,
              area: extractedArea || 'N/A',
              budget: extractedBudget || 'Not Provided'
            };

            const transcript = newMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

            console.log("Saving lead to Supabase enquiries:", leadData);

            // Save to Supabase using createEnquiry
            try {
              const newEnquiry = await createEnquiry({
                name: leadData.name,
                phone: leadData.phone,
                location: leadData.area,
                investment_capacity: leadData.budget,
                status: 'NEW',
                source: 'CHAT'
              });

              // Also add the transcript as a timeline event
              await supabase.from('enquiry_timeline').insert([{
                enquiry_id: newEnquiry.id,
                action_type: 'CHAT_TRANSCRIPT',
                description: 'Initial chat transcript saved.\n\n' + transcript + `\n\nASSISTANT: ${aiResponse.trim()}`
              }]);
              
              console.log("Successfully saved lead to Supabase enquiries!");
            } catch (dbError) {
              console.error("Supabase insert error:", dbError);
            }

            // Send Instant Email Notification via Resend API
            try {
              await fetch('/api/resend/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: 'Convenio Mart AI Bot <info@atyourdoor.life>',
                  to: ['conveniomart@lordsandkingsagro.com'],
                  subject: `New AI Chatbot Lead: ${leadData.name} (${leadData.area})`,
                  html: `
                    <h3>New Chatbot Lead</h3>
                    <p><strong>Name:</strong> ${leadData.name}</p>
                    <p><strong>Phone:</strong> ${leadData.phone}</p>
                    <p><strong>Area:</strong> ${leadData.area}</p>
                    <p><strong>Budget:</strong> ${leadData.budget}</p>
                    <p><strong>Source:</strong> AI Chatbot</p>
                    <hr/>
                    <h4>Chat Transcript:</h4>
                    <pre style="white-space: pre-wrap; font-family: sans-serif;">${transcript + `\n\nASSISTANT: ${aiResponse.trim()}`}</pre>
                  `
                })
              });
              console.log("Resend chatbot email notification sent successfully!");
            } catch (emailErr) {
              console.error("Resend email notification error:", emailErr);
            }
          } catch (e) {
            console.error("Failed to save conversational lead details:", e);
          }
        }

        setMessages([...newMessages, { role: 'assistant', content: aiResponse }]);
      } else {
        const errorMsg = data.error ? data.error.message : "Unknown API error";
        setMessages([...newMessages, { role: 'assistant', content: `I'm having trouble connecting to my brain. The API said: ${errorMsg}` }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'assistant', content: `Sorry, something went wrong on my end. Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isLandingPage = location.pathname === '/landing' || location.pathname === '/home';

  return (
    <>
      {/* Top-Right Floating Action Buttons (Enquiry Page only) */}
      {!isOpen && !isLandingPage && (
        <div className="fixed top-24 right-4 sm:right-6 z-40 flex flex-col gap-3 items-center">
          {/* Chat Icon Button */}
          <button
            onClick={() => setIsOpen(true)}
            title="AI Chat"
            className="p-3.5 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 transition-all transform hover:scale-110 flex items-center justify-center"
          >
            <Bot className="h-6 w-6" />
          </button>

          {/* WhatsApp Icon Button */}
          <a
            href="https://wa.me/918072557159?text=Hi%20Convenio%20Mart,%20I%20am%20interested%20in%20franchise%20details."
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            className="p-3.5 bg-[#25D366] text-white rounded-full shadow-xl hover:bg-[#128C7E] transition-all transform hover:scale-110 flex items-center justify-center"
          >
            <MessageCircle className="h-6 w-6" />
          </a>
        </div>
      )}

      {/* Bottom-Right Doubts Floating Button (Landing Page Desktop view) */}
      {!isOpen && isLandingPage && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-all transform hover:scale-105 z-50 hidden md:flex items-center gap-2"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="font-bold">Doubts?</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-red-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold leading-tight">Convi</h3>
                <p className="text-xs text-red-100">AI Franchise Consultant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-red-100 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`space-y-2 max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none p-3 shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
