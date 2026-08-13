import React, { useState, useEffect } from 'react';
import { getEnquiries, createEnquiry } from '../lib/api';
import { LayoutGrid, List, Plus, Search, Filter, Calendar, Phone, Mail, User, CheckCircle2, MoreVertical, Flame, Snowflake, X } from 'lucide-react';
import EnquiryDetailsModal from './EnquiryDetailsModal';

const PIPELINE_STAGES = [
  { id: 'new', title: 'New', statuses: ['NEW'] },
  { id: 'contacted', title: 'Contacted', statuses: ['ASSIGNED', 'FIRST_CALL', 'CALL_LATER', 'NO_RESPONSE'] },
  { id: 'interested', title: 'Interested', statuses: ['INTERESTED', 'DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED'] },
  { id: 'payment', title: 'Payment', statuses: ['READY_TO_PAY', 'PAYMENT_DETAILS_SENT', 'PAYMENT_PENDING'] },
  { id: 'closed', title: 'Closed (Won)', statuses: ['PAYMENT_RECEIVED', 'APPROVED', 'ONBOARDING', 'OPENED'] },
  { id: 'lost', title: 'Closed (Lost)', statuses: ['NOT_INTERESTED'] }
];

const calculateLeadScore = (status, createdAt) => {
  const daysOld = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
  let score = 50; 
  if (['NEW', 'ASSIGNED'].includes(status)) score = 40;
  if (['FIRST_CALL'].includes(status)) score = 50;
  if (['INTERESTED', 'CALL_LATER'].includes(status)) score = 70;
  if (['DOCUMENTS_REQUESTED', 'DOCUMENTS_RECEIVED'].includes(status)) score = 80;
  if (['READY_TO_PAY', 'PAYMENT_DETAILS_SENT', 'PAYMENT_PENDING'].includes(status)) score = 90;
  if (['PAYMENT_RECEIVED', 'APPROVED', 'ONBOARDING', 'OPENED'].includes(status)) score = 100;
  if (['NOT_INTERESTED', 'NO_RESPONSE'].includes(status)) score = 10;
  if (['NEW', 'ASSIGNED', 'FIRST_CALL'].includes(status) && daysOld > 3) score -= (daysOld * 2);
  return Math.max(0, Math.min(100, score));
};

const getTemperatureIcon = (score) => {
  if (score >= 80) return <Flame className="h-4 w-4 text-red-500" />;
  if (score >= 50) return <Flame className="h-4 w-4 text-orange-400" />;
  return <Snowflake className="h-4 w-4 text-blue-400" />;
};

export default function LeadsPage({ highlightedLeadId }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [highlightClassId, setHighlightClassId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', location: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (highlightedLeadId) {
      // Small delay to ensure table is rendered if switching tabs
      setTimeout(() => {
        setHighlightClassId(highlightedLeadId);
        const el = document.getElementById(`lead-row-${highlightedLeadId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      const timer = setTimeout(() => {
        setHighlightClassId(null);
      }, 2100);
      return () => clearTimeout(timer);
    } else {
      setHighlightClassId(null);
    }
  }, [highlightedLeadId]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEnquiries = enquiries.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (stageFilter !== 'ALL') {
      const stage = PIPELINE_STAGES.find(s => s.id === stageFilter);
      if (stage && !stage.statuses.includes(lead.status)) return false;
    }
    
    return true;
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await getEnquiries();
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;
    
    setIsSubmitting(true);
    try {
      await createEnquiry({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        location: newLead.location,
        status: 'NEW',
        source: 'MANUAL',
      });
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', email: '', location: '' });
      fetchLeads();
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Leads Pipeline</h1>
          <p className="text-sm text-slate-500 font-medium">Manage and track your incoming leads.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads by name, phone or email..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-bold transition-colors ${showFilters || stageFilter !== 'ALL' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className="h-4 w-4" /> 
              Filters {stageFilter !== 'ALL' && <span className="bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1">1</span>}
            </button>
            
            {showFilters && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Stage</div>
                  <button 
                    onClick={() => { setStageFilter('ALL'); setShowFilters(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 ${stageFilter === 'ALL' ? 'text-red-600 bg-red-50/50' : 'text-slate-700'}`}
                  >
                    All Stages
                  </button>
                  {PIPELINE_STAGES.map(stage => (
                    <button 
                      key={stage.id}
                      onClick={() => { setStageFilter(stage.id); setShowFilters(false); }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 ${stageFilter === stage.id ? 'text-red-600 bg-red-50/50' : 'text-slate-700'}`}
                    >
                      {stage.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto bg-slate-100 p-6 flex gap-6">
          {loading ? (
            <div className="flex items-center justify-center w-full h-full text-slate-400 font-bold">Loading leads...</div>
          ) : (
            // LIST VIEW
            <div className="flex-1 w-full overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnquiries.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-slate-400 italic">No leads found matching your criteria.</td></tr>
                  ) : (
                    filteredEnquiries.map(lead => {
                      const score = calculateLeadScore(lead.status, lead.created_at);
                      const stage = PIPELINE_STAGES.find(s => s.statuses.includes(lead.status))?.title || 'Unknown';
                      
                      return (
                        <tr 
                          id={`lead-row-${lead.id}`}
                          key={lead.id} 
                          onClick={() => setSelectedEnquiryId(lead.id)}
                          className={`cursor-pointer group transition-all duration-700 ${highlightClassId === lead.id ? 'bg-amber-100/80 ring-2 ring-amber-400' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="text-xs text-slate-500">Added {new Date(lead.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex items-center gap-1 mb-1"><Phone className="h-3 w-3 text-slate-400"/> {lead.phone}</div>
                            {lead.email && <div className="flex items-center gap-1 text-slate-400"><Mail className="h-3 w-3 text-slate-400"/> {lead.email}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">{stage}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {getTemperatureIcon(score)}
                              <span className="font-bold text-slate-700">{score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                              {lead.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedEnquiryId && (
        <EnquiryDetailsModal 
          enquiryId={selectedEnquiryId} 
          onClose={() => setSelectedEnquiryId(null)} 
          onUpdate={fetchLeads}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Add New Lead</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={newLead.name}
                  onChange={e => setNewLead({...newLead, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium"
                  placeholder="Enter lead's name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input 
                  type="tel" 
                  required
                  value={newLead.phone}
                  onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={newLead.email}
                  onChange={e => setNewLead({...newLead, email: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={newLead.location}
                  onChange={e => setNewLead({...newLead, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm font-medium"
                  placeholder="City, State"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
