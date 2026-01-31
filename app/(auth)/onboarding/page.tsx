'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { countries, regionNames, type Country } from '@/lib/data/countries';
import type { Region } from '@/types/database';

type Step = 'username' | 'country' | 'visibility' | 'optional';

interface FormData {
  username: string;
  country: string;
  region: Region;
  isPublic: boolean;
  bio: string;
  link: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  useUser(); // Check user is authenticated
  const [step, setStep] = useState<Step>('username');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    country: '',
    region: 'north_america',
    isPublic: true,
    bio: '',
    link: '',
  });
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Auto-detect timezone
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Check username availability - using useCallback pattern for async validation
  useEffect(() => {
    // Clear error when username is empty
    if (!formData.username) {
      setUsernameError('');
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setUsernameError('Use 3-20 lowercase letters, numbers, or underscores');
      return;
    }

    setUsernameError('');

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${formData.username}`);
        const data = await res.json();
        if (!data.available) {
          setUsernameError('Username is taken');
        } else {
          setUsernameError('');
        }
      } catch {
        setUsernameError('Error checking username');
      }
      setIsCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleCountrySelect = (country: Country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.code,
      region: country.region,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.toLowerCase(),
          country: formData.country,
          region: formData.region,
          is_public: formData.isPublic,
          bio: formData.bio || null,
          link: formData.link || null,
          timezone,
        }),
      });

      if (res.ok) {
        // Set cookie for middleware check
        document.cookie = 'onboarding_completed=true; path=/; max-age=31536000';
        router.push('/feed');
      } else {
        const error = await res.json();
        console.error('Onboarding error:', error);
      }
    } catch (err) {
      console.error('Onboarding error:', err);
    }
    setIsSubmitting(false);
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const groupedCountries = filteredCountries.reduce(
    (acc, country) => {
      if (!acc[country.region]) {
        acc[country.region] = [];
      }
      acc[country.region].push(country);
      return acc;
    },
    {} as Record<Region, Country[]>
  );

  const canProceed = () => {
    switch (step) {
      case 'username':
        return formData.username && !usernameError && !isCheckingUsername;
      case 'country':
        return formData.country;
      case 'visibility':
        return true;
      case 'optional':
        return true;
    }
  };

  const nextStep = () => {
    switch (step) {
      case 'username':
        setStep('country');
        break;
      case 'country':
        setStep('visibility');
        break;
      case 'visibility':
        setStep('optional');
        break;
      case 'optional':
        handleSubmit();
        break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case 'country':
        setStep('username');
        break;
      case 'visibility':
        setStep('country');
        break;
      case 'optional':
        setStep('visibility');
        break;
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-light p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {(['username', 'country', 'visibility', 'optional'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 mx-1 rounded-none transition-colors ${
                  i <= ['username', 'country', 'visibility', 'optional'].indexOf(step)
                    ? 'bg-accent'
                    : 'bg-sand'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="panel-brutal p-6">
          {step === 'username' && (
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                Choose your username
              </h1>
              <p className="text-sm text-gray mb-6">
                This is how others will find you on Straude.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="username"
                  className="input-brutal"
                  style={{ paddingLeft: '2rem', paddingRight: '1rem' }}
                  autoFocus
                />
              </div>
              {usernameError && (
                <p className="mt-2 text-sm text-error">{usernameError}</p>
              )}
              {isCheckingUsername && (
                <p className="mt-2 text-sm text-gray">Checking availability...</p>
              )}
              {formData.username && !usernameError && !isCheckingUsername && (
                <p className="mt-2 text-sm text-success">Username is available!</p>
              )}
            </div>
          )}

          {step === 'country' && (
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                Where are you from?
              </h1>
              <p className="text-sm text-gray mb-6">
                This determines your regional leaderboard.
              </p>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                className="input-brutal mb-4"
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto space-y-4">
                {Object.entries(groupedCountries).map(([region, countries]) => (
                  <div key={region}>
                    <h3 className="type-mono-look text-gray mb-2">
                      {regionNames[region as Region]}
                    </h3>
                    <div className="space-y-1">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => handleCountrySelect(country)}
                          className={`w-full flex items-center gap-3 px-3 py-2 border border-dark text-left transition-colors ${
                            formData.country === country.code
                              ? 'bg-accent text-light'
                              : 'hover:bg-sand'
                          }`}
                        >
                          <span className="text-xl">{country.flag}</span>
                          <span>{country.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'visibility' && (
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                Profile visibility
              </h1>
              <p className="text-sm text-gray mb-6">
                Choose who can see your activity.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, isPublic: true }))}
                  className={`w-full flex items-start gap-4 p-4 border transition-colors text-left ${
                    formData.isPublic
                      ? 'border-dark bg-accent/10'
                      : 'border-dark hover:bg-sand'
                  }`}
                >
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      formData.isPublic ? 'border-dark' : 'border-dark'
                    }`}
                  >
                    {formData.isPublic && (
                      <div className="w-3 h-3 bg-accent" />
                    )}
                  </div>
                  <div>
                    <h3 className="type-display-condensed text-sm text-dark">Public</h3>
                    <p className="text-sm text-gray">
                      Your profile and posts are visible to everyone. You appear on leaderboards.
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, isPublic: false }))}
                  className={`w-full flex items-start gap-4 p-4 border transition-colors text-left ${
                    !formData.isPublic
                      ? 'border-dark bg-accent/10'
                      : 'border-dark hover:bg-sand'
                  }`}
                >
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      !formData.isPublic ? 'border-dark' : 'border-dark'
                    }`}
                  >
                    {!formData.isPublic && (
                      <div className="w-3 h-3 bg-accent" />
                    )}
                  </div>
                  <div>
                    <h3 className="type-display-condensed text-sm text-dark">Private</h3>
                    <p className="text-sm text-gray">
                      Only your followers can see your posts. You don&apos;t appear on leaderboards.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'optional' && (
            <div>
              <h1 className="type-display-condensed text-2xl text-dark mb-2">
                Almost done!
              </h1>
              <p className="text-sm text-gray mb-6">
                Add a bio and link (optional).
              </p>
              <div className="space-y-4">
                <div>
                  <label className="type-mono-look text-gray mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    maxLength={160}
                    rows={3}
                    className="input-brutal resize-none"
                  />
                  <p className="text-right text-xs text-gray mt-1">
                    {formData.bio.length}/160
                  </p>
                </div>
                <div>
                  <label className="type-mono-look text-gray mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                    placeholder="https://your-website.com"
                    className="input-brutal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step !== 'username' && (
              <button
                onClick={prevStep}
                className="flex-1 btn-brutal btn-brutal-secondary justify-center"
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 btn-brutal btn-brutal-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : step === 'optional' ? 'Complete' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
