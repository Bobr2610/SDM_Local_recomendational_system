import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { Button } from '../ui'

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <span className="text-lg sm:text-xl font-bold text-blue-600">СДМ</span>
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Банк</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Главная</Link>
            <Link to="/products" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Продукты</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Кабинет</Link>
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/dashboard" className="text-xs sm:text-sm text-gray-700 hover:text-blue-600 truncate max-w-[100px] sm:max-w-none">
                  {user?.fullName}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>Выйти</Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1">
                <Link to="/login"><Button variant="ghost" size="sm">Войти</Button></Link>
                <Link to="/register"><Button variant="primary" size="sm">Регистрация</Button></Link>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-2">
            <Link to="/" className="block px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>Главная</Link>
            <Link to="/products" className="block px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>Продукты</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded" onClick={() => setMenuOpen(false)}>Кабинет</Link>
                <button className="block w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded" onClick={() => { logout(); setMenuOpen(false) }}>Выйти</button>
              </>
            ) : (
              <div className="flex gap-2 px-2 pt-1">
                <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}><Button variant="outline" size="sm" className="w-full">Войти</Button></Link>
                <Link to="/register" className="flex-1" onClick={() => setMenuOpen(false)}><Button variant="primary" size="sm" className="w-full">Регистрация</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
