'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const code = searchParams.get('code');

  // Only track success/error from API calls, derive loading/confirming from props
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Derive display status from state
  const status = !isLoaded
    ? 'loading'
    : apiStatus === 'success'
      ? 'success'
      : apiStatus === 'error' || !code
        ? 'error'
        : apiStatus === 'loading'
          ? 'loading'
          : 'confirming';

  // Set error message for missing code
  const displayError = !code && isLoaded ? 'No verification code provided' : error;

  useEffect(() => {
    if (!isLoaded || !code) return;

    if (!user) {
      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect_url=${encodeURIComponent(`/cli/verify?code=${code}`)}`);
    }
  }, [code, user, isLoaded, router]);

  const handleConfirm = async () => {
    setApiStatus('loading');

    try {
      const res = await fetch('/api/auth/cli/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setApiStatus('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Verification failed');
        setApiStatus('error');
      }
    } catch {
      setError('Network error');
      setApiStatus('error');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-gray">
        <Loader2 className="size-5 animate-spin" />
        <span className="type-mono-look">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="panel-brutal p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 text-accent animate-spin" />
            <p className="type-mono-look text-gray">Processing...</p>
          </div>
        )}

        {status === 'confirming' && (
          <div className="flex flex-col items-center gap-6">
            <div className="size-16 border border-dark bg-sand flex items-center justify-center">
              <span className="type-display-condensed text-xl text-accent">CLI</span>
            </div>
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                Confirm CLI Access
              </h1>
              <p className="text-sm text-gray">
                The Straude CLI is requesting access to your account.
              </p>
            </div>
            <div className="border border-dark px-4 py-3 font-mono text-lg tracking-wider">
              {code}
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => router.push('/feed')}
                className="flex-1 btn-brutal btn-brutal-secondary justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 btn-brutal btn-brutal-primary justify-center"
              >
                Authorize
              </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="size-16 text-success" />
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                CLI Authorized!
              </h1>
              <p className="text-sm text-gray">
                You can close this window and return to your terminal.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="size-16 text-error" />
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                Verification Failed
              </h1>
              <p className="text-sm text-gray">{displayError}</p>
            </div>
            <button
              onClick={() => router.push('/feed')}
              className="btn-brutal btn-brutal-primary justify-center"
            >
              Go to Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-light p-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-gray">
            <Loader2 className="size-5 animate-spin" />
            <span className="type-mono-look">Loading...</span>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
