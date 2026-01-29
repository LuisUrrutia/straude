'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from '@/lib/utils/date';
import { Send, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursorState, setCursorState] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Initial load on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchInitialComments() {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const data = await res.json();
        if (!cancelled) {
          setComments(data.comments);
          setCursorState(data.next_cursor);
          setHasMore(!!data.next_cursor);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchInitialComments();
    return () => { cancelled = true; };
  }, [postId]);

  const loadMoreComments = useCallback(async () => {
    if (!cursorState) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('cursor', cursorState);

      const res = await fetch(`/api/posts/${postId}/comments?${params}`);
      const data = await res.json();

      setComments((prev) => [...prev, ...data.comments]);
      setCursorState(data.next_cursor);
      setHasMore(!!data.next_cursor);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
    setIsLoading(false);
  }, [postId, cursorState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="space-y-4" id="comments">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          maxLength={500}
          className="flex-1 px-4 py-2 border border-gray rounded-lg font-body text-dark placeholder:text-gray/50 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 bg-accent text-light rounded-lg hover:bg-coral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </button>
      </form>

      {/* Comments list */}
      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 text-accent animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray py-6 font-body">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Link href={`/u/${comment.user.username}`}>
                <Avatar
                  src={comment.user.avatar_url}
                  alt={comment.user.username}
                  size="sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/u/${comment.user.username}`}
                    className="font-heading font-semibold text-sm text-dark hover:text-accent"
                  >
                    {comment.user.display_name || comment.user.username}
                  </Link>
                  <span className="text-xs text-gray">
                    {formatDistanceToNow(comment.created_at)}
                  </span>
                  {currentUserId === comment.user.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray hover:text-error transition-all ml-auto"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <p className="font-body text-dark text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => loadMoreComments()}
              className="w-full py-2 text-sm text-accent hover:text-coral-dark transition-colors"
            >
              Load more comments
            </button>
          )}
        </div>
      )}
    </div>
  );
}
