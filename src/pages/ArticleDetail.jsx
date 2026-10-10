import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Bookmark, Trash2 } from 'lucide-react'
import { getArticle } from '../services/articles'
import { saveArticle, unsaveArticle, isArticleSaved } from '../services/savedArticles'
import { deleteArticleCompletely } from '../services/articleInteractions'
import { useAuth } from '../context/AuthContext'
import ReactionButtons from '../components/ReactionButtons'
import Comments from '../components/Comments'

function ArticleDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getArticle(id)
        if (cancelled) return
        setArticle(data)

        if (user && data) {
          const isSaved = await isArticleSaved(user.uid, id)
          if (!cancelled) setSaved(isSaved)
        }
      } catch (err) {
        console.error('Could not load article:', err)
        if (!cancelled) setError('Could not load this article.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, user])

  const handleSaveToggle = async () => {
    if (!user || busy) return
    setBusy(true)
    setError('')
    try {
      if (saved) {
        await unsaveArticle(user.uid, id)
        setSaved(false)
      } else {
        await saveArticle(user.uid, id)
        setSaved(true)
      }
    } catch (err) {
      console.error('Could not update saved state:', err)
      setError('Could not update your saved articles.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this article permanently? Its comments and votes will be deleted too.')) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await deleteArticleCompletely(id)
      navigate('/articles')
    } catch (err) {
      console.error('Could not delete article:', err)
      setError('Could not delete the article. Please try again.')
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-12 text-gray-500">Loading article...</div>
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-gray-600 mb-4">This article was not found. It may have been deleted.</p>
        <Link to="/articles" className="text-[#00BFFF] font-semibold">
          Back to articles
        </Link>
      </div>
    )
  }

  const isAuthor = user && user.uid === article.authorId

  const dateText = article.createdAt?.toDate
    ? article.createdAt.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const paragraphs = String(article.content || '')
    .split('\n')
    .filter((p) => p.trim())

  return (
    <div className="bg-[#F5F5F5] min-h-[80vh] px-6 py-10">
      <article className="max-w-3xl mx-auto">
        <Link to="/articles" className="text-[#00BFFF] font-semibold text-sm">
          &larr; Back to articles
        </Link>

        {article.category && (
          <p className="text-sm font-semibold text-[#004D4D] uppercase tracking-wide mt-6">
            {article.category}
          </p>
        )}

        <h1 className="text-4xl font-bold text-[#111111] mt-2">{article.title}</h1>

        <p className="text-gray-500 text-sm mt-3">
          By {article.authorName}
          {dateText && ` · ${dateText}`}
        </p>

        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full rounded-lg mt-6 max-h-96 object-cover"
          />
        )}

        <div className="mt-8 flex flex-col gap-4 text-gray-800 leading-relaxed text-lg">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-md mt-6">{error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-200">
          <ReactionButtons articleId={id} />

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={handleSaveToggle}
                disabled={busy}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors disabled:opacity-60 ${
                  saved
                    ? 'bg-[#00BFFF] text-[#111111] border-transparent'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bookmark size={16} />
                {saved ? 'Saved' : 'Save'}
              </button>
            )}

            {isAuthor && (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
        </div>

        <Comments articleId={id} articleAuthorId={article.authorId} />
      </article>
    </div>
  )
}

export default ArticleDetail