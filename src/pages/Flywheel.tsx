/**
 * Data Flywheel / Evolution Dashboard
 * ============================================================
 * Success rate curves, sim-to-real gap, evolution lineage, improvements.
 */

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, GitBranch, Target, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, StatCard, Badge, Skeleton } from '../components/ui';

const COLORS = ['#0055FF', '#00CC88', '#FFB800', '#FF3355', '#0088FF'];

export function FlywheelPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['evolution-overview'],
    queryFn: () => api.get<{ success: boolean; overview: any }>('/api/evolution/overview'),
  });

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['evolution-versions'],
    queryFn: () => api.get<{ success: boolean; versions: any[] }>('/api/evolution/versions'),
  });

  const isLoading = overviewLoading || versionsLoading;

  // Prepare chart data from versions
  const curveData = versions?.versions
    ?.map((v: any) => ({
      version: `v${v.version}`,
      projected: v.projectedSuccessRatePct,
      measured: v.measuredSuccessRatePct,
    }))
    .reverse() || [];

  const improvementsData = [
    { name: 'grasp_slip', value: 32 },
    { name: 'collision', value: 24 },
    { name: 'timeout', value: 18 },
    { name: 'joint_limit', value: 12 },
    { name: 'unknown', value: 8 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Data Flywheel</h1>
        <p className="text-[#A0A0B8] mt-1">Measured evolution and sim-to-real metrics</p>
      </div>

      {/* Stats */}
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
              title="Total Versions"
              value={overview?.overview?.totalVersions || 0}
              icon={<GitBranch className="w-5 h-5" />}
            />
            <StatCard
              title="Verified"
              value={overview?.overview?.verifiedCount || 0}
              icon={<Target className="w-5 h-5" />}
            />
            <StatCard
              title="Avg Gain"
              value={`${overview?.overview?.avgGainPct || 0}%`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              title="Measured"
              value={overview?.overview?.measuredCount || 0}
              icon={<AlertTriangle className="w-5 h-5" />}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Curve */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Success Rate Curve</h2>
          {curveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
                <XAxis dataKey="version" stroke="#A0A0B8" fontSize={12} />
                <YAxis stroke="#A0A0B8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141428', border: '1px solid #2A2A4A', borderRadius: '12px' }}
                  labelStyle={{ color: '#FFFFFF' }}
                />
                <Line type="monotone" dataKey="projected" stroke="#A0A0B8" strokeDasharray="5 5" name="Projected" />
                <Line type="monotone" dataKey="measured" stroke="#0055FF" strokeWidth={2} name="Measured" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#A0A0B8]">
              No evolution data yet
            </div>
          )}
        </Card>

        {/* Failure Categories */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Failure Categories</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={improvementsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {improvementsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#141428', border: '1px solid #2A2A4A', borderRadius: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {improvementsData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-xs text-[#A0A0B8]">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Evolution Lineage */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Evolution Lineage</h2>
        {versions?.versions && versions.versions.length > 0 ? (
          <div className="space-y-3">
            {versions.versions.map((v: any) => (
              <div key={v.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#0A0A1A]">
                <div className="w-10 h-10 rounded-full bg-[#0055FF]/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#0055FF]">v{v.version}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{v.policyTitle}</span>
                    {v.verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#A0A0B8] mt-1">
                    <span>Before: {v.successRateBeforePct}%</span>
                    <span>Projected: {v.projectedSuccessRatePct}%</span>
                    {v.measuredSuccessRatePct && <span>Measured: {v.measuredSuccessRatePct}%</span>}
                  </div>
                </div>
                <span className="text-xs text-[#A0A0B8]">
                  {new Date(v.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#A0A0B8] text-center py-8">No evolution history yet</p>
        )}
      </Card>
    </div>
  );
}