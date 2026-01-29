'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { countries, getCountryByCode } from '@/lib/data/countries';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  useUser(); // Check user is authenticated
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    link: '',
    country: '',
    is_public: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            display_name: data.display_name || '',
            bio: data.bio || '',
            link: data.link || '',
            country: data.country,
            is_public: data.is_public,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const country = getCountryByCode(formData.country);
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          link: formData.link || null,
          country: formData.country,
          region: country?.region,
          is_public: formData.is_public,
        }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-dark mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <Avatar
            src={user?.avatar_url}
            alt={user?.username || ''}
            size="lg"
          />
          <div>
            <p className="font-heading font-semibold text-dark">@{user?.username}</p>
            <p className="text-sm text-gray">
              Avatar is managed through Clerk. Update in account settings.
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
            placeholder="Your name"
            className="w-full px-4 py-3 border border-gray rounded-lg font-body text-dark placeholder:text-gray/50 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            maxLength={160}
            rows={3}
            className="w-full px-4 py-3 border border-gray rounded-lg font-body text-dark placeholder:text-gray/50 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all resize-none"
          />
          <p className="text-right text-xs text-gray mt-1">
            {formData.bio.length}/160
          </p>
        </div>

        {/* Link */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
            placeholder="https://your-website.com"
            className="w-full px-4 py-3 border border-gray rounded-lg font-body text-dark placeholder:text-gray/50 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark mb-2">
            Country
          </label>
          <select
            value={formData.country}
            onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
            className="w-full px-4 py-3 border border-gray rounded-lg font-body text-dark focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark mb-2">
            Profile Visibility
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={formData.is_public}
                onChange={() => setFormData((prev) => ({ ...prev, is_public: true }))}
                className="size-4 text-accent"
              />
              <div>
                <span className="font-heading font-medium text-dark">Public</span>
                <p className="text-sm text-gray">Visible on leaderboards</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={!formData.is_public}
                onChange={() => setFormData((prev) => ({ ...prev, is_public: false }))}
                className="size-4 text-accent"
              />
              <div>
                <span className="font-heading font-medium text-dark">Private</span>
                <p className="text-sm text-gray">Hidden from leaderboards</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
