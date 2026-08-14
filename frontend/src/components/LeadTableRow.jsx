import React from 'react';
import { Calendar, Phone, Mail, MapPin, Bot, FileText, ChevronDown, CheckCircle2, MoreVertical } from 'lucide-react';
import LeadActionMenu from './LeadActionMenu';

export default function LeadTableRow({
  enquiry,
  enquiryStatuses,
  openStatusPopoverId,
  setOpenStatusPopoverId,
  openActionMenuId,
  setOpenActionMenuId,
  actionMenuMode,
  setActionMenuMode,
  statusSearchQuery,
  setStatusSearchQuery,
  getStatusColor,
  getNextActionText,
  getNextStatusOptions,
  formatDate,
  onStatusChange,
  onViewDetails,
  onManageFollowUp,
  onDeleteLead
}) {
  const isStatusOpen = openStatusPopoverId === enquiry.id;
  const isActionOpen = openActionMenuId === enquiry.id;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {formatDate(enquiry.created_at)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
            {enquiry.name.charAt(0).toUpperCase()}
          </div>
          <div className="font-bold text-slate-900">{enquiry.name}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs">
        <div className="flex items-center gap-1 mb-1">
          <Phone className="h-3 w-3 text-slate-400" /> {enquiry.phone}
        </div>
        {enquiry.email && (
          <div className="flex items-center gap-1 text-slate-400">
            <Mail className="h-3 w-3 text-slate-400" /> {enquiry.email}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-xs">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-slate-400" /> {enquiry.location || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {enquiry.source === 'CHAT' ? (
          <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-xs font-bold border border-green-100">
            <Bot className="h-3 w-3" /> Chat
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
            <FileText className="h-3 w-3" /> Form
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="relative inline-block text-center">
          <button
            onClick={() => {
              setOpenStatusPopoverId(isStatusOpen ? null : enquiry.id);
              setOpenActionMenuId(null);
            }}
            className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs rounded-full font-bold shadow-sm transition-all hover:ring-2 hover:ring-slate-200 hover:ring-offset-1 ${getStatusColor(enquiry.status)}`}
          >
            {enquiry.status.replace(/_/g, ' ')}
            <ChevronDown className={`h-3 w-3 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
          </button>
          {isStatusOpen && (
            <div className="absolute right-1/2 translate-x-1/2 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in slide-in-from-top-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-2 text-left">Next Steps</div>
              {getNextStatusOptions(enquiry.status).length > 0 ? (
                <div className="flex flex-col gap-1">
                  {getNextStatusOptions(enquiry.status).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        onStatusChange(enquiry.id, opt);
                        setOpenStatusPopoverId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      {opt.replace(/_/g, ' ')}
                      <div className="h-4 w-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-2 text-xs text-slate-500 italic text-left">No next steps available.</div>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-bold text-slate-500">
        {getNextActionText(enquiry.status)}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="relative inline-block text-left">
          <button
            onClick={() => {
              setOpenActionMenuId(isActionOpen ? null : enquiry.id);
              setActionMenuMode('main');
              setStatusSearchQuery('');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {isActionOpen && (
            <LeadActionMenu
              enquiry={enquiry}
              statuses={enquiryStatuses}
              actionMenuMode={actionMenuMode}
              setActionMenuMode={setActionMenuMode}
              statusSearchQuery={statusSearchQuery}
              setStatusSearchQuery={setStatusSearchQuery}
              onViewDetails={onViewDetails}
              onStatusChange={onStatusChange}
              onManageFollowUp={onManageFollowUp}
              onDeleteLead={onDeleteLead}
              onClose={() => setOpenActionMenuId(null)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
