export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 sm:mb-3">СДМ Банк</h4>
            <p className="text-xs sm:text-sm text-gray-500">Цифровой банк для частных лиц и бизнеса</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Продукты</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
              <li>Вклады и сбережения</li>
              <li>Кредиты</li>
              <li>Дебетовые карты</li>
              <li>РКО для бизнеса</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Контакты</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-500">
              <li>8 (800) 123-45-67</li>
              <li>support@sdm-bank.ru</li>
              <li>г. Москва, ул. Банковская, 1</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-400">
          © 2026 СДМ Банк. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
