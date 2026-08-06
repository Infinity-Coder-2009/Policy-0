/**
 * Policies List Page
 * ============================================================
 * Search, filter, and browse generated policies.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  FileText,
  Trash2,
  Download,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { Card, Badge, Input, Select, Button, EmptyState, Skeleton } from '../components/ui';

interface Policy {
  id: string;
  title: string;
  robot: string;
  status: string;
  successRatePct: number;
  mode: string;
  version: number;
  createdAt: string;
}

export function PoliciesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['policies', search, statusFilter, modeFilter],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; policies: Policy[] }>('/api/policies');
      return res.policies || [];
    },
  });

  const filteredPolicies = data?.filter((p) => {
    const matchesSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesMode = modeFilter === 'all' || p.mode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Policies</h1>
          <p className="text-[#A0A0B8] mt-1">Browse and manage generated policies</p>
        </div>
        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white font-semibold shadow-lg shadow-[#0055FF]/20 transition-all"
        >
          New Policy
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0B8]" />
              <input
                type="text"
                placeholder="Search policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0055FF] transition-all"
              />
            </div>
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'done', label: 'Done' },
              { value: 'failed', label: 'Failed' },
              { value: 'verified', label: 'Verified' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Modes' },
              { value: 'SIMULATED', label: 'Simulated' },
              { value: 'REAL', label: 'Real' },
            ]}
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {/* Policies List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : filteredPolicies && filteredPolicies.length > 0 ? (
        <div className="space-y-4">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id} hover className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0055FF]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-[#0055FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white truncate">{policy.title}</h3>
                  <Badge variant={policy.mode === 'REAL' ? 'real' : 'simulated'}>
                    {policy.mode}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#A0A0B8]">
                  <span>{policy.robot}</span>
                  <span>v{policy.version}</span>
                  <span>{policy.successRatePct}% success</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/policies/${policy.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4 text-[#FF3355]" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No policies found"
          description="Try adjusting your search or filters, or generate a new policy."
          action={
            <Link to="/generate">
              <Button>Generate Policy</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}