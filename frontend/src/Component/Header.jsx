import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'

export default function Header() {
  const [q, setQ] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="header flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
      {/* Search */}
      <form onSubmit={onSubmit} className="search flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search videos"
          className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Create Button */}
      <NavLink
        to="/Addnew"
        className="px-4 py-2 rounded-lg bg-white/10 text-white/80 border border-white/30 hover:bg-white/20"
      >
        Create
      </NavLink>

      {/* Profile */}
      <div className="relative">
        <div
          className="avatar w-10 h-10 rounded-full bg-gray-700 cursor-pointer"
          title="Profile"
          onClick={() => setShowMenu((prev) => !prev)}
        />
        {showMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
            <button
              onClick={() => navigate('/signup')}
              className="w-full text-left px-4 py-2 hover:bg-gray-700"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full text-left px-4 py-2 hover:bg-gray-700"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
