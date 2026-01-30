'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [todayCode, setTodayCode] = useState('YYYYMMDD');
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    const command = `bunx ccusage daily --json --since ${todayCode} --until ${todayCode}`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    setTodayCode(today);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setStatus('idle');
    setError('');

    try {
      // Parse the JSON
      let data;
      try {
        data = JSON.parse(jsonInput);
      } catch {
        setError('Invalid JSON format');
        setStatus('error');
        setIsSubmitting(false);
        return;
      }

      // Find today's entry
      const today = new Date().toISOString().split('T')[0];
      let todayData;

      if (data.type === 'daily' && Array.isArray(data.data)) {
        // Format: { type: 'daily', data: [...] }
        todayData = data.data.find((d: { date: string }) => d.date === today);
      } else if (Array.isArray(data.daily)) {
        // Format: { daily: [...], totals: {...} } (ccusage output)
        todayData = data.daily.find((d: { date: string }) => d.date === today);
      } else if (data.date === today) {
        // Format: single day object
        todayData = data;
      }

      if (!todayData) {
        setError('No data found for today. Straude only accepts today\'s usage data.');
        setStatus('error');
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const res = await fetch('/api/usage/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          data: {
            date: todayData.date,
            models: todayData.models || todayData.modelsUsed || [],
            inputTokens: todayData.inputTokens || 0,
            outputTokens: todayData.outputTokens || 0,
            cacheCreationTokens: todayData.cacheCreationTokens || 0,
            cacheReadTokens: todayData.cacheReadTokens || 0,
            totalTokens: todayData.totalTokens || 0,
            costUSD: todayData.costUSD ?? todayData.totalCost ?? 0,
          },
          source: 'web',
        }),
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => router.push('/feed'), 1500);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to submit usage');
        setStatus('error');
      }
    } catch {
      setError('Failed to submit usage');
      setStatus('error');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="type-display-condensed text-2xl text-dark mb-2">Import Usage</h1>
      <p className="text-sm text-gray mb-6">
        Paste your ccusage JSON output to import today&apos;s usage data.
      </p>

      <div className="border border-dark p-4 mb-6 bg-light">
        <p className="type-mono-look text-dark mb-2">
          How to get your usage data:
        </p>
        <button
          onClick={copyCommand}
          className="w-full flex items-center justify-between bg-dark text-light p-3 font-mono text-sm border border-dark hover:bg-gray transition-colors cursor-pointer text-left"
        >
          <code>bunx ccusage daily --json --since {todayCode} --until {todayCode}</code>
          {copied ? (
            <Check className="size-4 text-success flex-shrink-0 ml-2" />
          ) : (
            <Copy className="size-4 opacity-60 flex-shrink-0 ml-2" />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="type-mono-look text-dark mb-2">
            JSON Output
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"type": "daily", "data": [...], "summary": {...}}'
            rows={10}
            className="w-full input-brutal input-brutal-mono text-sm resize-none"
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="size-5" />
            <span className="type-mono-look text-success">Usage imported! Redirecting to feed...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-error">
            <AlertCircle className="size-5" />
            <span className="type-mono-look">{error}</span>
          </div>
        )}

        <Button type="submit" disabled={!jsonInput.trim() || isSubmitting} className="w-full justify-center">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Importing...
            </>
          ) : (
            'Import Usage'
          )}
        </Button>
      </form>

      <div className="mt-8 p-4 border border-dark">
        <p className="type-mono-look text-dark mb-2">
          Prefer the CLI?
        </p>
        <p className="text-sm text-gray mb-3">
          Install the Straude CLI for automatic, verified usage uploads.
        </p>
        <code className="block bg-dark text-light p-3 font-mono text-sm border border-dark">
          npm install -g straude && straude login
        </code>
      </div>
    </div>
  );
}
