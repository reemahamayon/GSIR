import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../services/firebase'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14-5.2l-6.5-5.4C29.4 35.1 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.4C40.2 36.5 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogleLogin = async () => {
    if (googleLoading) return
    setError('')
    setMessage('')
    setGoogleLoading(true)

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      const result = await signInWithPopup(auth, provider)
      console.log('Google login OK:', result.user.email)
      navigate('/')
    } catch (err) {
      console.error('Google login error:', err.code, err.message)

      if (err.code === 'auth/popup-closed-by-user') {
        setError('The Google window closed before sign-in finished. Try again and pick your account in the popup. If it closes by itself, try another browser (see console for details).')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Your browser blocked the popup. Allow popups for this site and try again.')
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Another popup request was in progress. Click once and wait.')
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled in Firebase.')
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network problem. Check your internet or VPN and try again.')
      } else {
        setError(`${err.code}: ${err.message}`)
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Please type your email in the Email field first, then click "Forgot password?".')
      return
    }

    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage('Password reset email sent! Check your inbox (and spam folder) and follow the link to set a new password.')
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError('That email address is not valid.')
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with that email.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.')
      } else {
        setError(err.message)
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F5F5] px-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#111111] mb-6 text-center">Login to GSIR</h2>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</p>
        )}

        {message && (
          <p className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">{message}</p>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full border border-gray-300 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? 'Opening Google...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
          />

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm text-[#00BFFF] font-semibold hover:underline disabled:opacity-50"
            >
              {resetLoading ? 'Sending...' : 'Forgot password?'}
            </button>
          </div>

          <button
            type="submit"
            className="bg-[#004D4D] text-white py-2 rounded-md font-semibold hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#00BFFF] font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login