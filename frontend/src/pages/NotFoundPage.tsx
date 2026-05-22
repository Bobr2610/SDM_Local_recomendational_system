import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-lg text-gray-500 mb-6">Страница не найдена</p>
      <Link to="/">
        <Button variant="primary">На главную</Button>
      </Link>
    </div>
  )
}
