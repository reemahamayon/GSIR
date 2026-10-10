import { useEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore'
import { auth } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

const db = getFirestore(auth.app)

const SUGGESTIONS = [
  'Why did World War 1 start?',
  'What does the United Nations Security Council do?',
  'How could a war in Taiwan affect the world economy?',
  'What caused the Cold War?',
]

// Turns **bold** text into real bold
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  )
}

// Turns the AI's plain text into clean paragraphs and lists
function FormattedReply({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let list = null

  const closeList = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  lines.forEach((raw) => {
    const line = raw.trim()
    if (!line || /^-{3,}$/.test(line)) {
      closeList()
      return
    }

    const bullet = line.match(/^[-*•]\s+(.*)/)
    const numbered = line.match(/^\d+[.)]\s+(.*)/)

    if (bullet) {
      if (!list || list.type !== 'ul') {
        closeList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(bullet[1])
    } else if (numbered) {
      if (!list || list.type !== 'ol') {
        closeList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(numbered[1])
    } else {
      closeList()
      blocks.push({ type: 'p', text: line.replace(/^#+\s*/, '') })
    }
  })
  closeList()

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <ul key={i} className="list-disc pl-5 flex flex-col gap-1.5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-decimal pl-5 flex flex-col gap-1.5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          )
        }
        return <p key={i}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}

function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  // Load this user's saved history
  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadHistory() {
      try {
        const q = query(
          collection(db, 'chatHistory', user.uid, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
        const snap = await getDocs(q)
        const items = snap.docs.map((d) => d.data()).reverse()
        if (!cancelled) setMessages(items)
      } catch (err) {
        console.error('Could not load chat history:', err)
        if (!cancelled) setError('Could not load your saved chat history.')
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [user])

  // Always scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const saveMessage = async (role, content) => {
    try {
      await addDoc(collection(db, 'chatHistory', user.uid, 'messages'), {
        role,
        content,
        createdAt: Date.now(),
      })
    } catch (err) {
      console.error('Could not save message:', err)
    }
  }

  const sendMessage = async (text) => {
    const content = text.trim()
    if (!content || loading) return

    setError('')
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setInput('')
    setLoading(true)
    saveMessage('user', content)

    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      saveMessage('assistant', data.reply)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const clearHistory = async () => {
    if (!window.confirm('Delete your whole chat history? This cannot be undone.')) return
    setError('')

    try {
      const snap = await getDocs(collection(db, 'chatHistory', user.uid, 'messages'))
      let batch = writeBatch(db)
      let count = 0

      for (const d of snap.docs) {
        batch.delete(d.ref)
        count++
        if (count === 400) {
          await batch.commit()
          batch = writeBatch(db)
          count = 0
        }
      }
      if (count > 0) await batch.commit()

      setMessages([])
    } catch (err) {
      console.error('Could not clear history:', err)
      setError('Could not clear your chat history.')
    }
  }

  return (
    <div className="bg-[#F5F5F5] min-h-[80vh] px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[#111111]">
              GSIR <span className="text-[#00BFFF]">Analyst</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Ask about world history, wars, conflicts, or how a future event could impact countries.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors shrink-0 mt-2"
            >
              <Trash2 size={16} />
              Clear chat
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-112 overflow-y-auto p-5 flex flex-col gap-4">
            {historyLoading && (
              <p className="text-gray-400 text-sm">Loading your saved chat...</p>
            )}

            {!historyLoading && messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-gray-500 text-sm">Try one of these to get started:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="border border-gray-300 rounded-full px-4 py-2 text-sm text-[#004D4D] hover:bg-gray-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="self-end max-w-[85%] bg-[#004D4D] text-white rounded-xl px-5 py-3">
                  {m.content}
                </div>
              ) : (
                <div
                  key={i}
                  className="self-start max-w-[90%] bg-[#F5F5F5] text-[#111111] rounded-xl px-5 py-4 leading-relaxed"
                >
                  <FormattedReply text={m.content} />
                </div>
              )
            )}

            {loading && (
              <div className="self-start bg-[#F5F5F5] text-gray-500 rounded-xl px-5 py-3 text-sm">
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="bg-red-50 text-red-600 text-sm px-6 py-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-gray-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#00BFFF] text-[#111111] font-semibold px-5 rounded-md flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={18} />
              Send
            </button>
          </form>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          AI can make mistakes, and its knowledge is not live. For recent events, check trusted news sources.
        </p>
      </div>
    </div>
  )
}

export default Chatbot