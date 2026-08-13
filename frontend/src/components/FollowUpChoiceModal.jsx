import React from 'react';
import { X, CalendarClock, MessageCircleQuestion } from 'lucide-react';

export default function FollowUpChoiceModal({ enquiry, onClose, onSelectSetReminder, onSelectAskCustomer }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Follow-up Action</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6 text-center">
            How would you like to handle the follow-up for <strong>{enquiry?.name}</strong>?
          </p>

          <div className="space-y-4">
            <button
              onClick={onSelectSetReminder}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <CalendarClock className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Set Reminder Now</h3>
                <p className="text-xs text-slate-500 mt-1">I already know the date and time to call them back.</p>
              </div>
            </button>

            <button
              onClick={onSelectAskCustomer}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
            >
              <div className="bg-emerald-100 p-3 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <MessageCircleQuestion className="w-6 h-6 text-emerald-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Ask Customer via Message</h3>
                <p className="text-xs text-slate-500 mt-1">Send an automated message asking when to reach them.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
