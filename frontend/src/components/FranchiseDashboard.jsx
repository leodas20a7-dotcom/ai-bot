import React, { useState, useEffect } from 'react';
import { getEnquiries, updateEnquiryStatus, getDueTasks, deleteEnquiry } from '../lib/api';
import { useDialog } from './Dialog';
import { RefreshCcw, Calendar, User, Phone, MapPin, Building, ChevronDown, MessageSquare, Briefcase, FileCheck, DollarSign, BellRing, Bot, FileText, Filter, MoreVertical, Search, TrendingUp, RotateCcw, Eye, PhoneCall, MessageCircle, Edit, Trash2, Users, Mail, BarChart3, CheckCircle2, CalendarClock, X } from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import EnquiryDetailsModal from './EnquiryDetailsModal';
import DraftReviewModal from './DraftReviewModal';
import FollowUpChoiceModal from './FollowUpChoiceModal';
import ScheduleReminderModal from './ScheduleReminderModal';

const ENQUIRY_STATUSES = [
  'NEW', 'FIRST_CALL', 'INTERESTED', 'CALL_LATER',
  'NO_RESPONSE', 'NOT_INTERESTED', 'READY_TO_PAY', 'PAYMENT_RECEIVED', 
  'APPROVED', 'COMPLETED'
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

export default function FranchiseDashboard() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [dueTasks, setDueTasks] = useState([]);
  const [draftReview, setDraftReview] = useState(null);
  
  // Follow-up state
  const [followUpChoice, setFollowUpChoice] = useState(null);
  const [scheduleReminder, setScheduleReminder] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openStatusPopoverId, setOpenStatusPopoverId] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuMode, setActionMenuMode] = useState('main'); // 'main' or 'status'
  const [statusSearchQuery, setStatusSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const { showToast, showConfirm } = useDialog();

  const handleDeleteLead = async (enquiry) => {
    setOpenActionMenuId(null);
    const ok = await showConfirm(
      `Delete lead "${enquiry.name}"? This action cannot be undone.`,
      { danger: true, confirmLabel: 'Yes, Delete' }
    );
    if (!ok) return;
    try {
      await deleteEnquiry(enquiry.id);
      await fetchEnquiriesData();
      showToast(`Lead "${enquiry.name}" deleted.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete lead: ' + err.message, 'error');
    }
  };

  const fetchEnquiriesData = async () => {
    setLoading(true);
    try {
      const [data, tasksData] = await Promise.all([
        getEnquiries(),
        getDueTasks()
      ]);
      setEnquiries(data);
      setDueTasks(tasksData);
      
      // Check if we already dismissed the alert for this exact set of tasks
      const currentTaskIds = tasksData.map(t => t.id).sort().join(',');
      const dismissedTaskIds = localStorage.getItem('dismissedDueTasks');
      if (currentTaskIds && currentTaskIds === dismissedTaskIds) {
        setIsAlertDismissed(true);
      } else {
        setIsAlertDismissed(false);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      showToast('Failed to fetch leads: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiriesData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const enquiry = enquiries.find(e => e.id === id);
    if (!enquiry || enquiry.status === newStatus) return;

    // Optimistic DB update first for true CRM logic (Status separate from Comms)
    executeStatusUpdate(id, newStatus);

    if (newStatus === 'CALL_LATER') {
      setFollowUpChoice({ enquiry, newStatus });
      return;
    }

    const draftStatuses = ['INTERESTED', 'READY_TO_PAY', 'APPROVED', 'NO_RESPONSE'];
    if (draftStatuses.includes(newStatus)) {
      setDraftReview({ enquiry, newStatus });
    }
  };

  const executeStatusUpdate = async (id, newStatus) => {
    try {
      // Optimistic update
      setEnquiries(enquiries.map(e => e.id === id ? { ...e, status: newStatus } : e));
      await updateEnquiryStatus(id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
      fetchEnquiriesData(); // Revert
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <RefreshCcw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Calculate Metrics
  const totalEnquiries = enquiries.length;
  const chatLeads = enquiries.filter(e => e.source === 'CHAT').length;
  const formLeads = enquiries.filter(e => e.source === 'FORM').length;
  const conversions = enquiries.filter(e => ['APPROVED', 'COMPLETED'].includes(e.status)).length;

  // Apply Filters
  const filteredEnquiries = enquiries.filter(e => {
    const statusMatch = statusFilter === 'ALL' 
      ? true 
      : statusFilter === 'ACTIVE' 
        ? !['NOT_INTERESTED', 'APPROVED', 'COMPLETED'].includes(e.status)
        : statusFilter === 'CLOSED'
          ? ['NOT_INTERESTED', 'APPROVED', 'COMPLETED'].includes(e.status)
          : e.status === statusFilter;
    
    const sourceMatch = sourceFilter === 'ALL' ? true : e.source === sourceFilter;
    
    let dateMatch = true;
    if (dateFilter !== 'ALL') {
      const enquiryDate = new Date(e.created_at);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        dateMatch = enquiryDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        dateMatch = enquiryDate >= sevenDaysAgo;
      } else if (dateFilter === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        dateMatch = enquiryDate >= thirtyDaysAgo;
      }
    }

    const searchMatch = searchQuery.trim() === '' 
      ? true 
      : (e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         e.phone?.includes(searchQuery) || 
         e.email?.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && sourceMatch && dateMatch && searchMatch;
  });

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
            onClick={() => {
              // Open the first due task's enquiry
              setSelectedEnquiryId(dueTasks[0].enquiry_id);
            }}
            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap mr-6"
          >
            Review Now
          </button>
          
          <button 
            onClick={() => {
              setIsAlertDismissed(true);
              localStorage.setItem('dismissedDueTasks', dueTasks.map(t => t.id).sort().join(','));
            }}
            className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Dismiss Alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row — 4 side-by-side boxes on mobile */}
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
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3 shrink-0">
          {/* Search — full width always */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 w-full transition-colors font-medium text-slate-700"
            />
          </div>
          {/* Filters — 2-col on mobile, row on lg */}
          <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 lg:gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="CLOSED">Closed/Won</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sources</option>
              <option value="CHAT">Chat Leads</option>
              <option value="FORM">Form Leads</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>
            <button
              onClick={() => { setStatusFilter('ALL'); setSourceFilter('ALL'); setDateFilter('ALL'); setSearchQuery(''); }}
              className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors lg:border-0 lg:bg-transparent lg:px-0"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>


      {/* ── MOBILE CARD VIEW (< md) ─────────────────────────── */}
      <div className="md:hidden flex-1 overflow-y-auto pb-32 px-1 pt-2 space-y-3">
        {filteredEnquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium italic">No franchise enquiries yet.</p>
          </div>
        ) : (
          filteredEnquiries.map(enquiry => (
            <div
              key={enquiry.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm relative"
            >
              {/* Card Header */}
              <div className="p-4 flex items-center gap-3">
                {/* Avatar + Info — tap to open details */}
                <div
                  className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                  onClick={() => setSelectedEnquiryId(enquiry.id)}
                >
                  <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shrink-0">
                    {enquiry.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{enquiry.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{enquiry.phone}</span>
                      {enquiry.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{enquiry.location}</span>}
                    </div>
                  </div>
                </div>

                {/* Top-Right Status Badge (clickable to change status directly) */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenStatusPopoverId(openStatusPopoverId === enquiry.id ? null : enquiry.id);
                      setOpenActionMenuId(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-full font-bold border shadow-sm transition-transform active:scale-95 ${getStatusColor(enquiry.status)}`}
                  >
                    {enquiry.status.replace(/_/g, ' ')}
                    <ChevronDown className={`h-3 w-3 transition-transform ${openStatusPopoverId === enquiry.id ? 'rotate-180' : ''}`} />
                  </button>

                  {openStatusPopoverId === enquiry.id && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white shadow-2xl border border-slate-200 p-2 z-[65] animate-in fade-in zoom-in">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 px-2">Change Status</div>
                      <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                        {ENQUIRY_STATUSES.map(status => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(enquiry.id, status);
                              setOpenStatusPopoverId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-md flex justify-between items-center transition-colors ${
                              enquiry.status === status ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
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
              </div>

              {/* Card Footer */}
              <div className="px-4 pb-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  {/* Source badge */}
                  {enquiry.source === 'CHAT' ? (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-green-100">
                      <Bot className="h-3 w-3" /> Chat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-100">
                      <FileText className="h-3 w-3" /> Form
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(enquiry.created_at)}
                  </span>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  {/* View details */}
                  <button
                    onClick={() => setSelectedEnquiryId(enquiry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteLead(enquiry)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete Lead"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DESKTOP TABLE VIEW (≥ md) ───────────────────────── */}
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
                <tr key={enquiry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(enquiry.created_at)}</div>
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
                    <div className="flex items-center gap-1 mb-1"><Phone className="h-3 w-3 text-slate-400"/> {enquiry.phone}</div>
                    {enquiry.email && <div className="flex items-center gap-1 text-slate-400"><Mail className="h-3 w-3 text-slate-400"/> {enquiry.email}</div>}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400"/> {enquiry.location || 'N/A'}</div>
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
                          setOpenStatusPopoverId(openStatusPopoverId === enquiry.id ? null : enquiry.id);
                          setOpenActionMenuId(null);
                        }}
                        className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs rounded-full font-bold shadow-sm transition-all hover:ring-2 hover:ring-slate-200 hover:ring-offset-1 ${getStatusColor(enquiry.status)}`}
                      >
                        {enquiry.status.replace(/_/g, ' ')}
                        <ChevronDown className={`h-3 w-3 transition-transform ${openStatusPopoverId === enquiry.id ? 'rotate-180' : ''}`} />
                      </button>
                      {openStatusPopoverId === enquiry.id && (
                        <div className="absolute right-1/2 translate-x-1/2 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in slide-in-from-top-2">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-2 text-left">Next Steps</div>
                          {getNextStatusOptions(enquiry.status).length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {getNextStatusOptions(enquiry.status).map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => { handleStatusChange(enquiry.id, opt); setOpenStatusPopoverId(null); }}
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
                          setOpenActionMenuId(openActionMenuId === enquiry.id ? null : enquiry.id);
                          setActionMenuMode('main');
                          setStatusSearchQuery('');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openActionMenuId === enquiry.id && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                          {actionMenuMode === 'main' ? (
                            <>
                              <button
                                onClick={() => { setSelectedEnquiryId(enquiry.id); setOpenActionMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Eye className="h-4 w-4 text-slate-400" /> View Details
                              </button>
                              <button
                                onClick={() => { setActionMenuMode('status'); setStatusSearchQuery(''); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <RefreshCcw className="h-4 w-4 text-slate-400" /> Change Status
                              </button>
                              {(enquiry.status === 'CALL_LATER' || enquiry.status === 'NO_RESPONSE') && (
                                <button
                                  onClick={() => { setFollowUpChoice({ enquiry, newStatus: enquiry.status }); setOpenActionMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors"
                                >
                                  <CalendarClock className="h-4 w-4 text-blue-500" /> Manage Follow-up
                                </button>
                              )}
                              <div className="h-px bg-slate-100 my-1 mx-2"></div>
                              <button
                                onClick={() => handleDeleteLead(enquiry)}
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
                                {ENQUIRY_STATUSES.filter(s => s.replace(/_/g, ' ').toLowerCase().includes(statusSearchQuery.toLowerCase())).map(status => (
                                  <button
                                    key={status}
                                    onClick={() => { handleStatusChange(enquiry.id, status); setOpenActionMenuId(null); }}
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
                      )}
                    </div>
                  </td>
                </tr>
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
          onSent={() => {
            // Status was already updated before modal opened
            setDraftReview(null);
          }}
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
            fetchEnquiriesData(); // Refresh tasks
          }}
        />
      )}
    </div>
    </div>
  );
}
