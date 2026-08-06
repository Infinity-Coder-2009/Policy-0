/**
 * Dashboard Page
 * ============================================================
 * Overview stats, recent activity, system status, quick actions.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Zap,
  FileText,
  TrendingUp,
  CheckCircle2,
  Activity,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { Card, StatCard, Badge, Skeleton } from '../components/ui';

interface DashboardStats {
  totalPolicies: number;
  totalRuns: number;
  avgSuccessRate: number;
  verifiedCount: number;
}

interface NvidiaHealth {
  overall: string;
  checks: Record<string, { status: string; latencyMs?: number }>;
}

interface EvolutionOverview {
  policiesEvolved: number;
  totalVersions: number;
  verifiedCount: number;
  measuredCount: number;
  avgGainPct: number;
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [policies, evolution] = await Promise.all([
        api.get<{ success: boolean; count: number }>('/api/policies'),
        api.get<{ success: boolean; overview: EvolutionOverview }>('/api/evolution/overview'),
      ]);
      return {
        totalPolicies: policies.count || 0,
        totalRuns: 0,
        avgSuccessRate: 0,
        verifiedCount: evolution.overview?.verifiedCount || 0,
      };
    },
  });

  const { data: nvidiaHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['nvidia-health'],
    queryFn: () => api.get<NvidiaHealth>('/api/nvidia/health'),
    refetchInterval: 30000,
  });

  const { data: evolutionOverview } = useQuery({
    queryKey: ['evolution-overview'],
    queryFn: () => api.get<{ success: boolean; overview: EvolutionOverview }>('/api/evolution/overview'),
  });

  const isLoading = statsLoading || healthLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#A0A0B8] mt-1">Overview of your robotics policy generation</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white font-semibold shadow-lg shadow-[#0055FF]/20 transition-all"
        >
          <Zap className="w-4 h-4" />
          Generate Policy
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Policies"
              value={stats?.totalPolicies || 0}
              icon={<FileText className="w-5 h-5" />}
            />
            <StatCard
              title="Verified Evolutions"
              value={stats?.verifiedCount || 0}
              icon={<CheckCircle2 className="w-5 h-5" />}
            />
            <StatCard
              title="Avg Gain"
              value={`${evolutionOverview?.overview?.avgGainPct || 0}%`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              title="System Status"
              value={nvidiaHealth?.overall === 'ok' ? 'Healthy' : nvidiaHealth?.overall === 'degraded' ? 'Degraded' : 'Down'}
              icon={<Activity className="w-5 h-5" />}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NVIDIA Service Health */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">NVIDIA Service Health</h2>
          {healthLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : nvidiaHealth?.checks ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(nvidiaHealth.checks).map(([name, check]) => (
                <div
                  key={name}
                  className="p-3 rounded-xl bg-[#0A0A1A] border border-[#2A2A4A]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        check.status === 'ok'
                          ? 'bg-[#00CC88]'
                          : check.status === 'degraded'
                          ? 'bg-[#FFB800]'
                          : 'bg-[#FF3355]'
                      }`}
                    />
                    <span className="text-xs text-[#A0A0B8] truncate">
                      {name.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white capitalize">
                    {check.status}
                  </span>
                  {check.latencyMs && (
                    <p className="text-xs text-[#A0A0B8]">{check.latencyMs}ms</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#A0A0B8]">No health data available</p>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/generate"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A] hover:bg-[#141428] border border-[#2A2A4A] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0055FF]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#0055FF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Generate Policy</p>
                <p className="text-xs text-[#A0A0B8]">Create a new robot policy</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A0A0B8] group-hover:text-white transition-colors" />
            </Link>
            <Link
              to="/policies"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A] hover:bg-[#141428] border border-[#2A2A4A] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00CC88]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#00CC88]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">View Policies</p>
                <p className="text-xs text-[#A0A0B8]">Browse generated policies</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A0A0B8] group-hover:text-white transition-colors" />
            </Link>
            <Link
              to="/flywheel"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A] hover:bg-[#141428] border border-[#2A2A4A] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#FFB800]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Data Flywheel</p>
                <p className="text-xs text-[#A0A0B8]">View evolution metrics</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A0A0B8] group-hover:text-white transition-colors" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A]">
            <div className="w-8 h-8 rounded-full bg-[#0055FF]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0055FF]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">Policy generation completed</p>
              <p className="text-xs text-[#A0A0B8]">Franka Panda Pick and Place v2</p>
            </div>
            <span className="text-xs text-[#A0A0B8]">2m ago</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A]">
            <div className="w-8 h-8 rounded-full bg-[#00CC88]/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#00CC88]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">Evolution verified</p>
              <p className="text-xs text-[#A0A0B8]">+3.2pp measured gain</p>
            </div>
            <span className="text-xs text-[#A0A0B8]">15m ago</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A]">
            <div className="w-8 h-8 rounded-full bg-[#FFB800]/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-[#FFB800]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">Simulation completed</p>
              <p className="text-xs text-[#A0A0B8]">Isaac Sim job isaac_sim_123</p>
            </div>
            <span className="text-xs text-[#A0A0B8]">1h ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
}