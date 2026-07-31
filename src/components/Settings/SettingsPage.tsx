import React, { useState } from 'react';
import { Key, Copy, Check, Shield, Trash2, CreditCard, Cpu, Activity, User, Mail, Lock, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keySnippet: string;
  fullKey: string;
  created: string;
  lastUsed: string;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'apikeys' | 'usage' | 'account' | 'billing'>('apikeys');

  // API Keys state
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    {
      id: 'key-1',
      name: 'Production Fleet Robot SDK',
      keySnippet: 'pol0_live_9f83...a29b',
      fullKey: 'pol0_live_9f83719a48b21092a29b',
      created: '2026-07-15',
      lastUsed: 'Just now',
    },
    {
      id: 'key-2',
      name: 'Colab MuJoCo Training Script',
      keySnippet: 'pol0_test_41b7...d88c',
      fullKey: 'pol0_test_41b72091c53240d88c',
      created: '2026-07-28',
      lastUsed: '2 hours ago',
    },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [generatedKeyAlert, setGeneratedKeyAlert] = useState<string | null>(null);

  // Account form state
  const [email, setEmail] = useState('drnadirakhanbds@gmail.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountSavedMsg, setAccountSavedMsg] = useState(false);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const rawRandom = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const full = `pol0_live_${rawRandom}`;
    const snippet = `pol0_live_${rawRandom.substring(0, 4)}...${rawRandom.substring(12)}`;

    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      keySnippet: snippet,
      fullKey: full,
      created: new Date().toISOString().substring(0, 10),
      lastUsed: 'Never',
    };

    setKeys([newKey, ...keys]);
    setNewKeyName('');
    setGeneratedKeyAlert(full);
  };

  const handleCopyKey = (key: ApiKeyItem) => {
    navigator.clipboard.writeText(key.fullKey);
    setCopiedKeyId(key.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDeleteKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSavedMsg(true);
    setTimeout(() => setAccountSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#141428] rounded-2xl border border-[#2A2A4A] p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Developer Settings & Organization</h1>
          <p className="text-xs text-[#A0A0B8]">Manage simulation API credentials, GPU compute quotas, security keys, and billing.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A1A] border border-[#2A2A4A] text-xs font-mono text-[#00CC88]">
          <Shield className="w-3.5 h-3.5 text-[#00CC88]" />
          <span>Organization ID: org_policy0_8841</span>
        </div>
      </div>

      {/* Settings Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#2A2A4A] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('apikeys')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'apikeys'
              ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
              : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys</span>
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'usage'
              ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
              : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Usage & Quotas</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
              : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-[#0055FF] text-white shadow-lg shadow-[#0055FF]/20'
              : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing & Plan</span>
        </button>
      </div>

      {/* Tab 1: API Keys */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          {/* Create Key Card */}
          <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0055FF]" />
              <span>Generate New Simulation API Key</span>
            </h2>
            <p className="text-xs text-[#A0A0B8]">
              API keys grant full programmatic control over Policy-0 compiler endpoints, Isaac Sim cluster vectorization, and ONNX model exports.
            </p>

            <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Key Description / Service Name (e.g. Robot Fleet Worker 01)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
                className="flex-1 bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF] transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white text-xs font-bold shadow-lg shadow-[#0055FF]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Secret Key</span>
              </button>
            </form>

            {generatedKeyAlert && (
              <div className="p-4 rounded-xl bg-[#00CC88]/10 border border-[#00CC88]/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#00CC88]">
                  <span>New Secret Key Generated Successfully! Save it now; it won't be shown again.</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKeyAlert);
                      alert('Copied to clipboard');
                    }}
                    className="px-2.5 py-1 rounded bg-[#00CC88]/20 hover:bg-[#00CC88]/30 text-white font-mono text-[11px] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white bg-[#0A0A1A] p-2.5 rounded-lg border border-[#2A2A4A] select-all">
                  {generatedKeyAlert}
                </div>
              </div>
            )}
          </div>

          {/* Active Keys Table */}
          <div className="bg-[#141428] rounded-2xl border border-[#2A2A4A] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#2A2A4A]">
              <h3 className="text-sm font-bold text-white">Active API Keys ({keys.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#E8E8F0]">
                <thead className="bg-[#0A0A1A] text-[#A0A0B8] uppercase font-mono text-[10px] border-b border-[#2A2A4A]">
                  <tr>
                    <th className="py-3.5 px-6">Key Name</th>
                    <th className="py-3.5 px-6">Secret Token</th>
                    <th className="py-3.5 px-6">Created</th>
                    <th className="py-3.5 px-6">Last Used</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A4A]">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-[#0A0A1A]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">{k.name}</td>
                      <td className="py-4 px-6 font-mono text-[#0088FF]">{k.keySnippet}</td>
                      <td className="py-4 px-6 text-[#A0A0B8]">{k.created}</td>
                      <td className="py-4 px-6 text-[#A0A0B8]">{k.lastUsed}</td>
                      <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyKey(k)}
                          className="p-2 rounded-lg bg-[#0A0A1A] hover:bg-[#2A2A4A] text-white transition-all"
                          title="Copy Full Key"
                        >
                          {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-[#00CC88]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-2 rounded-lg bg-[#0A0A1A] hover:bg-rose-500/20 text-[#A0A0B8] hover:text-rose-400 transition-all"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Usage & Quotas */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl">
              <span className="text-xs text-[#A0A0B8] font-semibold uppercase tracking-wider block mb-1">Monthly Policies Generated</span>
              <div className="text-3xl font-extrabold text-white mb-2">42 / 50</div>
              <div className="w-full bg-[#0A0A1A] h-2 rounded-full overflow-hidden border border-[#2A2A4A]">
                <div className="bg-[#0055FF] h-full w-[84%] rounded-full"></div>
              </div>
              <span className="text-[11px] text-[#A0A0B8] mt-2 block font-mono">8 Policy compilations remaining in Free Tier</span>
            </div>

            <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl">
              <span className="text-xs text-[#A0A0B8] font-semibold uppercase tracking-wider block mb-1">GPU Sim Cluster Hours</span>
              <div className="text-3xl font-extrabold text-[#00CC88] mb-2">18.4 hrs</div>
              <div className="w-full bg-[#0A0A1A] h-2 rounded-full overflow-hidden border border-[#2A2A4A]">
                <div className="bg-[#00CC88] h-full w-[36%] rounded-full"></div>
              </div>
              <span className="text-[11px] text-[#A0A0B8] mt-2 block font-mono">Isaac Sim GPU parallelization pool active</span>
            </div>

            <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl">
              <span className="text-xs text-[#A0A0B8] font-semibold uppercase tracking-wider block mb-1">API Requests This Month</span>
              <div className="text-3xl font-extrabold text-white mb-2">12,480</div>
              <div className="w-full bg-[#0A0A1A] h-2 rounded-full overflow-hidden border border-[#2A2A4A]">
                <div className="bg-[#0088FF] h-full w-[24%] rounded-full"></div>
              </div>
              <span className="text-[11px] text-[#A0A0B8] mt-2 block font-mono">Rate Limit: 500 req / min</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Account & Security */}
      {activeTab === 'account' && (
        <div className="bg-[#141428] p-6 sm:p-8 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-[#0055FF]" />
            <span>Account Details & Password</span>
          </h2>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-2">
                New Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white text-xs font-bold shadow-lg shadow-[#0055FF]/20 transition-all cursor-pointer"
              >
                Save Account Changes
              </button>

              {accountSavedMsg && (
                <span className="text-xs text-[#00CC88] flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings Updated!</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Billing & Plan */}
      {activeTab === 'billing' && (
        <div className="bg-[#141428] p-6 sm:p-8 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#2A2A4A] pb-4">
            <div>
              <span className="text-xs text-[#A0A0B8] uppercase font-semibold block mb-1">Current Active Plan</span>
              <h3 className="text-xl font-bold text-white">Freemium Research Developer</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#00CC88]/10 text-[#00CC88] border border-[#00CC88]/30 text-xs font-bold">
              Active Tier
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0A0A1A] p-5 rounded-xl border border-[#2A2A4A] space-y-3">
              <span className="text-xs font-bold text-white block">Payment Method</span>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#141428] border border-[#2A2A4A]">
                  <CreditCard className="w-5 h-5 text-[#0055FF]" />
                </div>
                <div>
                  <span className="text-xs font-mono text-white block">Visa ending in 4242</span>
                  <span className="text-[10px] text-[#A0A0B8]">Expires 09/2028</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A1A] p-5 rounded-xl border border-[#2A2A4A] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-white block mb-1">Simulation Cluster GPU Rate</span>
                <span className="text-2xl font-extrabold text-[#00CC88]">$100 / hr</span>
                <p className="text-[11px] text-[#A0A0B8] mt-1">Metered billing for Isaac Sim & MuJoCo GPU vectorization.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
