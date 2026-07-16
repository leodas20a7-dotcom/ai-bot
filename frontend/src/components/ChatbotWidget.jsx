import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are Convi, the AI Franchise Consultant for Convenio Mart.
Your goal is to politely answer questions and collect the user's Name, Phone Number, Area, and Budget.
Keep your answers very short (1-2 sentences max).

KNOWLEDGE BASE:
- Minimum Investment: 15 Lakhs to 20 Lakhs. (If their budget is 15 Lakhs or more, they qualify perfectly!)
- Franchise Fee: 3 Lakhs to 5 Lakhs (100% refundable).
- Estimated Monthly Revenue: 35,000 - 50,000 per month.
- Profit Sharing: 70% to Franchise Owner, 30% to Corporate.
- Loan Assistance: We provide up to 75% bank funding.

CONVERSATION RULES (STRICT):
1. 15 Lakhs is a GREAT budget. If they say 15 Lakhs, congratulate them and say they qualify.
2. If their budget is LESS than 15 Lakhs, politely mention that we provide up to 75% bank loan assistance.
3. If they repeatedly insist they only have a low budget even after hearing about the loan, gracefully accept it. Say "Thank you for your interest, our team will reach out to discuss options." and immediately ask for their Phone Number, or suggest they fill out the 'Enquire your Franchise' form.
4. First, politely collect their Name, Area, and Budget.
5. ONLY AFTER you have successfully collected their Name, Area, AND Budget, you must ask for their Phone Number as the final step. Do NOT ask for their Phone Number upfront.
6. PHONE NUMBER VALIDATION: When the user provides their phone number, you MUST verify that it contains exactly 10 digits. If it does not contain exactly 10 digits, politely tell them it is invalid and ask them to enter a valid 10-digit phone number. Do not accept the number or summarize the conversation until a valid 10-digit number is provided.

***END OF CONVERSATION TRIGGER***
As soon as you have collected ALL FOUR details (Name, Phone Number, Area, Budget), you MUST summarize them at the very bottom of your message like this:

- Name: [Their Name]
- Phone: [Their Phone Number]
- Area: [Their Area]
- Budget: [Their Budget]

After the summary, you must say "Great! Our senior manager will call you shortly to discuss further." and stop talking.`;

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! 👋 I'm Convi, the AI Franchise Consultant. Are you looking to start a supermarket franchise?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/groq/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages
          ],
          temperature: 0.1,
          top_p: 0.1,
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
        
        // Extract Lead Data via natural language summary (ignoring markdown bold/italics)
        const nameMatch = aiResponse.match(/Name[^:\n]*:\s*([^\n]+)/i);
        const phoneMatch = aiResponse.match(/Phone[^:\n]*:\s*([^\n]+)/i);
        const areaMatch = aiResponse.match(/Area[^:\n]*:\s*([^\n]+)/i);
        const budgetMatch = aiResponse.match(/Budget[^:\n]*:\s*([^\n]+)/i);
        
        // We look for all four to exist in the response
        if (nameMatch && phoneMatch && areaMatch && budgetMatch) {
          try {
            const leadData = {
              name: nameMatch[1].replace(/[*_]/g, '').trim(),
              phone: phoneMatch[1].replace(/[*_]/g, '').trim(),
              area: areaMatch[1].replace(/[*_]/g, '').trim(),
              budget: budgetMatch[1].replace(/[*_]/g, '').trim()
            };
            
            // Format chat transcript
            const transcript = newMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
            
            // Save to Supabase
            const { error: dbError } = await supabase.from('chat_leads').insert([{
              name: leadData.name,
              phone: leadData.phone,
              area: leadData.area,
              budget: leadData.budget,
              transcript: transcript + `\n\nASSISTANT: ${aiResponse.trim()}`
            }]);

            if (dbError) {
              console.error("Supabase insert error:", dbError);
            } else {
              console.log("Successfully saved lead to Supabase!");
            }
          } catch (e) {
            console.error("Failed to parse conversational lead details:", e);
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 transition-all transform hover:scale-105 z-50 ${isOpen ? 'hidden' : 'flex'} items-center gap-2`}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="font-bold hidden sm:inline">Doubts?</span>
      </button>

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
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold" {...props} />
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
