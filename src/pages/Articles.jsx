import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getArticles } from '../services/articles'
import { formatDate } from '../utils/formatDate'

function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-[#F5F5F5] min-h-[80vh] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#111111] mb-8">Articles</h1>

        {loading && <p className="text-gray-500">Loading articles...</p>}

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</p>
        )}

        {!loading && !error && articles.length === 0 && (
          <p className="text-gray-500">No articles yet. Be the first to write one!</p>
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

export default Articles