/**
 * Settings Page
 * ============================================================
 * API keys, usage, account management.
 */

import { useState } from 'react';
import { Key, User, CreditCard, Trash2, Copy, Check } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'api-keys' | 'account' | 'usage' | 'billing'>('api-keys');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'account', label: 'Account', icon: User },
    { id: 'usage', label: 'Usage', icon: CreditCard },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#A0A0B8] mt-1">Manage your account and API access</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2A2A4A] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#0055FF]/10 text-[#0055FF]'
                : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'api-keys' && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">API Keys</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A1A]">
              <Key className="w-5 h-5 text-[#0055FF]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Production Key</p>
                <p className="text-xs text-[#A0A0B8]">Created Jul 15, 2026</p>
              </div>
              <code className="text-xs text-[#A0A0B8] bg-[#141428] px-2 py-1 rounded">
                pk0_****************************
              </code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard('pk0_test_key')}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 text-[#FF3355]" />
              </Button>
            </div>
            <Button variant="secondary" size="sm">
              Generate New Key
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'account' && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
          <div className="space-y-4">
            <Input label="Email" value={user?.email || ''} disabled />
            <Input label="Role" value={user?.role || ''} disabled />
            <div className="pt-4 border-t border-[#2A2A4A]">
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'usage' && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Usage</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0A0A1A] text-center">
              <p className="text-2xl font-bold text-white">42</p>
              <p className="text-xs text-[#A0A0B8]">Policies Generated</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0A1A] text-center">
              <p className="text-2xl font-bold text-white">1.2k</p>
              <p className="text-xs text-[#A0A0B8]">API Calls</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0A1A] text-center">
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-xs text-[#A0A0B8]">Sim Runs</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Billing</h2>
          <div className="p-4 rounded-xl bg-[#0A0A1A] border border-[#2A2A4A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Free Plan</p>
                <p className="text-xs text-[#A0A0B8]">100 policies/month</p>
              </div>
              <Button variant="secondary" size="sm">Upgrade</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}