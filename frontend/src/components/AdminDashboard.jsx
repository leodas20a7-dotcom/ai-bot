import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, RefreshCcw, Database, MessageSquare, ClipboardList, Calendar, X, Search, MapPin, Filter } from 'lucide-react';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('forms');
  const [leads, setLeads] = useState([]);
  const [chatLeads, setChatLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      const { data: chatData, error: chatError } = await supabase
        .from('chat_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (chatError) throw chatError;

      setLeads(leadsData || []);
      setChatLeads(chatData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterData = (data) => {
    return data.filter(item => {
      // Search (Name, Phone, Email, Message)
      const searchStr = `${item.name || ''} ${item.mobile || item.phone || ''} ${item.email || ''} ${item.message || ''}`.toLowerCase();
      const matchesSearch = searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
      
      // Location (City, Area)
      const locationStr = `${item.city || item.area || ''}`.toLowerCase();
      const matchesLocation = locationFilter === '' || locationStr.includes(locationFilter.toLowerCase());

      // Date
      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.created_at);
        itemDate.setHours(0, 0, 0, 0); // Normalize time
        
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && itemDate >= sDate;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && itemDate <= eDate;
        }
      }

      return matchesSearch && matchesLocation && matchesDate;
    });
  };

  const filteredLeads = React.useMemo(() => filterData(leads), [leads, searchTerm, startDate, endDate, locationFilter]);
  const filteredChatLeads = React.useMemo(() => filterData(chatLeads), [chatLeads, searchTerm, startDate, endDate, locationFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTranscript = (transcriptText) => {
    if (!transcriptText) return null;
    
    const messages = transcriptText.split('\n\n');
    
    return messages.map((msg, idx) => {
      if (msg.startsWith('USER:')) {
        return (
          <div key={idx} className="flex gap-4 mb-4 last:mb-0">
            <div className="w-16 flex-shrink-0 text-right mt-0.5">
              <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-xs shadow-sm inline-block">USER</span>
            </div>
            <div className="text-slate-700 flex-1 leading-relaxed">
              {msg.replace('USER:', '').trim()}
            </div>
          </div>
        );
      } else if (msg.startsWith('ASSISTANT:')) {
        return (
          <div key={idx} className="flex gap-4 mb-4 last:mb-0">
            <div className="w-16 flex-shrink-0 text-right mt-0.5">
              <span className="font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded text-xs shadow-sm inline-block">CONVI</span>
            </div>
            <div className="text-slate-700 flex-1 leading-relaxed">
              {msg.replace('ASSISTANT:', '').trim()}
            </div>
          </div>
        );
      }
      return <div key={idx} className="mb-4 last:mb-0 text-slate-700 pl-20">{msg}</div>;
    });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-slate-500">Manage your leads</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg"
            title="Refresh Data"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'forms' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Form Leads <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{filteredLeads.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'chats' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat Leads <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{filteredChatLeads.length}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Name, phone, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="City, area..." 
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-600"
            />
          </div>

          <button 
            onClick={() => { setSearchTerm(''); setLocationFilter(''); setStartDate(''); setEndDate(''); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors h-[38px]"
          >
            <Filter className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* Data Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <RefreshCcw className="h-8 w-8 animate-spin" />
            </div>
          ) : activeTab === 'forms' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400 italic">No form leads found matching filters.</td></tr>
                  ) : (
                    filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(lead.created_at)}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                        <td className="px-6 py-4">
                          <div>{lead.mobile}</div>
                          <div className="text-xs text-slate-400">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4">{lead.city}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">{lead.property_status}</span>
                          <div className="text-xs text-slate-400 mt-1">{lead.carpet_area} sq.ft</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={lead.message}>{lead.message || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Area</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Transcript</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChatLeads.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400 italic">No chat leads found matching filters.</td></tr>
                  ) : (
                    filteredChatLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(lead.created_at)}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                        <td className="px-6 py-4">{lead.phone}</td>
                        <td className="px-6 py-4">{lead.area}</td>
                        <td className="px-6 py-4"><span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold border border-green-100">{lead.budget}</span></td>
                        <td className="px-6 py-4">
                           <button 
                              onClick={() => setSelectedTranscript(lead)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full"
                            >
                              View Chat
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Chat Transcript</h3>
                <p className="text-xs text-slate-500">Conversation with {selectedTranscript.name}</p>
              </div>
              <button 
                onClick={() => setSelectedTranscript(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="bg-white rounded-xl border border-slate-200 p-5 font-sans text-sm text-slate-700 leading-relaxed shadow-sm">
                {formatTranscript(selectedTranscript.transcript)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
