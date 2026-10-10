import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const linkClass =
    'text-white/90 hover:text-[#00BFFF] transition-colors text-sm font-medium'

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-4 bg-[#004D4D] shadow-md sticky top-0 z-50">
      <Link to="/" className="text-white font-bold text-xl tracking-wide">
        GSIR
      </Link>

      <div className="flex flex-wrap gap-5 items-center">
        <Link to="/" className={linkClass}>Home</Link>
        <Link to="/articles" className={linkClass}>Articles</Link>

        {user ? (
          <>
            <Link to="/chatbot" className={linkClass}>Ask AI</Link>
            <Link to="/write" className={linkClass}>Write</Link>
            <Link to="/saved" className={linkClass}>Saved</Link>
            <span className="text-white/60 text-sm hidden md:inline">
              {user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-[#00BFFF] text-black px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={linkClass}>Login</Link>
            <Link
              to="/signup"
              className="bg-[#00BFFF] text-black px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar