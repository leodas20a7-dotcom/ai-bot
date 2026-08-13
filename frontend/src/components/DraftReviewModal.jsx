import React, { useState, useEffect } from 'react';
import { sendEmail, saveCommunicationDraft, getTemplates } from '../lib/api';
import { useDialog } from './Dialog';
import { X, Send, Mail, MessageCircle, ArrowRight } from 'lucide-react';

const loadDynamicTemplate = async (channel, status, enquiry) => {
  try {
    const templates = await getTemplates();
    const template = templates.find(t => t.type === channel && t.status_trigger === status && t.is_system);
    
    if (template) {
      let parsedBody = template.body;
      // Replace variables
      parsedBody = parsedBody.replace(/\[Name\]/g, enquiry.name || '');
      parsedBody = parsedBody.replace(/\[Location\]/g, enquiry.location || '');
      parsedBody = parsedBody.replace(/\[Investment_Capacity\]/g, enquiry.investment_capacity || '');
      parsedBody = parsedBody.replace(/\[Date\]/g, new Date().toLocaleDateString());
      
      // Append attachment link if present
      if (template.attachment_url) {
        if (channel === 'EMAIL') {
          parsedBody += `<br><br><a href="${template.attachment_url}">Download Attachment</a>`;
        } else {
          parsedBody += `\n\nDocument Link: ${template.attachment_url}`;
        }
      }
      
      return { body: parsedBody, subject: template.name };
    }
  } catch (e) {
    console.error("Failed to load templates", e);
  }
  return { body: `Default ${channel} message for ${status}. (Template missing in settings)`, subject: `Update for ${enquiry.name}` };
};

// Replaced by template name as subject

export default function DraftReviewModal({ enquiry, newStatus, onClose, onSent }) {
  const [selectedChannel, setSelectedChannel] = useState(null); // 'EMAIL' or 'WHATSAPP'
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useDialog();

  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      if (selectedChannel) {
        setIsLoadingTemplate(true);
        const { body, subject: newSubject } = await loadDynamicTemplate(selectedChannel, newStatus, enquiry);
        setContent(body);
        if (selectedChannel === 'EMAIL') {
          setSubject(newSubject);
        }
        setIsLoadingTemplate(false);
      }
    }
    loadTemplate();
  }, [selectedChannel, enquiry, newStatus]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (selectedChannel === 'EMAIL') {
        if (enquiry.email) {
          await sendEmail(enquiry.email, subject, content);
        } else {
          showToast('Warning: No email address found. Marking as approved without sending.', 'warning');
        }
        
        await saveCommunicationDraft({
          enquiry_id: enquiry.id,
          channel: 'EMAIL',
          content: content,
          status: 'APPROVED_SENT',
          sent_at: new Date().toISOString()
        });
      } else if (selectedChannel === 'WHATSAPP') {
        if (enquiry.phone) {
          const cleanPhone = enquiry.phone.replace(/\D/g, '');
          const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
          // Strip all emojis and broken chars before sending
          const cleanContent = content
            .replace(/\uFFFD/g, '')
            .replace(/[\u25A0-\u25FF]/g, '')
            .replace(/[\u2600-\u27BF]/g, '')
            .replace(/[\uFE00-\uFE0F]/g, '')
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
            .replace(/[\u{2300}-\u{23FF}]/gu, '')
            .replace(/  +/g, ' ')
            .trim();
          const encodedText = encodeURIComponent(cleanContent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = `whatsapp://send?phone=${phoneWithCountry}&text=${encodedText}`;
          } else {
            window.open(`https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`, '_blank');
          }
        }
        
        await saveCommunicationDraft({
          enquiry_id: enquiry.id,
          channel: 'WHATSAPP',
          content: content,
          status: 'APPROVED_SENT',
          sent_at: new Date().toISOString()
        });
      }

      onSent(); // Completes the status change flow
    } catch (err) {
      console.error(err);
      showToast(`Failed to send: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedChannel) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden zoom-in-95 duration-200 border border-slate-100 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">How do you want to contact {enquiry.name}?</h2>
          <p className="text-sm text-slate-500 mb-8">Choose a channel to review and send the automated update.</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setSelectedChannel('WHATSAPP')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-green-500 hover:bg-green-50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800 group-hover:text-green-700">WhatsApp</div>
                  <div className="text-xs text-slate-500">{enquiry.phone || 'No phone number'}</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-green-500 transition-colors" />
            </button>
            
            <button 
              onClick={() => setSelectedChannel('EMAIL')}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-800 group-hover:text-blue-700">Email</div>
                  <div className="text-xs text-slate-500">{enquiry.email || 'No email address'}</div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>
          </div>
          
          <button onClick={onClose} className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              {selectedChannel === 'WHATSAPP' ? <MessageCircle className="h-5 w-5 text-green-500"/> : <Mail className="h-5 w-5 text-blue-500"/>} 
              Review {selectedChannel === 'WHATSAPP' ? 'WhatsApp' : 'Email'} Message
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Please review the template before sending.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto bg-white">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              To {selectedChannel === 'WHATSAPP' ? '(Phone)' : '(Email)'}:
            </label>
            <div className="text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium">
              {selectedChannel === 'WHATSAPP' 
                ? (enquiry.phone || <span className="text-red-500 font-bold">Missing Phone Number</span>)
                : (enquiry.email ? `${enquiry.name} <${enquiry.email}>` : <span className="text-red-500 font-bold">Missing Email Address</span>)
              }
            </div>
          </div>

          {selectedChannel === 'EMAIL' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject:</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {selectedChannel === 'WHATSAPP' ? 'WhatsApp Message:' : 'Message Body (HTML Supported):'}
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoadingTemplate}
              placeholder={isLoadingTemplate ? "Loading template from database..." : ""}
              className="w-full flex-1 min-h-[250px] text-sm p-4 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y disabled:opacity-50"
            />
            {selectedChannel === 'WHATSAPP' && (
              <p className="text-xs text-slate-500 mt-2">
                Clicking "Send" will open a new WhatsApp Web tab with this message ready.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setSelectedChannel(null)}
            disabled={isSending}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
          >
            &larr; Back to Channels
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSend}
              disabled={isSending}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm disabled:opacity-70 ${
                selectedChannel === 'WHATSAPP' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
