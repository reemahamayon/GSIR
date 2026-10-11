import { useEffect, useRef, useState } from 'react'
import { Send, Paperclip, X, CornerUpLeft, Trash2 } from 'lucide-react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { uploadMedia, validateMedia } from '../services/cloudinary'

const MESSAGE_LIMIT = 100

// Never show a full email address to other members
function publicName(user) {
  if (user.displayName) return user.displayName
  return (user.email || 'Member').split('@')[0]
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(date) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
}

function getDate(message) {
  return message?.createdAt?.toDate ? message.createdAt.toDate() : null
}

function replyPreviewText(reply) {
  if (reply.text) return reply.text
  return reply.mediaType === 'video' ? 'Video' : 'Photo'
}

function Forum() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const listRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const nearBottomRef = useRef(true)

  // Live updates: new messages appear without refreshing
  useEffect(() => {
    const q = query(
      collection(db, 'communityMessages'),
      orderBy('createdAt', 'desc'),
      limit(MESSAGE_LIMIT)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
          .reverse()
        setMessages(items)
        setLoadingMessages(false)
      },
      (err) => {
        console.error('Could not load forum messages:', err)
        setError('Could not load the forum.')
        setLoadingMessages(false)
      }
    )

    return unsubscribe
  }, [])

  // Keep the view at the newest message, unless the reader scrolled up
  useEffect(() => {
    const el = listRef.current
    if (el && nearBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Make the message box grow as you type
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [text])

  // Clean up the temporary preview of the chosen file
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0]
    e.target.value = ''
    if (!chosen) return

    const problem = validateMedia(chosen)
    if (problem) {
      setError(problem)
      return
    }

    setError('')
    setFile(chosen)
    setPreviewUrl(URL.createObjectURL(chosen))
  }

  const clearFile = () => {
    setFile(null)
    setPreviewUrl('')
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    const clean = text.trim()
    if ((!clean && !file) || sending) return

    setSending(true)
    setError('')
    setProgress(0)

    try {
      let mediaUrl = null
      let mediaType = null

      if (file) {
        const uploaded = await uploadMedia(file, setProgress)
        mediaUrl = uploaded.url
        mediaType = uploaded.type
      }

      await addDoc(collection(db, 'communityMessages'), {
        text: clean,
        mediaUrl,
        mediaType,
        authorId: user.uid,
        authorName: publicName(user),
        replyTo: replyTo
          ? {
              id: replyTo.id,
              authorName: replyTo.authorName,
              text: (replyTo.text || '').slice(0, 120),
              mediaType: replyTo.mediaType || null,
            }
          : null,
        createdAt: serverTimestamp(),
      })

      nearBottomRef.current = true
      setText('')
      setReplyTo(null)
      clearFile()
    } catch (err) {
      console.error('Could not send message:', err)
      setError(err.message || 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
      setProgress(0)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return
    setError('')
    try {
      await deleteDoc(doc(db, 'communityMessages', messageId))
    } catch (err) {
      console.error('Could not delete message:', err)
      setError('Could not delete the message.')
    }
  }

  const jumpToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="bg-[#F5F5F5] sm:p-4">
      <div className="max-w-3xl mx-auto h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-7rem)] flex flex-col sm:rounded-xl overflow-hidden shadow-md bg-white">
        {/* Header */}
        <div className="bg-[#004D4D] text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-full bg-[#00BFFF] text-[#111111] font-bold flex items-center justify-center">
            G
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">GSIR Forum</p>
            <p className="text-xs text-white/70 truncate">
              Debate world affairs. Please be respectful.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-[#E4ECEE] px-3 sm:px-5 py-3"
        >
          {loadingMessages && <p className="text-gray-500 text-sm">Loading messages...</p>}

          {!loadingMessages && messages.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-6">
              No messages yet. Start the conversation!
            </p>
          )}

          {messages.map((m, i) => {
            const mine = m.authorId === user.uid
            const date = getDate(m)
            const prev = messages[i - 1]
            const prevDate = getDate(prev)

            const showDay = date && (!prevDate || prevDate.toDateString() !== date.toDateString())
            const sameAuthorAsPrev = prev && prev.authorId === m.authorId && !showDay
            const showName = !mine && !sameAuthorAsPrev

            return (
              <div key={m.id} className="flex flex-col">
                {showDay && (
                  <div className="self-center my-3 text-xs bg-white/80 text-gray-600 rounded-full px-3 py-1 shadow-sm">
                    {dayLabel(date)}
                  </div>
                )}

                <div
                  id={`msg-${m.id}`}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'} ${
                    sameAuthorAsPrev ? 'mt-0.5' : 'mt-2'
                  }`}
                >
                  <div
                    className={`group w-fit max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 pt-2 pb-1.5 shadow-sm ${
                      mine
                        ? 'bg-[#D6F1FF] text-[#111111] rounded-tr-md'
                        : 'bg-white text-[#111111] rounded-tl-md'
                    }`}
                  >
                    {showName && (
                      <p className="text-xs font-semibold text-[#004D4D] mb-0.5">{m.authorName}</p>
                    )}

                    {m.replyTo && (
                      <button
                        onClick={() => jumpToMessage(m.replyTo.id)}
                        className="block w-full text-left text-xs rounded-md px-2.5 py-1.5 mb-1.5 border-l-4 border-[#00BFFF] bg-black/5"
                      >
                        <span className="font-semibold block text-[#004D4D]">
                          {m.replyTo.authorName}
                        </span>
                        <span className="line-clamp-2 wrap-break-word text-gray-600">
                          {replyPreviewText(m.replyTo)}
                        </span>
                      </button>
                    )}

                    {m.mediaUrl && m.mediaType === 'image' && (
                      <a href={m.mediaUrl} target="_blank" rel="noreferrer">
                        <img
                          src={m.mediaUrl}
                          alt="Shared in forum"
                          loading="lazy"
                          className="rounded-lg max-h-72 w-auto mb-1"
                        />
                      </a>
                    )}

                    {m.mediaUrl && m.mediaType === 'video' && (
                      <video
                        src={m.mediaUrl}
                        controls
                        preload="metadata"
                        playsInline
                        className="rounded-lg max-h-72 w-full mb-1"
                      />
                    )}

                    {m.text && (
                      <p className="whitespace-pre-wrap wrap-break-word text-[15px] leading-snug">
                        {m.text}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setReplyTo(m)}
                          className="text-gray-500 hover:text-[#004D4D]"
                          aria-label="Reply"
                        >
                          <CornerUpLeft size={14} />
                        </button>

                        {mine && (
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="text-gray-500 hover:text-red-600"
                            aria-label="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {date && <span className="text-[11px] text-gray-500">{formatTime(date)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm px-4 py-2 shrink-0">{error}</p>
        )}

        {/* Replying to */}
        {replyTo && (
          <div className="flex items-start justify-between gap-3 bg-[#F0F2F5] border-t border-gray-200 px-4 py-2 shrink-0">
            <div className="text-sm border-l-4 border-[#00BFFF] pl-3 min-w-0">
              <p className="font-semibold text-[#004D4D]">Replying to {replyTo.authorName}</p>
              <p className="text-gray-600 truncate">{replyPreviewText(replyTo)}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Cancel reply"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Chosen attachment */}
        {file && (
          <div className="flex items-center justify-between gap-3 bg-[#F0F2F5] border-t border-gray-200 px-4 py-2 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {file.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Selected" className="h-14 w-14 object-cover rounded-md" />
              ) : (
                <video src={previewUrl} className="h-14 w-14 object-cover rounded-md" muted />
              )}
              <p className="text-sm text-gray-600 truncate">{file.name}</p>
            </div>
            <button
              onClick={clearFile}
              disabled={sending}
              className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
              aria-label="Remove attachment"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Upload progress */}
        {sending && file && (
          <div className="h-1 bg-gray-200 shrink-0">
            <div className="h-1 bg-[#00BFFF] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Message box */}
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-[#F0F2F5] px-2 py-2 shrink-0"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="h-11 w-11 shrink-0 flex items-center justify-center text-gray-500 hover:text-[#004D4D] transition-colors disabled:opacity-50"
            aria-label="Attach image or video"
          >
            <Paperclip size={22} />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Type a message"
            className="flex-1 bg-white rounded-2xl px-4 py-2.5 resize-none focus:outline-none"
          />

          <button
            type="submit"
            disabled={sending || (!text.trim() && !file)}
            className="h-11 w-11 shrink-0 rounded-full bg-[#00BFFF] text-[#111111] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default Forum