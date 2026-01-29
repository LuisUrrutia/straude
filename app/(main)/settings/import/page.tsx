'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

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
        todayData = data.data.find((d: { date: string }) => d.date === today);
      } else if (data.date === today) {
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
            models: todayData.models || [],
            inputTokens: todayData.inputTokens || 0,
            outputTokens: todayData.outputTokens || 0,
            cacheCreationTokens: todayData.cacheCreationTokens || 0,
            cacheReadTokens: todayData.cacheReadTokens || 0,
            totalTokens: todayData.totalTokens || 0,
            costUSD: todayData.costUSD || 0,
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
      <h1 className="font-heading text-2xl font-bold text-dark mb-2">Import Usage</h1>
      <p className="text-gray font-body mb-6">
        Paste your ccusage JSON output to import today&apos;s usage data.
      </p>

      <div className="bg-sand/50 rounded-lg p-4 mb-6">
        <p className="font-heading text-sm font-semibold text-dark mb-2">
          How to get your usage data:
        </p>
        <code className="block bg-dark text-light p-3 rounded font-mono text-sm">
          ccusage daily --json --since {new Date().toISOString().split('T')[0].replace(/-/g, '')} --until {new Date().toISOString().split('T')[0].replace(/-/g, '')}
        </code>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-heading text-sm font-medium text-dark mb-2">
            JSON Output
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"type": "daily", "data": [...], "summary": {...}}'
            rows={10}
            className="w-full px-4 py-3 border border-gray rounded-lg font-mono text-sm text-dark placeholder:text-gray/50 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all resize-none"
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sage">
            <CheckCircle className="size-5" />
            <span className="font-body">Usage imported! Redirecting to feed...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-error">
            <AlertCircle className="size-5" />
            <span className="font-body">{error}</span>
          </div>
        )}

        <Button type="submit" disabled={!jsonInput.trim() || isSubmitting} className="w-full">
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

      <div className="mt-8 p-4 border border-sand rounded-lg">
        <p className="font-heading text-sm font-semibold text-dark mb-2">
          Prefer the CLI?
        </p>
        <p className="text-gray font-body text-sm mb-3">
          Install the Straude CLI for automatic, verified usage uploads.
        </p>
        <code className="block bg-dark text-light p-3 rounded font-mono text-sm">
          npm install -g straude && straude login
        </code>
      </div>
    </div>
  );
}
