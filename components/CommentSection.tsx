'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import axios from 'axios'

type SendComment = {
  body: string
  userName: string | null
}

type FetchComments = {
	id: string
  body: string
  userName: string | null
	createdAt: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<FetchComments[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const formRef = useRef<HTMLFormElement>(null)

  // ✅ Fetch comments
	const fetchComments = async () => {
    try {
      const { data } = await api.get(`/api/comments/${slug}`)
      setComments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [slug])

  // ✅ Submit comment
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPosting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const body = formData.get('content') as string
    const userName = (formData.get('author') as string) || 'Anonymous'

    try {
      await api.post('/api/comments', {
        body,
        userName,
        postSlug: slug,
      })

			const newComment: FetchComments = {
				id: crypto.randomUUID(),
				body,
				userName,
				createdAt: new Date().toISOString(),
			}

			setComments(prev => [newComment, ...prev])

      setMessage('Comment posted successfully!')
      formRef.current?.reset()
    } catch (err) {
      setMessage('Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="mt-16 border-t border-white/10 pt-16">
      <h2 className="text-2xl font-bold text-white mb-8">Comments</h2>

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mb-12 space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="author" className="text-sm font-medium text-slate-300">
            Name <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="text"
            name="author"
            id="author"
            className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white"
            placeholder="John Doe"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="content" className="text-sm font-medium text-slate-300">
            Comment
          </label>
          <textarea
            name="content"
            id="content"
            required
            rows={4}
            className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white resize-none"
            placeholder="What are your thoughts?"
          />
        </div>

        <div className="flex items-center justify-between">
          {message ? (
            <p className="text-sm text-green-400">{message}</p>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={posting}
            className="bg-white text-black font-bold py-2.5 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {posting && <Loader2 className="animate-spin w-4 h-4" />}
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-500 w-8 h-8" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <p className="text-slate-500 italic">
            No comments yet. Be the first to share!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {comments.map((comment, id) => (
            <div key={id} className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {(comment.userName || 'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-white text-lg">
                    {comment.userName || 'Anonymous'}
                  </span>
                  <time className="text-xs text-slate-500 font-medium">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <p className="text-slate-300">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
