import React from 'react';
import { LayoutDashboard, Users, PieChart, MessageSquare } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex justify-around items-center shadow-2xl lg:hidden backdrop-blur-md bg-white/95">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'border-2 border-red-600 bg-red-50/40 text-red-600 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-700 font-medium border-2 border-transparent'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-slate-500'}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
