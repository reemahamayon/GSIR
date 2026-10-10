import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { getComments, addComment, deleteComment } from '../services/articleInteractions'
import { useAuth } from '../context/AuthContext'

function formatCommentDate(timestamp) {
  if (!timestamp?.toDate) return 'Just now'
  return timestamp.toDate().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function Comments({ articleId, articleAuthorId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const loadComments = async () => {
    try {
      const data = await getComments(articleId)
      setComments(data)
    } catch (err) {
      console.error('Could not load comments:', err)
      setError('Could not load comments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean || posting) return

    setPosting(true)
    setError('')
    try {
      await addComment(articleId, user, clean)
      setText('')
      await loadComments()
    } catch (err) {
      console.error('Could not post comment:', err)
      setError('Could not post your comment. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    setError('')
    try {
      await deleteComment(articleId, commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      console.error('Could not delete comment:', err)
      setError('Could not delete the comment.')
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-[#111111] mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Share your thoughts or views..."
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{text.length}/1000</span>
            <button
              type="submit"
              disabled={posting || !text.trim()}
              className="bg-[#004D4D] text-white px-5 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="bg-white border border-gray-200 rounded-md p-4 text-gray-600 mb-8">
          <Link to="/login" className="text-[#00BFFF] font-semibold">
            Log in
          </Link>{' '}
          to join the discussion.
        </p>
      )}

      {error && (
        <p className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</p>
      )}

      {loading && <p className="text-gray-400 text-sm">Loading comments...</p>}

      {!loading && comments.length === 0 && (
        <p className="text-gray-500">No comments yet. Be the first to share your view.</p>
      )}

      <div className="flex flex-col gap-4">
        {comments.map((c) => {
          const canDelete = user && (user.uid === c.authorId || user.uid === articleAuthorId)

          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#111111] text-sm">{c.authorName}</p>
                  <p className="text-xs text-gray-400">{formatCommentDate(c.createdAt)}</p>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-gray-700 mt-3 whitespace-pre-wrap wrap-break-word">{c.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Comments