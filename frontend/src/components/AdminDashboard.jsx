import React, { useState } from 'react';
import { LogOut, Settings, Database, X } from 'lucide-react';
import FranchiseDashboard from './FranchiseDashboard';
import LeadsPage from './LeadsPage';
import ReportsPage from './ReportsPage';
import TemplatesPage from './TemplatesPage';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [highlightedLeadId, setHighlightedLeadId] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [collectBudget, setCollectBudget] = useState(() => {
    return localStorage.getItem('collect_budget_setting') === 'true';
  });

  const handleToggleBudgetSetting = async (val) => {
    setCollectBudget(val);
    localStorage.setItem('collect_budget_setting', String(val));
  };

  const handleNotificationClick = (leadId) => {
    setActiveTab('leads');
    setHighlightedLeadId(leadId);
    setTimeout(() => {
      setHighlightedLeadId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-blue-100 selection:text-blue-900 pb-16 lg:pb-0">
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          onLogout={onLogout} 
          onSettings={() => setShowSettingsModal(true)} 
          onNotificationClick={handleNotificationClick}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-full flex flex-col gap-6 pb-20 lg:pb-8">
          {activeTab === 'dashboard' && <FranchiseDashboard />}
          {activeTab === 'leads' && <LeadsPage highlightedLeadId={highlightedLeadId} />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'templates' && <TemplatesPage />}
        </main>
      </div>

      {/* Mobile App Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Chatbot Settings</h2>
                <p className="text-xs text-slate-500">Configure AI lead collection flow</p>
              </div>
            </div>

            <div className="space-y-4 py-4 border-t border-b border-slate-100 my-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="font-semibold text-slate-800 text-sm block">Collect Budget Details</label>
                  <p className="text-xs text-slate-500 mt-1">
                    {collectBudget 
                      ? "Enabled: AI Bot will ask users for budget after name and location."
                      : "Disabled (Default): AI Bot will only ask for Name, Location, and Phone Number separately."}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleBudgetSetting(!collectBudget)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    collectBudget ? 'bg-red-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform"></div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
