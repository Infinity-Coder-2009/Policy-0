/**
 * System Health Page (Admin Only)
 * ============================================================
 * NVIDIA service status, database, uptime, memory, request rate.
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Cpu, HardDrive, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Badge, Skeleton } from '../components/ui';

interface HealthData {
  status: string;
  checks: Record<string, boolean>;
  timestamp: string;
}

interface NvidiaHealth {
  overall: string;
  totalLatencyMs: number;
  checks: Record<string, { status: string; latencyMs?: number; error?: string }>;
}

export function HealthPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<HealthData>('/health/ready'),
    refetchInterval: 10000,
  });

  const { data: nvidiaHealth, isLoading: nvidiaLoading } = useQuery({
    queryKey: ['nvidia-health'],
    queryFn: () => api.get<NvidiaHealth>('/api/nvidia/health'),
    refetchInterval: 30000,
  });

  const isLoading = healthLoading || nvidiaLoading;

  const getStatusIcon = (status: string) => {
    if (status === 'ok' || status === 'ready') return <CheckCircle2 className="w-5 h-5 text-[#00CC88]" />;
    if (status === 'degraded') return <AlertCircle className="w-5 h-5 text-[#FFB800]" />;
    return <XCircle className="w-5 h-5 text-[#FF3355]" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-[#A0A0B8] mt-1">Monitor system components and NVIDIA services</p>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#0055FF]" />
            <div>
              <p className="text-sm text-[#A0A0B8]">Application</p>
              <p className="text-lg font-semibold text-white capitalize">
                {health?.status || 'checking...'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-[#00CC88]" />
            <div>
              <p className="text-sm text-[#A0A0B8]">NVIDIA Stack</p>
              <p className="text-lg font-semibold text-white capitalize">
                {nvidiaHealth?.overall || 'checking...'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-[#FFB800]" />
            <div>
              <p className="text-sm text-[#A0A0B8]">Persistence</p>
              <p className="text-lg font-semibold text-white capitalize">
                {health?.checks?.persistence ? 'connected' : 'disconnected'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* NVIDIA Services */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">NVIDIA Services</h2>
        {nvidiaLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : nvidiaHealth?.checks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(nvidiaHealth.checks).map(([name, check]) => (
              <div
                key={name}
                className="p-4 rounded-xl bg-[#0A0A1A] border border-[#2A2A4A]"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(check.status)}
                  <span className="text-sm font-medium text-white capitalize">
                    {name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="space-y-1">
                  <Badge
                    variant={
                      check.status === 'ok'
                        ? 'success'
                        : check.status === 'degraded'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {check.status}
                  </Badge>
                  {check.latencyMs && (
                    <p className="text-xs text-[#A0A0B8]">{check.latencyMs}ms</p>
                  )}
                  {check.error && (
                    <p className="text-xs text-[#FF3355]">{check.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#A0A0B8]">No health data available</p>
        )}
      </Card>

      {/* System Info */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">System Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-[#0A0A1A]">
            <div className="flex items-center gap-2 text-[#A0A0B8] mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Uptime</span>
            </div>
            <p className="text-sm font-medium text-white">
              {Math.floor((performance.now() / 1000 / 60 / 60) % 24)}h {Math.floor((performance.now() / 1000 / 60) % 60)}m
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#0A0A1A]">
            <div className="flex items-center gap-2 text-[#A0A0B8] mb-1">
              <HardDrive className="w-4 h-4" />
              <span className="text-xs">Memory</span>
            </div>
            <p className="text-sm font-medium text-white">
              {Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)} MB
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#0A0A1A]">
            <div className="flex items-center gap-2 text-[#A0A0B8] mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Request Rate</span>
            </div>
            <p className="text-sm font-medium text-white">-- req/s</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0A0A1A]">
            <div className="flex items-center gap-2 text-[#A0A0B8] mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs">Backend</span>
            </div>
            <p className="text-sm font-medium text-white">JSON</p>
          </div>
        </div>
      </Card>
    </div>
  );
}