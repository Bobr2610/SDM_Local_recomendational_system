import { Card, CardBody, CardHeader } from '../components/ui'
import { LoginForm } from '../components/features/auth'
import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 text-center">Вход в систему</h2>
        </CardHeader>
        <CardBody>
          <LoginForm />
          <p className="text-sm text-gray-500 text-center mt-4">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700">
              Зарегистрироваться
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
