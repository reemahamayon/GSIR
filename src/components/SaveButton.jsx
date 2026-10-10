import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  saveArticle,
  unsaveArticle,
  isArticleSaved,
} from '../services/savedArticles'

function SaveButton({ articleId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) {
      setSaved(false)
      return
    }
    isArticleSaved(user.uid, articleId)
      .then(setSaved)
      .catch(() => setSaved(false))
  }, [user, articleId])

  const handleClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      if (saved) {
        await unsaveArticle(user.uid, articleId)
        setSaved(false)
      } else {
        await saveArticle(user.uid, articleId)
        setSaved(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition-colors disabled:opacity-50 ${
        saved
          ? 'bg-[#00BFFF] text-black border-[#00BFFF]'
          : 'bg-white text-[#004D4D] border-[#004D4D] hover:bg-[#004D4D] hover:text-white'
      }`}
    >
      <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

export default SaveButton