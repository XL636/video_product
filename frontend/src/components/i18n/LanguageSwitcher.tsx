import React from 'react'
import { useLanguage, Language } from './useLanguage'
import { Languages } from './Languages'

export function I18nLanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const t = Languages[language]

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {['en', 'zh-CN'].map((lang) => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          className={`px-2 py-1 rounded-full text-xs transition-colors ${
            language === lang
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-secondary text-foreground hover:bg-secondary'
          }`}
          style={{ minWidth: '60px' }}
        >
          {lang === 'en' ? 'EN' : '中文'}
        </button>
      ))}
    </div>
  )
}
