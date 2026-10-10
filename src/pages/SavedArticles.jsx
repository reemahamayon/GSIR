import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSavedArticles } from '../services/savedArticles'
import { formatDate } from '../utils/formatDate'

function SavedArticles() {
  const { user } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    getSavedArticles(user.uid)
      .then(setArticles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="bg-[#F5F5F5] min-h-[80vh] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#111111] mb-8">Saved Articles</h1>

        {loading && <p className="text-gray-500">Loading your saved articles...</p>}

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</p>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-gray-500">
            <p className="mb-3">You haven't saved any articles yet.</p>
            <Link to="/articles" className="text-[#00BFFF] font-semibold">
              Browse articles
            </Link>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="h-44 w-full bg-linear-to-br from-[#004D4D] to-[#00BFFF]" />
              )}
              <div className="p-5 flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#00BFFF] uppercase tracking-wide">
                  {article.category}
                </span>
                <h2 className="text-lg font-bold text-[#111111]">{article.title}</h2>
                <p className="text-sm text-gray-500 mt-auto">
                  {article.authorName} · {formatDate(article.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SavedArticles