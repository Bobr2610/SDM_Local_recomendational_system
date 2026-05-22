import { Card, CardBody, CardHeader } from '../components/ui'
import { RegisterForm } from '../components/features/auth'
import { Link } from 'react-router-dom'

export function RegisterPage() {
  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 text-center">Регистрация</h2>
        </CardHeader>
        <CardBody>
          <RegisterForm />
          <p className="text-sm text-gray-500 text-center mt-4">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700">
              Войти
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
