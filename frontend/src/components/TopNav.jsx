import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, LogOut, User, Clock } from 'lucide-react';
import { getEnquiries, getDueTasks } from '../lib/api';

export default function TopNav({ onLogout, onSettings, onNotificationClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [newLeads, setNewLeads] = useState([]);
  const [dueTasks, setDueTasks] = useState([]);

  useEffect(() => {
    // Fetch NEW leads and Due Tasks periodically or on mount
    const fetchNotifications = async () => {
      try {
        const [leads, tasks] = await Promise.all([
          getEnquiries('NEW'),
          getDueTasks()
        ]);
        // Sort leads by newest first
        setNewLeads(leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setDueTasks(tasks);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    
    fetchNotifications();
    
    // Set up a simple polling interval (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 h-16 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-slate-800">{getGreeting()}, Admin <span className="text-xl">👋</span></h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {(newLeads.length > 0 || dueTasks.length > 0) && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>
          
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                  <div className="flex gap-1">
                    {dueTasks.length > 0 && <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{dueTasks.length} Tasks</span>}
                    {newLeads.length > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{newLeads.length} New</span>}
                  </div>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {(newLeads.length === 0 && dueTasks.length === 0) ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      You're all caught up!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {dueTasks.map(task => (
                        <button 
                          key={task.id} 
                          onClick={() => {
                            if (onNotificationClick) onNotificationClick(task.enquiry_id);
                            setShowNotifications(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-l-2 border-orange-400 bg-orange-50/30"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-800">{task.enquiries?.name || 'Unknown Client'}</span>
                            <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                              Due Now
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-medium">Follow-up task is pending</div>
                        </button>
                      ))}

                      {newLeads.map(lead => (
                        <button 
                          key={lead.id} 
                          onClick={() => {
                            if (onNotificationClick) onNotificationClick(lead.id);
                            setShowNotifications(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-slate-800">{lead.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatTime(lead.created_at)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mb-1">New lead from {lead.source === 'CHAT' ? 'Chatbot' : 'Form'}</div>
                          {lead.email && <div className="text-[10px] text-slate-400">{lead.email}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 w-full p-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <button onClick={onSettings} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Settings className="h-5 w-5" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors group relative">
          <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
            A
          </div>
          <span className="text-sm font-bold text-slate-700">Admin</span>
          
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 hidden group-hover:block z-50">
            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
