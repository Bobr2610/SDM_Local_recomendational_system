import { colors } from '../../config/theme'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex items-center h-16 gap-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: colors.primary.DEFAULT }}
          >
            С
          </div>
          <div>
            <div className="text-base font-bold" style={{ color: colors.text.primary }}>СДМ Хакатон</div>
            <div className="text-xs" style={{ color: colors.text.secondary }}>Система рекомендаций банковских продуктов</div>
          </div>
        </div>
      </div>
    </header>
  )
}
