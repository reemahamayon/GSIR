import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { getReactions, setReaction } from '../services/articleInteractions'
import { useAuth } from '../context/AuthContext'

function ReactionButtons({ articleId }) {
  const { user } = useAuth()
  const [counts, setCounts] = useState({ likes: 0, dislikes: 0, myReaction: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getReactions(articleId, user?.uid)
        if (!cancelled) setCounts(data)
      } catch (err) {
        console.error('Could not load reactions:', err)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [articleId, user])

  const handleClick = async (type) => {
    if (!user || busy) return
    setBusy(true)
    setError('')

    try {
      await setReaction(articleId, user.uid, type, counts.myReaction)
      const data = await getReactions(articleId, user.uid)
      setCounts(data)
    } catch (err) {
      console.error('Could not save reaction:', err)
      setError('Could not save your vote. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const buttonClass = (active, activeColor) =>
    `flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors disabled:opacity-60 ${
      active
        ? `${activeColor} text-white border-transparent`
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleClick('like')}
          disabled={!user || busy}
          className={buttonClass(counts.myReaction === 'like', 'bg-[#004D4D]')}
        >
          <ThumbsUp size={16} />
          {counts.likes}
        </button>

        <button
          onClick={() => handleClick('dislike')}
          disabled={!user || busy}
          className={buttonClass(counts.myReaction === 'dislike', 'bg-gray-700')}
        >
          <ThumbsDown size={16} />
          {counts.dislikes}
        </button>

        {!user && (
          <span className="text-sm text-gray-500">
            <Link to="/login" className="text-[#00BFFF] font-semibold">
              Log in
            </Link>{' '}
            to vote
          </span>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}

export default ReactionButtons