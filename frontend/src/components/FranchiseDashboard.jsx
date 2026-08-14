import React, { useState, useEffect } from 'react';
import { useEnquiries } from '../hooks/useEnquiries';
import { useLeadFilters } from '../hooks/useLeadFilters';
import LeadTableRow from './LeadTableRow';
import AnalyticsCharts from './AnalyticsCharts';
import EnquiryDetailsModal from './EnquiryDetailsModal';
import DraftReviewModal from './DraftReviewModal';
import FollowUpChoiceModal from './FollowUpChoiceModal';
import ScheduleReminderModal from './ScheduleReminderModal';
import { 
  RefreshCcw, Calendar, Phone, MapPin, ChevronDown, MessageSquare, 
  DollarSign, BellRing, Bot, FileText, Filter, Search, TrendingUp, 
  RotateCcw, Eye, Trash2, Users, BarChart3, CheckCircle2, X 
} from 'lucide-react';

const ENQUIRY_STATUSES = [
  'NEW', 'FIRST_CALL', 'INTERESTED', 'CALL_LATER',
  'NO_RESPONSE', 'NOT_INTERESTED', 'READY_TO_PAY', 'PAYMENT_RECEIVED', 
  'APPROVED', 'COMPLETED'
];

const STATUS_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Statuses', color: 'bg-slate-400' },
  { id: 'ACTIVE', label: 'Active Only', color: 'bg-blue-500' },
  { id: 'CLOSED', label: 'Closed/Won', color: 'bg-emerald-500' },
  { id: 'NEW', label: 'New', color: 'bg-slate-500' },
  { id: 'FIRST_CALL', label: 'First Call', color: 'bg-indigo-500' },
  { id: 'INTERESTED', label: 'Interested', color: 'bg-amber-500' },
  { id: 'READY_TO_PAY', label: 'Ready To Pay', color: 'bg-purple-500' },
  { id: 'APPROVED', label: 'Approved', color: 'bg-teal-500' },
  { id: 'NOT_INTERESTED', label: 'Not Interested', color: 'bg-rose-500' }
];

