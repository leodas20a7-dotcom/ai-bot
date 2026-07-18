import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { LogOut, RefreshCcw, Database, MessageSquare, ClipboardList, Calendar, X, Search, MapPin, Filter, ChevronUp, ChevronDown, Download, MoreVertical } from 'lucide-react';

// Helper for avatars
const getInitials = (name) => {
  if (!name) return '??';
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Helper for budget parsing to number (rough estimate)
const parseBudget = (budgetStr) => {
  if (!budgetStr) return 0;
  let str = budgetStr.toLowerCase().replace(/,/g, '');
  if (str.includes('lakh')) {
    return parseFloat(str) * 100000;
  } else if (str.includes('crore')) {
    return parseFloat(str) * 10000000;
  }
  return parseFloat(str) || 0;
};

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('forms');
  const [leads, setLeads] = useState([]);
  const [chatLeads, setChatLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

      const matchesStatus = statusFilter === '' || (item.status && item.status.toLowerCase() === statusFilter.toLowerCase()) || (!item.status && statusFilter.toLowerCase() === 'new');

      return matchesSearch && matchesLocation && matchesDate && matchesStatus;
    });
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'budget') {
        valA = parseBudget(valA);
        valB = parseBudget(valB);
      } else if (sortConfig.key === 'created_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA ? valA.toString().toLowerCase() : '';
        valB = valB ? valB.toString().toLowerCase() : '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredLeads = React.useMemo(() => sortData(filterData(leads)), [leads, searchTerm, startDate, endDate, locationFilter, sortConfig, statusFilter]);
  const filteredChatLeads = React.useMemo(() => sortData(filterData(chatLeads)), [chatLeads, searchTerm, startDate, endDate, locationFilter, sortConfig, statusFilter]);

  
  const handleStatusChange = async (id, table, newStatus) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      if (table === 'leads') {
        setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
      } else {
        setChatLeads(chatLeads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp className="h-3 w-3 text-slate-300 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-slate-600 inline-block ml-1" />
      : <ChevronDown className="h-3 w-3 text-slate-600 inline-block ml-1" />;
  };

  const exportToExcel = () => {
    const dataToExport = activeTab === 'forms' ? filteredLeads : filteredChatLeads;
    if (dataToExport.length === 0) return alert("No data to export");

    let formattedData;
    if (activeTab === 'forms') {
      formattedData = dataToExport.map(row => ({
        Date: new Date(row.created_at).toLocaleString(),
        Name: row.name || '',
        Mobile: row.mobile || '',
        Email: row.email || '',
        City: row.city || '',
        'Property Status': row.property_status || '',
        'Carpet Area': row.carpet_area || '',
        Message: row.message || '',
        Status: row.status || 'New'
      }));
    } else {
      formattedData = dataToExport.map(row => ({
        Date: new Date(row.created_at).toLocaleString(),
        Name: row.name || '',
        Phone: row.phone || '',
        Area: row.area || '',
        Budget: row.budget || '',
        Transcript: row.transcript || '',
        Status: row.status || 'New'
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `leads_export_${new Date().getTime()}.xlsx`);
  };

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
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-red-600 p-2 rounded-lg text-white shadow-sm">
            <Database className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">Admin Dashboard</h1>
            <p className="text-[10px] sm:text-xs text-slate-500">Manage your leads</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowFilters(true)}
            className="sm:hidden flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-2 py-2 rounded-lg"
            title="Filter Data"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-2 sm:px-3 py-2 rounded-lg"
            title="Export to Excel"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-2 sm:px-3 py-2 rounded-lg"
            title="Refresh Data"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-2 sm:px-3 py-2 rounded-lg border border-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-4 sm:gap-6 pb-24 sm:pb-8">
        
        {/* Tabs */}
        <div className="hidden sm:flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'forms' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Form Leads <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${activeTab === 'forms' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{filteredLeads.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'chats' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat Leads <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${activeTab === 'chats' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{filteredChatLeads.length}</span>
          </button>
        </div>

        {/* Desktop Filter Bar */}
        <div className="hidden sm:flex bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-wrap gap-4 items-end transition-all">
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

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button 
            onClick={() => { setSearchTerm(''); setLocationFilter(''); setStartDate(''); setEndDate(''); setStatusFilter(''); }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors h-[38px]"
          >
            <Filter className="h-4 w-4" />
            Clear
          </button>
        </div>

        {/* Data Container */}
        <div className="bg-transparent sm:bg-white sm:rounded-2xl sm:shadow-sm sm:border sm:border-slate-200 sm:overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-200">
              <RefreshCcw className="h-8 w-8 animate-spin" />
            </div>
          ) : activeTab === 'forms' ? (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col gap-4">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic bg-white rounded-xl border border-slate-200">No form leads found matching filters.</div>
                ) : (
                  filteredLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(lead.name)} shadow-sm`}>
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(lead.created_at)}</div>
                          </div>
                        </div>
                        <select 
                          value={lead.status || 'New'}
                          onChange={(e) => handleStatusChange(lead.id, 'leads', e.target.value)}
                          className="text-xs border border-slate-300 rounded-md shadow-sm bg-white py-1 px-2 text-slate-700 font-medium focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Contact</span><span className="text-slate-700">{lead.mobile}</span></div>
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Location</span><span className="text-slate-700">{lead.city || '-'}</span></div>
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Property</span><span className="capitalize text-slate-700">{lead.property_status}</span></div>
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Area</span><span className="text-slate-700">{lead.carpet_area ? `${lead.carpet_area} sq.ft` : '-'}</span></div>
                      </div>
                      {lead.message && (
                        <div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600 italic mt-1">
                          "{lead.message}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200 select-none">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('created_at')}>Date <SortIcon columnKey="created_at" /></th>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>Name <SortIcon columnKey="name" /></th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('city')}>Location <SortIcon columnKey="city" /></th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-slate-400 italic">No form leads found matching filters.</td></tr>
                  ) : (
                    filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(lead.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(lead.name)} shadow-sm`}>
                              {getInitials(lead.name)}
                            </div>
                            <span className="font-medium text-slate-900">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>{lead.mobile}</div>
                          <div className="text-xs text-slate-400">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4">{lead.city}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize bg-slate-100 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 text-slate-700">{lead.property_status}</span>
                          <div className="text-xs text-slate-400 mt-1">{lead.carpet_area} sq.ft</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={lead.message}>{lead.message || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <select 
                            value={lead.status || 'New'}
                            onChange={(e) => handleStatusChange(lead.id, 'leads', e.target.value)}
                            className="text-xs border border-slate-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 bg-white cursor-pointer py-1.5 pl-2 pr-6 text-slate-700 font-medium hover:border-slate-400 transition-colors"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <>
              {/* Mobile Card View for Chats */}
              <div className="sm:hidden flex flex-col gap-4">
                {filteredChatLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic bg-white rounded-xl border border-slate-200">No chat leads found matching filters.</div>
                ) : (
                  filteredChatLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(lead.name)} shadow-sm`}>
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(lead.created_at)}</div>
                          </div>
                        </div>
                        <select 
                          value={lead.status || 'New'}
                          onChange={(e) => handleStatusChange(lead.id, 'chat_leads', e.target.value)}
                          className="text-xs border border-slate-300 rounded-md shadow-sm bg-white py-1 px-2 text-slate-700 font-medium focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Phone</span><span className="text-slate-700">{lead.phone || '-'}</span></div>
                        <div><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Area</span><span className="text-slate-700">{lead.area || '-'}</span></div>
                        <div className="col-span-2"><span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Budget</span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${parseBudget(lead.budget) >= 1000000 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {lead.budget || '-'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedTranscript(lead)}
                        className="mt-2 w-full text-sm font-bold text-red-600 hover:text-red-800 transition-colors flex justify-center items-center gap-2 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg border border-red-100 shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View Chat Transcript
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200 select-none">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('created_at')}>Date <SortIcon columnKey="created_at" /></th>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>Name <SortIcon columnKey="name" /></th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('area')}>Area <SortIcon columnKey="area" /></th>
                    <th className="px-6 py-4 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('budget')}>Budget <SortIcon columnKey="budget" /></th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredChatLeads.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400 italic">No chat leads found matching filters.</td></tr>
                  ) : (
                    filteredChatLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {formatDate(lead.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(lead.name)} shadow-sm`}>
                              {getInitials(lead.name)}
                            </div>
                            <span className="font-medium text-slate-900">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{lead.phone}</td>
                        <td className="px-6 py-4">{lead.area}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${parseBudget(lead.budget) >= 1000000 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {lead.budget}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <select 
                              value={lead.status || 'New'}
                              onChange={(e) => handleStatusChange(lead.id, 'chat_leads', e.target.value)}
                              className="text-xs border border-slate-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 bg-white cursor-pointer py-1.5 pl-2 pr-6 text-slate-700 font-medium hover:border-slate-400 transition-colors"
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Closed">Closed</option>
                            </select>
                            <button 
                              onClick={() => setSelectedTranscript(lead)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-100 shadow-sm"
                            >
                              View Chat
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-safe z-40 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('forms')}
          className={`flex flex-col items-center p-2 w-full transition-colors ${
            activeTab === 'forms' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className={`h-6 w-6 mb-1 ${activeTab === 'forms' ? 'text-red-600' : ''}`} />
          <span className="text-[10px] font-bold">Forms</span>
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center p-2 w-full transition-colors ${
            activeTab === 'chats' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className={`h-6 w-6 mb-1 ${activeTab === 'chats' ? 'text-red-600' : ''}`} />
          <span className="text-[10px] font-bold">Chats</span>
        </button>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="sm:hidden fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Filter className="h-5 w-5" /> Filters</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
              <div>
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
              
              <div>
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button 
                onClick={() => { setSearchTerm(''); setLocationFilter(''); setStartDate(''); setEndDate(''); setStatusFilter(''); }}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

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
