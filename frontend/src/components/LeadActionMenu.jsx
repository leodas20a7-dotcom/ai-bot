import React from 'react';
import { Eye, RefreshCcw, CalendarClock, Trash2, Search, CheckCircle2 } from 'lucide-react';

export default function LeadActionMenu({
  enquiry,
  statuses,
  actionMenuMode,
  setActionMenuMode,
  statusSearchQuery,
  setStatusSearchQuery,
  onViewDetails,
  onStatusChange,
  onManageFollowUp,
  onDeleteLead,
  onClose
}) {
  return (
    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
      {actionMenuMode === 'main' ? (
        <>
          <button
            onClick={() => {
              onViewDetails(enquiry.id);
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
          >
            <Eye className="h-4 w-4 text-slate-400" /> View Details
          </button>
          <button
            onClick={() => {
              setActionMenuMode('status');
              setStatusSearchQuery('');
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
          >
            <RefreshCcw className="h-4 w-4 text-slate-400" /> Change Status
          </button>
          {(enquiry.status === 'CALL_LATER' || enquiry.status === 'NO_RESPONSE') && (
            <button
              onClick={() => {
                onManageFollowUp(enquiry);
                onClose();
              }}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors"
            >
              <CalendarClock className="h-4 w-4 text-blue-500" /> Manage Follow-up
            </button>
          )}
          <div className="h-px bg-slate-100 my-1 mx-2"></div>
          <button
            onClick={() => {
              onDeleteLead(enquiry);
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
          >
            <Trash2 className="h-4 w-4 text-red-400" /> Delete Lead
          </button>
        </>
      ) : (
        <div className="flex flex-col max-h-[300px]">
          <div className="px-2 py-1 sticky top-0 bg-white border-b border-slate-100">
            <div className="flex items-center mb-2">
              <button
                onClick={() => setActionMenuMode('main')}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-bold px-1"
              >
                &larr; Back
              </button>
            </div>
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search status..."
                value={statusSearchQuery}
                onChange={e => setStatusSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto px-1 py-1">
            {statuses.filter(s => s.replace(/_/g, ' ').toLowerCase().includes(statusSearchQuery.toLowerCase())).map(status => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(enquiry.id, status);
                  onClose();
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-md flex justify-between items-center group transition-colors ${
                  enquiry.status === status ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {status.replace(/_/g, ' ')}
                {enquiry.status === status && <CheckCircle2 className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
