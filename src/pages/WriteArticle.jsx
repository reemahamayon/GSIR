import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createArticle } from '../services/articles'

const CATEGORIES = ['Climate', 'Human Rights', 'Economy', 'Conflicts']

function WriteArticle() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [imageUrl, setImageUrl] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePublish = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const docRef = await createArticle({
        title: title.trim(),
        category,
        imageUrl: imageUrl.trim(),
        content: content.trim(),
        author: user,
      })
      navigate(`/articles/${docRef.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const inputClass =
    'border border-gray-300 rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#00BFFF]'

  return (
    <div className="bg-[#F5F5F5] min-h-[80vh] px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-[#111111] mb-6">Write an Article</h1>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</p>
        )}

        <form onSubmit={handlePublish} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="Your article title"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Cover image URL (optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={14}
              className={inputClass}
              placeholder="Write your article here..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-[#004D4D] text-white py-3 rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish Article'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default WriteArticle