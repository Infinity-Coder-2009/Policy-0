import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  TrendingUp,
  Brain,
  Wrench,
  Play,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Sparkles,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import {
  DeploymentRun,
  CategorizedFailure,
  ImprovementRecommendation,
  FlywheelStats,
  GeneratedPolicy,
  FailureCategory,
  PolicyEvolutionRecord,
  EvolutionOverview,
} from '../../types';
import {
  MOCK_DEPLOYMENT_RUNS,
  MOCK_CATEGORIZED_FAILURES,
  MOCK_IMPROVEMENTS,
  MOCK_FLYWHEEL_STATS,
  MOCK_EVOLUTION_RECORDS,
  MOCK_EVOLUTION_OVERVIEW,
} from '../../data/mockData';

interface DataMoatDashboardProps {
  policies: GeneratedPolicy[];
  onPolicyEvolved: (policy: GeneratedPolicy, record: PolicyEvolutionRecord) => void;
}

const CATEGORY_LABELS: Record<FailureCategory, string> = {
  grasp_slip: 'Grasp Slip',
  collision_misdetection: 'Collision Mis-detect',
  stability_oscillation: 'Oscillation',
  timeout: 'Timeout',
  target_lost: 'Target Lost',
  contact_jam: 'Contact Jam',
  joint_limit: 'Joint Limit',
  navigation_failure: 'Nav Failure',
  calibration_drift: 'Calibration Drift',
  unknown: 'Unknown',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-slate-300 bg-slate-800/60 border-slate-700',
  medium: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  high: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-300 bg-red-500/10 border-red-500/40',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-300 bg-slate-800/60 border-slate-700',
  medium: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  high: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-300 bg-red-500/10 border-red-500/40',
};

