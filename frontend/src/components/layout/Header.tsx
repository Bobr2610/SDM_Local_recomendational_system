import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { Button } from '../ui'

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">СДМ</span>
            <span className="text-sm text-gray-500 hidden sm:inline">Банк</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Главная</Link>
            <Link to="/products" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Продукты</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Кабинет</Link>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/dashboard" className="text-sm text-gray-700 hover:text-blue-600">
                  {user?.fullName}
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Выйти
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Войти</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Регистрация</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
