import React from 'react';
import { LayoutDashboard, Users, UserSquare2, TrendingUp, PieChart, Settings, Database, MessageSquare } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-[125vh] sticky top-0 flex flex-col hidden lg:flex shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-red-600 text-white p-2 rounded-xl shadow-sm">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight">Admin Dashboard</h1>
          <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Manage your leads</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <LayoutDashboard className="h-5 w-5" /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-colors ${activeTab === 'leads' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Users className="h-5 w-5" /> Leads
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-colors ${activeTab === 'reports' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <PieChart className="h-5 w-5" /> Reports
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-colors ${activeTab === 'templates' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <MessageSquare className="h-5 w-5" /> Templates
        </button>
      </nav>

      <div className="mt-auto">
        <div className="p-4 m-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-3 overflow-hidden shadow-sm border border-slate-100">
            <img src="/Mart%20logo.jpg" alt="Convenio Mart Logo" className="w-full h-full object-contain" />
          </div>
          <h4 className="font-black text-slate-800 text-sm mb-1 tracking-tight">Convenio Mart</h4>
          <p className="text-[11px] font-bold text-slate-500 px-2 leading-relaxed tracking-wider">
            Mini-Supermarket Franchise Opportunity
          </p>
        </div>

        <div className="p-6 pt-0 text-center">
          <p className="text-[10px] font-medium text-slate-400">&copy; 2026 Convino Mart</p>
        </div>
      </div>
    </aside>
  );
}
