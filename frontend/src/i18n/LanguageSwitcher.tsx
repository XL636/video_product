import React from 'react'

export function I18nLanguageSwitcher() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => alert('切换中文功能开发中...')}
        className="px-2 py-1 rounded-full text-xs transition-colors bg-primary text-white hover:bg-primary/90"
      >
        🇨🇳 / 中文
      </button>
    </div>
  )
}
