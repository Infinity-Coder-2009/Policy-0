import React from 'react';
import { Logo } from './Logo';
import { Sparkles, Layers, Cpu, DollarSign, Settings, ShieldCheck, Activity, Database } from 'lucide-react';

export type NavTab = 'create' | 'dashboard' | 'simulator' | 'pricing' | 'settings' | 'workflow' | 'data';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  policyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, policyCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-md border-b border-[#2A2A4A] text-[#E8E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('create')}>
            <Logo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Policy-0
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-[#0055FF]/15 text-[#0055FF] border border-[#0055FF]/30">
                  Studio
                </span>
              </div>
              <p className="text-[11px] text-[#A0A0B8] hidden sm:block">Text & Video to Deployable Robot Policies</p>
            </div>
          </div>

          {/* Nav Tabs Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-create-policy-btn"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#00CC88]" />
              <span>Compiler</span>
            </button>

            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tasks ({policyCount})</span>
            </button>

            <button
              id="nav-simulator-btn"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              }`}
            >
              <Cpu className="w-4 h-4 text-[#00CC88]" />
              <span>MuJoCo Sim</span>
            </button>

            <button
              id="nav-pricing-btn"
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              }`}
            >
              <DollarSign className="w-4 h-4 text-[#FFB800]" />
              <span className="hidden sm:inline">Sim API Tier</span>
            </button>

            <button
              id="nav-data-moat-btn"
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              }`}
            >
              <Database className="w-4 h-4 text-violet-400" />
              <span className="hidden sm:inline">Data Moat</span>
            </button>

            <button
              id="nav-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </nav>

          {/* Right Status Indicator & CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141428] border border-[#2A2A4A] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00CC88] animate-pulse"></span>
              <span className="text-[#E8E8F0] font-mono">Gemini Robotics ER</span>
            </div>
            <button
              id="api-quota-badge-btn"
              onClick={() => setActiveTab('pricing')}
              className="px-3.5 py-1.5 rounded-xl bg-[#0055FF]/10 hover:bg-[#0055FF]/20 border border-[#0055FF]/30 text-[#0088FF] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-[#0088FF]" />
              <span>$100/hr Sim API</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