const getStatusColor = (status) => {
  if (['NEW', 'NO_RESPONSE'].includes(status)) return 'bg-slate-100 text-slate-700 border-slate-300';
  if (['FIRST_CALL'].includes(status)) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (['INTERESTED', 'CALL_LATER'].includes(status)) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (['NOT_INTERESTED'].includes(status)) return 'bg-red-50 text-red-700 border-red-200';
  if (['READY_TO_PAY'].includes(status)) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (['PAYMENT_RECEIVED'].includes(status)) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (['APPROVED', 'COMPLETED'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-700 border-slate-300';
};

const getNextActionText = (status) => {
  switch(status) {
    case 'NEW': return 'Make First Call';
    case 'FIRST_CALL': return 'Awaiting Decision';
    case 'INTERESTED': return 'Send Brochure';
    case 'CALL_LATER': return 'Follow up later';
    case 'NO_RESPONSE': return 'Follow up again';
    case 'READY_TO_PAY': return 'Send Payment Details';
    case 'PAYMENT_RECEIVED': return 'Verify & Approve';
    case 'APPROVED': return 'Finalize Onboarding';
    case 'COMPLETED':
    case 'NOT_INTERESTED':
      return 'None';
    default: return 'None';
  }
};

const getNextStatusOptions = (status) => {
  switch(status) {
    case 'NEW': return ['FIRST_CALL'];
    case 'FIRST_CALL': return ['INTERESTED', 'CALL_LATER', 'NO_RESPONSE', 'NOT_INTERESTED'];
    case 'CALL_LATER': return ['FIRST_CALL', 'NO_RESPONSE', 'NOT_INTERESTED'];
    case 'NO_RESPONSE': return ['FIRST_CALL', 'NOT_INTERESTED'];
    case 'INTERESTED': return ['READY_TO_PAY', 'NOT_INTERESTED'];
    case 'READY_TO_PAY': return ['PAYMENT_RECEIVED'];
    case 'PAYMENT_RECEIVED': return ['APPROVED'];
    case 'APPROVED': return ['COMPLETED'];
    case 'COMPLETED': return [];
    default: return [];
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function FranchiseDashboard() {
  const {
    enquiries,
    dueTasks,
    loading,
    isAlertDismissed,
    dismissAlert,
    fetchEnquiriesData,
    handleStatusChange,
    handleDeleteLead
  } = useEnquiries();

  const {
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateFilter,
    setDateFilter,
    searchQuery,
    setSearchQuery,
    filteredEnquiries,
    resetFilters
  } = useLeadFilters(enquiries);

  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [draftReview, setDraftReview] = useState(null);
  const [followUpChoice, setFollowUpChoice] = useState(null);
  const [scheduleReminder, setScheduleReminder] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [openStatusPopoverId, setOpenStatusPopoverId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuMode, setActionMenuMode] = useState('main');
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(false);

  const isAnyModalOpen = Boolean(selectedEnquiryId || draftReview || followUpChoice || scheduleReminder || showFilterModal);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      setSelectedEnquiryId(null);
      setDraftReview(null);
      setFollowUpChoice(null);
      setScheduleReminder(null);
      setShowFilterModal(false);
      setIsStatusDropdownOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAnyModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <RefreshCcw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const totalEnquiries = enquiries.length;
  const chatLeads = enquiries.filter(e => e.source === 'CHAT').length;
  const formLeads = enquiries.filter(e => e.source === 'FORM').length;
  const conversions = enquiries.filter(e => ['APPROVED', 'COMPLETED'].includes(e.status)).length;

  return (
    <div className="flex flex-col gap-4 flex-1 h-full relative">
      
      {/* Click-away overlay for popovers */}
      {(openStatusPopoverId || openActionMenuId) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpenStatusPopoverId(null);
            setOpenActionMenuId(null);
          }}
        />
      )}
      
      {/* Due Tasks Alert Banner */}
      {(dueTasks.length > 0 && !isAlertDismissed) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start sm:items-center gap-4 shrink-0 shadow-sm relative">
          <div className="bg-red-100 p-2 rounded-full">
            <BellRing className="h-5 w-5 text-red-600 animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="text-red-900 font-bold text-sm">Action Required: Pending Follow-ups</h4>
            <p className="text-red-700 text-xs mt-0.5">
              You have {dueTasks.length} scheduled follow-up{dueTasks.length !== 1 ? 's' : ''} currently due for: <span className="font-bold">{dueTasks.map(t => t.enquiries?.name || 'Unknown').join(', ')}</span>.
            </p>
          </div>
          <button 
            onClick={() => setSelectedEnquiryId(dueTasks[0].enquiry_id)}
            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap mr-6"
          >
            Review Now
          </button>
          
          <button 
            onClick={dismissAlert}
            className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Dismiss Alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Total Leads</p>
            <p className="text-xl sm:text-3xl font-black text-slate-800">{totalEnquiries}</p>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-500 mt-1 sm:mt-2 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> 2 today</p>
          </div>
          <div className="bg-blue-50 text-blue-500 p-2 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <Users className="h-4 w-4 sm:h-7 sm:w-7" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Chat Leads</p>
            <p className="text-xl sm:text-3xl font-black text-slate-800">{chatLeads}</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1 sm:mt-2 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> 0%</p>
          </div>
          <div className="bg-purple-50 text-purple-500 p-2 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <MessageSquare className="h-4 w-4 sm:h-7 sm:w-7" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Form Leads</p>
            <p className="text-xl sm:text-3xl font-black text-slate-800">{formLeads}</p>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-500 mt-1 sm:mt-2 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> 100%</p>
          </div>
          <div className="bg-emerald-50 text-emerald-500 p-2 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <FileText className="h-4 w-4 sm:h-7 sm:w-7" />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Conversions</p>
            <p className="text-xl sm:text-3xl font-black text-slate-800">{conversions}</p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1 sm:mt-2 flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> 0%</p>
          </div>
          <div className="bg-orange-50 text-orange-500 p-2 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <DollarSign className="h-4 w-4 sm:h-7 sm:w-7" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setShowCharts(!showCharts)}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-blue-500" />
          {showCharts ? 'Hide Charts' : 'Charts'}
        </button>
      </div>

      {showCharts && <AnalyticsCharts />}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[400px]">
        
        {/* Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, city..."
              className="pl-10 pr-4 py-2.5 bg-slate-100/80 border-0 rounded-full text-sm focus:outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500 w-full transition-all font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border shadow-xs ${
                statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Filter className="h-4 w-4 text-blue-600" />
              <span>Filters</span>
              {(statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <span className="h-5 w-5 bg-blue-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center">
                  {[statusFilter !== 'ALL', sourceFilter !== 'ALL', dateFilter !== 'ALL'].filter(Boolean).length}
                </span>
              )}
            </button>

            {(statusFilter !== 'ALL' || sourceFilter !== 'ALL' || dateFilter !== 'ALL' || searchQuery !== '') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3.5 py-2.5 rounded-full text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* MOBILE CARD VIEW (< md) */}
        <div className="md:hidden flex-1 overflow-y-auto pb-32 px-2 pt-2 space-y-2.5">
          {filteredEnquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-base font-bold text-slate-600">No franchise enquiries found.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting filters or searching another keyword.</p>
            </div>
          ) : (
            filteredEnquiries.map(enquiry => (
              <div
                key={enquiry.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm relative active:bg-slate-50 transition-colors"
              >
                <div className="p-3.5 flex items-center gap-3">
                  <div
                    className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => setSelectedEnquiryId(enquiry.id)}
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-lg shrink-0 border border-blue-200/60 shadow-xs">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900 text-base truncate leading-tight">{enquiry.name}</div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />{enquiry.phone}</span>
                        {enquiry.location && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{enquiry.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusPopoverId(openStatusPopoverId === enquiry.id ? null : enquiry.id);
                        setOpenActionMenuId(null);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-bold border shadow-xs transition-transform active:scale-95 ${getStatusColor(enquiry.status)}`}
                    >
                      {enquiry.status.replace(/_/g, ' ')}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openStatusPopoverId === enquiry.id ? 'rotate-180' : ''}`} />
                    </button>

                    {openStatusPopoverId === enquiry.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 z-[65] animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-xs uppercase font-extrabold text-slate-400 mb-1.5 px-2 tracking-wider">Change Status</div>
                        <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
                          {ENQUIRY_STATUSES.map(status => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(enquiry.id, status, setFollowUpChoice, setDraftReview);
                                setOpenStatusPopoverId(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex justify-between items-center transition-colors ${
                                enquiry.status === status ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {status.replace(/_/g, ' ')}
                              {enquiry.status === status && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3.5 pb-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-2">
                    {enquiry.source === 'CHAT' ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-md text-xs font-bold border border-green-200">
                        <Bot className="h-3.5 w-3.5" /> Chat
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-bold border border-blue-200">
                        <FileText className="h-3.5 w-3.5" /> Form
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(enquiry.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedEnquiryId(enquiry.id)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLead(enquiry)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto flex-1 pb-32">
          {openStatusPopoverId && (
            <div className="fixed inset-0 z-[55]" onClick={() => setOpenStatusPopoverId(null)} />
          )}
          {openActionMenuId && (
            <div className="fixed inset-0 z-[45]" onClick={() => setOpenActionMenuId(null)} />
          )}
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Source</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-left">Next Action</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnquiries.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400 italic">No franchise enquiries yet.</td></tr>
              ) : (
                filteredEnquiries.map(enquiry => (
                  <LeadTableRow
                    key={enquiry.id}
                    enquiry={enquiry}
                    enquiryStatuses={ENQUIRY_STATUSES}
                    openStatusPopoverId={openStatusPopoverId}
                    setOpenStatusPopoverId={setOpenStatusPopoverId}
                    openActionMenuId={openActionMenuId}
                    setOpenActionMenuId={setOpenActionMenuId}
                    actionMenuMode={actionMenuMode}
                    setActionMenuMode={setActionMenuMode}
                    statusSearchQuery={statusSearchQuery}
                    setStatusSearchQuery={setStatusSearchQuery}
                    getStatusColor={getStatusColor}
                    getNextActionText={getNextActionText}
                    getNextStatusOptions={getNextStatusOptions}
                    formatDate={formatDate}
                    onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus, setFollowUpChoice, setDraftReview)}
                    onViewDetails={setSelectedEnquiryId}
                    onManageFollowUp={(e) => setFollowUpChoice({ enquiry: e, newStatus: e.status })}
                    onDeleteLead={handleDeleteLead}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {selectedEnquiryId && (
          <EnquiryDetailsModal 
            enquiryId={selectedEnquiryId} 
            onClose={() => setSelectedEnquiryId(null)} 
            onUpdate={fetchEnquiriesData}
          />
        )}

        {/* Draft Review Modal */}
        {draftReview && (
          <DraftReviewModal 
            enquiry={draftReview.enquiry}
            newStatus={draftReview.newStatus}
            onClose={() => setDraftReview(null)}
            onSent={() => setDraftReview(null)}
          />
        )}

        {/* Follow-up Choice Modal */}
        {followUpChoice && (
          <FollowUpChoiceModal
            enquiry={followUpChoice.enquiry}
            onClose={() => setFollowUpChoice(null)}
            onSelectSetReminder={() => {
              setScheduleReminder(followUpChoice);
              setFollowUpChoice(null);
            }}
            onSelectAskCustomer={() => {
              setDraftReview(followUpChoice);
              setFollowUpChoice(null);
            }}
          />
        )}

        {/* Schedule Reminder Modal */}
        {scheduleReminder && (
          <ScheduleReminderModal
            enquiry={scheduleReminder.enquiry}
            onClose={() => setScheduleReminder(null)}
            onSaved={() => {
              setScheduleReminder(null);
              fetchEnquiriesData();
            }}
          />
        )}

        {/* Filter Overlay Popup Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Filter Leads</h3>
                    <p className="text-xs text-slate-500 font-medium">Refine your lead dashboard results</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Lead Status</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-sm font-semibold rounded-2xl px-4 py-3 flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs"
                    >
                      <span className="font-bold text-slate-800 text-sm">
                        {STATUS_FILTER_OPTIONS.find(o => o.id === statusFilter)?.label || 'All Statuses'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>

                    {isStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-20 overflow-hidden p-1.5 space-y-0.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                          {STATUS_FILTER_OPTIONS.map(opt => {
                            const isSelected = statusFilter === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setStatusFilter(opt.id);
                                  setIsStatusDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-700 shadow-xs font-bold'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <span className="text-sm font-semibold">{opt.label}</span>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Lead Source</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ALL', label: 'All Sources' },
                      { id: 'CHAT', label: 'AI Chatbot' },
                      { id: 'FORM', label: 'Enquiry Form' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSourceFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          sourceFilter === opt.id
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Time Period</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ALL', label: 'All Time' },
                      { id: 'TODAY', label: 'Today' },
                      { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                      { id: 'LAST_30_DAYS', label: 'Last 30 Days' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setDateFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          dateFilter === opt.id
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
