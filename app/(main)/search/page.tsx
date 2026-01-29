'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { formatCompactNumber } from '@/lib/utils/format';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.users || []);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
      // Update URL
      if (query) {
        router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
      } else {
        router.replace('/search', { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search, router]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-dark mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          autoFocus
          className="w-full pl-12 pr-4 py-3 border border-gray rounded-lg font-body text-dark placeholder:text-gray/50 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 text-accent animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/u/${user.username}`}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-sand transition-colors"
            >
              <Avatar
                src={user.avatar_url}
                alt={user.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-dark">
                  {user.display_name || user.username}
                </div>
                <div className="text-sm text-gray">@{user.username}</div>
                {user.bio && (
                  <div className="text-sm text-gray truncate mt-1">{user.bio}</div>
                )}
              </div>
              <div className="text-sm text-gray">
                {formatCompactNumber(user.followers_count)} followers
              </div>
            </Link>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-8 text-gray font-body">
          No users found for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="text-center py-8 text-gray font-body">
          Start typing to search for users
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto">
          <h1 className="font-heading text-2xl font-bold text-dark mb-6">Search</h1>
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 text-accent animate-spin" />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
