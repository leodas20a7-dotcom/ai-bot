import React, { useState } from 'react';
import { X, Save, Clock, Calendar, MessageSquare, Mail, Send } from 'lucide-react';
import { createFollowUpTask, getTemplates } from '../lib/api';
import { useDialog } from './Dialog';
import { openOrFocusTab, triggerWhatsAppMessage } from '../lib/openSingleTab';

export default function ScheduleReminderModal({ enquiry, onClose, onSaved }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [channel, setChannel] = useState('WHATSAPP');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useDialog();

  const handleSave = async () => {
    if (!date || !time) {
      showToast('Please select both date and time.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const scheduledDateTime = new Date(`${date}T${time}`);
      const scheduledAt = scheduledDateTime.toISOString();

      // 1. Create Follow Up Task for Admin
      await createFollowUpTask({
        enquiry_id: enquiry.id,
        task_type: 'CALL',
        scheduled_at: scheduledAt,
        status: 'PENDING'
      });

      // 2. Immediately send confirmation to client if enabled
      if (sendConfirmation && enquiry) {
        const formattedDate = scheduledDateTime.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const formattedTime = scheduledDateTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const timeString = `${formattedDate} at ${formattedTime}`;

        let confirmationMsg = `Hi ${enquiry.name || 'there'},\n\nAs discussed, we have scheduled a call back with you on ${timeString}. Please let us know if you would like to adjust this time!\n\nBest regards,\nConvenio Mart Team`;

        // Check if there is an admin-customized CALL_LATER_CONFIRM or CALL_LATER template from Supabase
        try {
          const dbTemplates = await getTemplates();
          const matchTmpl = dbTemplates.find(t => t.type === channel && t.status_trigger === 'CALL_LATER_CONFIRM') ||
                            dbTemplates.find(t => t.type === channel && t.status_trigger === 'CALL_LATER');
          if (matchTmpl && matchTmpl.body) {
            let bodyText = matchTmpl.body;
            if (channel === 'EMAIL') {
              bodyText = bodyText
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
            }
            confirmationMsg = bodyText
              .replace(/\[Name\]/gi, enquiry.name || 'there')
              .replace(/\[Date\]/gi, timeString)
              .replace(/\[Location\]/gi, enquiry.location || '')
              .replace(/\[Investment_Capacity\]/gi, enquiry.investment_capacity || '');
          }
        } catch (tmplErr) {
          console.warn('Using fallback call-back confirmation template', tmplErr);
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (channel === 'WHATSAPP' && enquiry.phone) {
          triggerWhatsAppMessage(enquiry.phone, confirmationMsg);

          // Log to timeline
          try {
            const { supabase } = await import('../lib/supabase.js');
            await supabase.from('enquiry_timeline').insert([{
              enquiry_id: enquiry.id,
              action_type: 'WHATSAPP_SENT',
              description: `Sent call-back confirmation for ${timeString}`
            }]);
          } catch (tErr) {
            console.error('Failed to log timeline', tErr);
          }

        } else if (channel === 'EMAIL' && enquiry.email) {
          const mailSubject = `Confirming our Call Back for ${formattedDate}`;
          const mailUrl = isMobile
            ? `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(confirmationMsg)}`
            : `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(enquiry.email)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(confirmationMsg)}`;

          if (isMobile) {
            window.open(mailUrl, '_blank');
          } else {
            openOrFocusTab('EMAIL', mailUrl);
          }

          // Log to timeline
          try {
            const { supabase } = await import('../lib/supabase.js');
            await supabase.from('enquiry_timeline').insert([{
              enquiry_id: enquiry.id,
              action_type: 'EMAIL_SENT',
              description: `Sent call-back confirmation email for ${timeString}`
            }]);
          } catch (tErr) {
            console.error('Failed to log timeline', tErr);
          }
        }
      }

      showToast(sendConfirmation ? 'Reminder saved & confirmation message launched!' : 'Reminder saved successfully!', 'success');
      onSaved();
    } catch (err) {
      console.error(err);
      showToast('Failed to save reminder.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Set Call Back & Confirm</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Set the call-back reminder for <strong>{enquiry?.name}</strong>:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Client requested call back after 3 PM..."
              rows={2}
              className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Instant Client Confirmation Toggle */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={sendConfirmation}
                onChange={(e) => setSendConfirmation(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Send confirmation message to client
              </span>
            </label>

            {sendConfirmation && (
              <div className="flex gap-2 pt-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'WHATSAPP' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'EMAIL' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Email
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-medium text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sendConfirmation ? (
              <Send className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {sendConfirmation ? 'Save & Send Confirmation' : 'Save Reminder Only'}
          </button>
        </div>
      </div>
    </div>
  );
}
