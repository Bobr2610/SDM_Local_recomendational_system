export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">С</div>
          <div>
            <div className="text-base font-bold text-gray-900">СДМ Хакатон</div>
            <div className="text-xs text-gray-500">Система рекомендаций банковских продуктов</div>
          </div>
        </div>
      </div>
    </header>
  )
}
