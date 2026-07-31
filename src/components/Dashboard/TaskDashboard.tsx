import React, { useState } from 'react';
import { GeneratedPolicy } from '../../types';
import { Search, Filter, Play, Code, Bot, CheckCircle2, Layers, Trash2, Clock, Cpu, Check, AlertTriangle } from 'lucide-react';

interface TaskDashboardProps {
  policies: GeneratedPolicy[];
  onSelectPolicy: (policy: GeneratedPolicy) => void;
  onOpenSimulator: (policy: GeneratedPolicy) => void;
  onDeletePolicy: (id: string) => void;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ policies, onSelectPolicy, onOpenSimulator, onDeletePolicy }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [robotFilter, setRobotFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.robot.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = planFilter === 'all' || policy.routing.planType.includes(planFilter);
    const matchesRobot = robotFilter === 'all' || policy.robot.id === robotFilter;
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;

    return matchesSearch && matchesPlan && matchesRobot && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#00CC88]/15 text-[#00CC88] border border-[#00CC88]/30 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Done</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#0088FF]/15 text-[#0088FF] border border-[#0088FF]/30 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#FF3355]/15 text-[#FF3355] border border-[#FF3355]/30 text-[10px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Header Toolbar */}
      <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
            <input
              id="search-policies-input"
              type="text"
              placeholder="Search tasks by ID, title, or robot model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF] transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#A0A0B8]" />
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl px-3 py-2 text-xs text-[#E8E8F0] focus:outline-none focus:border-[#0055FF]"
              >
                <option value="all">All Statuses</option>
                <option value="validated">Done</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <select
              id="filter-plan-select"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl px-3 py-2 text-xs text-[#E8E8F0] focus:outline-none focus:border-[#0055FF]"
            >
              <option value="all">All Routing Plans</option>
              <option value="Plan A">Plan A: Symbolic Code</option>
              <option value="Plan B">Plan B: Neural VLA</option>
              <option value="Plan C">Plan C: Reinforcement Learning</option>
            </select>

            <select
              id="filter-robot-select"
              value={robotFilter}
              onChange={(e) => setRobotFilter(e.target.value)}
              className="bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl px-3 py-2 text-xs text-[#E8E8F0] focus:outline-none focus:border-[#0055FF]"
            >
              <option value="all">All Robots</option>
              <option value="franka_panda">Franka Panda</option>
              <option value="ur5e">UR5e</option>
              <option value="unitree_h1">Unitree H1 Humanoid</option>
              <option value="kinova_gen3">Kinova Gen3</option>
              <option value="shadow_hand">Shadow Hand</option>
              <option value="turtlebot4">TurtleBot 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies Grid */}
      {filteredPolicies.length === 0 ? (
        <div className="bg-[#141428] rounded-2xl border border-[#2A2A4A] p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-[#A0A0B8] mx-auto" />
          <h3 className="text-base font-bold text-white">No Matching Policy Tasks Found</h3>
          <p className="text-xs text-[#A0A0B8] max-w-md mx-auto">
            Try resetting your search query or generate a new robot policy using the Compiler.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => (
            <div
              key={policy.id}
              className="bg-[#141428] rounded-2xl border border-[#2A2A4A] hover:border-[#0055FF]/60 p-6 shadow-xl flex flex-col justify-between transition-all group hover:shadow-2xl hover:shadow-[#0055FF]/10"
            >
              <div>
                {/* Robot & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#0055FF]" />
                    <span className="text-xs font-bold text-white">{policy.robot.name}</span>
                  </div>
                  {getStatusBadge(policy.status)}
                </div>

                {/* Policy Title & Description */}
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#0088FF] transition-colors line-clamp-1">
                  {policy.title}
                </h3>
                <p className="text-xs text-[#E8E8F0] line-clamp-2 mb-4 leading-relaxed">{policy.description}</p>

                {/* Task Meta Specs */}
                <div className="bg-[#0A0A1A] p-3 rounded-xl border border-[#2A2A4A] mb-4 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-[#E8E8F0]">
                    <span className="text-[#A0A0B8]">Task ID:</span>
                    <span className="text-[#0088FF] font-semibold">{policy.id}</span>
                  </div>
                  <div className="flex justify-between text-[#E8E8F0]">
                    <span className="text-[#A0A0B8]">Routing Plan:</span>
                    <span className="text-[#00CC88] font-semibold">{policy.routing.planType.split(':')[0]}</span>
                  </div>
                  <div className="flex justify-between text-[#E8E8F0]">
                    <span className="text-[#A0A0B8]">Sim Success:</span>
                    <span className="text-[#00CC88] font-bold">{policy.metrics.successRatePct}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#2A2A4A] flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenSimulator(policy)}
                  className="px-3 py-2 rounded-xl bg-[#0055FF]/20 hover:bg-[#0055FF]/30 border border-[#0055FF]/40 text-[#0088FF] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#0088FF] fill-[#0088FF]/40" />
                  <span>Simulate</span>
                </button>

                <button
                  onClick={() => onSelectPolicy(policy)}
                  className="px-3 py-2 rounded-xl bg-[#0A0A1A] hover:bg-[#2A2A4A] text-[#E8E8F0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-[#A0A0B8]" />
                  <span>Inspect Code</span>
                </button>

                <button
                  onClick={() => onDeletePolicy(policy.id)}
                  className="p-2 rounded-xl text-[#A0A0B8] hover:text-[#FF3355] hover:bg-[#FF3355]/10 transition-all cursor-pointer"
                  title="Delete Policy Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