export const DataMoatDashboard: React.FC<DataMoatDashboardProps> = ({ policies, onPolicyEvolved }) => {
  const [runs, setRuns] = useState<DeploymentRun[]>(MOCK_DEPLOYMENT_RUNS);
  const [failures, setFailures] = useState<CategorizedFailure[]>(MOCK_CATEGORIZED_FAILURES);
  const [improvements, setImprovements] = useState<ImprovementRecommendation[]>(MOCK_IMPROVEMENTS);
  const [stats, setStats] = useState<FlywheelStats>(MOCK_FLYWHEEL_STATS);
  const [versions, setVersions] = useState<PolicyEvolutionRecord[]>(MOCK_EVOLUTION_RECORDS);
  const [overview, setOverview] = useState<EvolutionOverview>(MOCK_EVOLUTION_OVERVIEW);
  const [isBackendUp, setIsBackendUp] = useState(true);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isGeneratingImprov, setIsGeneratingImprov] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const refreshAll = useCallback(async () => {
    try {
      const [statsRes, runsRes, failsRes, impRes, versionsRes, overviewRes] = await Promise.all([
        fetch('/api/telemetry/stats'),
        fetch('/api/telemetry/runs'),
        fetch('/api/telemetry/failures'),
        fetch('/api/improvements'),
        fetch('/api/evolution/versions'),
        fetch('/api/evolution/overview'),
      ]);

      if (!statsRes.ok) throw new Error('backend unavailable');

      const statsData = await statsRes.json();
      const runsData = await runsRes.json();
      const failsData = await failsRes.json();
      const impData = await impRes.json();
      const versionsData = await versionsRes.json();
      const overviewData = await overviewRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (runsData.success && Array.isArray(runsData.runs) && runsData.runs.length > 0) {
        setRuns(runsData.runs);
      }
      if (failsData.success && Array.isArray(failsData.failures) && failsData.failures.length > 0) {
        setFailures(failsData.failures);
      }
      if (impData.success && Array.isArray(impData.improvements) && impData.improvements.length > 0) {
        setImprovements(impData.improvements);
      }
      if (versionsData.success && Array.isArray(versionsData.versions) && versionsData.versions.length > 0) {
        setVersions(versionsData.versions);
      }
      if (overviewData.success && overviewData.overview) {
        setOverview(overviewData.overview);
      }
      setIsBackendUp(true);
    } catch (err) {
      console.warn('Data moat backend unavailable, using local seed:', err);
      setIsBackendUp(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const uncategorizedRuns = runs.filter(
    (r) => r.outcome !== 'success' && !failures.some((f) => f.runId === r.id),
  );

  const handleSimulateRun = async () => {
    if (policies.length === 0) {
      showToast('Compile a policy first to simulate deployment');
      return;
    }
    setIsSimulating(true);
    try {
      const res = await fetch('/api/telemetry/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: policies[0] }),
      });
      const data = await res.json();
      if (data.success && data.run) {
        setRuns((prev) => [data.run, ...prev]);
        showToast(`Deployment run recorded: ${data.run.outcome}`);
        await refreshAll();
      } else {
        throw new Error(data.error || 'Simulation failed');
      }
    } catch (err: any) {
      console.warn('Simulate run error:', err);
      showToast('Simulation failed — is the backend running?');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCategorizeAll = async () => {
    if (uncategorizedRuns.length === 0) {
      showToast('No uncategorized failures to analyze');
      return;
    }
    setIsCategorizing(true);
    try {
      for (const run of uncategorizedRuns) {
        const res = await fetch('/api/telemetry/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId: run.id, force: true }),
        });
        const data = await res.json();
        if (data.success && data.failure) {
          setFailures((prev) => {
            const without = prev.filter((f) => f.runId !== run.id);
            return [data.failure, ...without];
          });
        }
      }
      showToast(`Categorized ${uncategorizedRuns.length} failure(s) with failure intelligence`);
      await refreshAll();
    } catch (err: any) {
      console.warn('Categorize error:', err);
      showToast('Categorization failed');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleGenerateImprovements = async () => {
    setIsGeneratingImprov(true);
    try {
      const res = await fetch('/api/improvements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useLLM: false }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.improvements)) {
        setImprovements(data.improvements);
        if (data.stats) setStats(data.stats);
        showToast(`Generated ${data.improvements.length} improvement recommendation(s)`);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      console.warn('Generate improvements error:', err);
      showToast('Improvement generation failed — is the backend running?');
    } finally {
      setIsGeneratingImprov(false);
    }
  };

  const handleApplyImprovement = async (id: string) => {
    setApplyingId(id);
    try {
      const res = await fetch('/api/improvements/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ improvementId: id }),
      });
      const data = await res.json();
      if (data.success && data.improvement) {
        setImprovements((prev) => prev.map((i) => (i.id === id ? data.improvement : i)));
        if (data.stats) setStats(data.stats);
        showToast(`Improvement applied — policy scheduled for re-compilation`);
      } else {
        throw new Error(data.error || 'Apply failed');
      }
    } catch (err: any) {
      console.warn('Apply improvement error:', err);
      showToast('Apply failed');
    } finally {
      setApplyingId(null);
    }
  };

  const appliedForActivePolicy = policies.length > 0
    ? improvements.filter((i) => i.policyId === policies[0].id && i.status === 'applied')
    : [];

  const handleRegenerate = async () => {
    if (policies.length === 0) {
      showToast('Compile a policy first to evolve');
      return;
    }
    setIsEvolving(true);
    try {
      const res = await fetch('/api/evolution/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: policies[0] }),
      });
      const data = await res.json();
      if (data.success && data.policy && data.record) {
        setVersions((prev) => [data.record, ...prev.filter((v) => v.id !== data.record.id)]);
        if (data.overview) setOverview(data.overview);
        onPolicyEvolved(data.policy, data.record);
        showToast(
          `Policy evolved to v${data.record.version} — success ${data.record.successRateBeforePct}% → ${data.record.projectedSuccessRatePct}%`,
        );
      } else {
        throw new Error(data.error || 'Regeneration failed');
      }
    } catch (err: any) {
      console.warn('Regenerate error:', err);
      showToast(
        err?.message?.includes('No applied improvements')
          ? 'Apply improvements first, then regenerate'
          : 'Regeneration failed — is the backend running?',
      );
    } finally {
      setIsEvolving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#141428] border border-[#00CC88]/50 text-[#00CC88] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-[#0088FF]" />
          Data Moat — Self-Improving Policy Loop
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Anonymous real-world pass/fail telemetry from deployed policies feeds a high-understanding LLM that categorizes
          failures and drives automated improvements. Fail → Categorize → Fix → Redeploy. The flywheel gets smarter with every run.
        </p>
        {!isBackendUp && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4" />
            Backend not reachable — showing seed data. Run <code className="font-mono">npm run dev</code> to enable the live flywheel.
          </div>
        )}
      </div>

      {/* Flywheel Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deployment Runs</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalRuns}</p>
          <p className="text-[10px] text-slate-500">{stats.successRuns} success · {stats.failureRuns} failure</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pass Rate</span>
            <TrendingUp className="w-4 h-4 text-[#00CC88]" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.passRatePct}%</p>
          <p className="text-[10px] text-slate-500">real-world success signal</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Failures Categorized</span>
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.categorizedFailures}</p>
          <p className="text-[10px] text-slate-500">{stats.uncategorizedFailures} pending LLM analysis</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#141428] border border-[#2A2A4A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Improvements Applied</span>
            <Wrench className="w-4 h-4 text-[#FFB800]" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.improvementsApplied}/{stats.improvementsGenerated}</p>
          <p className="text-[10px] text-slate-500">self-improvement loop engaged</p>
        </div>
      </div>

      {/* Top Failure Categories */}
      {stats.topFailureCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Top Failure Categories:</span>
          {stats.topFailureCategories.map((tc) => (
            <span
              key={tc.category}
              className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-semibold"
            >
              {CATEGORY_LABELS[tc.category]} × {tc.count}
            </span>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSimulateRun}
          disabled={isSimulating}
          className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Simulate Deployment Run
        </button>
        <button
          onClick={handleCategorizeAll}
          disabled={isCategorizing || uncategorizedRuns.length === 0}
          className="px-4 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          LLM Categorize Failures ({uncategorizedRuns.length})
        </button>
        <button
          onClick={handleGenerateImprovements}
          disabled={isGeneratingImprov || failures.length === 0}
          className="px-4 py-2.5 rounded-xl bg-[#FFB800]/20 hover:bg-[#FFB800]/30 border border-[#FFB800]/30 text-[#FFB800] text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isGeneratingImprov ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Improvements
        </button>
        <button
          onClick={handleRegenerate}
          disabled={isEvolving || appliedForActivePolicy.length === 0 || policies.length === 0}
          className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isEvolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate Evolved Policy ({appliedForActivePolicy.length} applied)
        </button>
        <button
          onClick={refreshAll}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Runs Column */}
        <div className="xl:col-span-1 rounded-2xl bg-[#0D0D1F] border border-[#2A2A4A] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Recent Deployment Runs
            </h3>
            <span className="text-[10px] text-slate-500">{runs.length} total</span>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {runs.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">No deployment runs yet — simulate one to start the flywheel.</p>
            )}
            {runs.map((run) => (
              <div key={run.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-white font-semibold truncate">{run.taskTitle}</p>
                  {run.outcome === 'success' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> PASS
                    </span>
                  ) : run.outcome === 'partial' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                      <AlertTriangle className="w-3 h-3" /> PARTIAL
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-semibold">
                      <XCircle className="w-3 h-3" /> FAIL
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {run.robotModel} · {run.successScore}/100 · {run.durationSec}s ·{' '}
                  <span className={run.source === 'real_world' ? 'text-[#0088FF]' : 'text-slate-400'}>{run.source}</span>
                </p>
                {run.errorSignals.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {run.errorSignals.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-red-300/80">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">t={s.occurredAtSec}s · {s.type}: {s.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Failures Column */}
        <div className="xl:col-span-1 rounded-2xl bg-[#0D0D1F] border border-[#2A2A4A] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Categorized Failures
            </h3>
            <span className="text-[10px] text-slate-500">{failures.length} classified</span>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {failures.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">No failures classified yet.</p>
            )}
            {failures.map((f) => (
              <div key={f.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-semibold">
                    {CATEGORY_LABELS[f.category]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${SEVERITY_COLORS[f.severity]}`}>
                    {f.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-white font-semibold mt-2 truncate">{f.taskTitle}</p>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{f.rootCause}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-semibold ${f.classifier === 'llm' ? 'text-violet-300' : 'text-slate-500'}`}>
                    {f.classifier === 'llm' ? (
                      <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> LLM {Math.round(f.confidence * 100)}%</span>
                    ) : (
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Rules {Math.round(f.confidence * 100)}%</span>
                    )}
                  </span>
                  <button
                    onClick={handleCategorizeAll}
                    disabled={isCategorizing}
                    className="text-[10px] text-violet-300 hover:text-violet-200 font-semibold cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Brain className="w-3 h-3" /> Deep analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improvements Column */}
        <div className="xl:col-span-1 rounded-2xl bg-[#0D0D1F] border border-[#2A2A4A] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#FFB800]" />
              Improvement Recommendations
            </h3>
            <span className="text-[10px] text-slate-500">{improvements.length} proposals</span>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {improvements.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">Generate improvements from failure intelligence.</p>
            )}
            {improvements.map((imp) => (
              <div key={imp.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${PRIORITY_COLORS[imp.priority]}`}>
                    {imp.priority.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#00CC88] font-bold">
                    <TrendingUp className="w-3 h-3" /> +{imp.estimatedGainPct}%
                  </span>
                </div>
                <p className="text-xs text-white font-semibold mt-2">{imp.title}</p>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{imp.description}</p>

                <div className="mt-2 space-y-1">
                  {imp.changes.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="text-slate-500">{c.target}:</span>
                      <code className="text-amber-300/80 font-mono line-through decoration-red-500/60">{c.from}</code>
                      <span className="text-slate-600">→</span>
                      <code className="text-emerald-300/90 font-mono">{c.to}</code>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  {imp.status === 'applied' ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied — policy queued for re-compilation
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApplyImprovement(imp.id)}
                      disabled={applyingId === imp.id}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FFB800]/15 hover:bg-[#FFB800]/25 border border-[#FFB800]/30 text-[#FFB800] text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {applyingId === imp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      APPLY IMPROVEMENT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Self-Improvement Loop */}
      <div className="rounded-2xl bg-[#0D0D1F] border border-[#2A2A4A] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Self-Improvement Loop — Policy Evolution Lineage
          </h3>
          <span className="text-[10px] text-slate-500">{versions.length} version(s) recorded</span>
        </div>

        {/* Evolution Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Policies Evolved</span>
            <span className="text-lg font-bold text-white">{overview.policiesEvolved}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Total Versions</span>
            <span className="text-lg font-bold text-white">{overview.totalVersions}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Latest v</span>
            <span className="text-lg font-bold text-white">v{overview.latestVersionCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Avg Gain</span>
            <span className="text-lg font-bold text-[#00CC88]">+{overview.avgGainPct}%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Best Gain</span>
            <span className="text-lg font-bold text-[#00CC88]">+{overview.bestGainPct}%</span>
          </div>
        </div>

        {/* Version Lineage */}
        <div className="space-y-3">
          {versions.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">
              No evolved versions yet — apply improvements and click "Regenerate Evolved Policy" to close the loop.
            </p>
          )}
          {versions.map((v) => (
            <div key={v.id} className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                    v{v.version}
                  </span>
                  <div>
                    <p className="text-xs text-white font-semibold">{v.policyTitle}</p>
                    <p className="text-[10px] text-slate-500">
                      {v.appliedImprovementTitles.join(' · ') || 'No improvements recorded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{v.successRateBeforePct}%</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-300">{v.projectedSuccessRatePct}%</span>
                  <span className="text-[10px] font-bold text-[#00CC88]">+{Math.round(v.projectedSuccessRatePct - v.successRateBeforePct)}%</span>
                </div>
              </div>
              {v.changesApplied.length > 0 && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {v.changesApplied.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900/50 rounded-lg px-2 py-1.5">
                      <span className="text-slate-500">{c.target} / {c.parameter}:</span>
                      <code className="text-amber-300/80 font-mono line-through decoration-red-500/60">{c.from}</code>
                      <span className="text-slate-600">→</span>
                      <code className="text-emerald-300/90 font-mono">{c.to}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DataMoatDashboard;
