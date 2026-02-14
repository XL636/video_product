import { useState } from 'react'
import { en } from '@/i18n/en'
import { zhCN } from '@/i18n/zh-CN'

export type Language = 'en-US' | 'zh-CN'

export type Translations = typeof en

export const languages: Record<Language, Translations> = {
  'en-US': en,
  'zh-CN': zhCN,
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved === 'en-US' || saved === 'zh-CN') {
      return saved
    }
    return 'zh-CN' // 默认中文
  })

  const toggleLanguage = () => {
    const newLang: Language = language === 'en-US' ? 'zh-CN' : 'en-US'
    setLanguage(newLang)
    localStorage.setItem('language', newLang)
    window.location.reload() // 重新加载页面应用语言
  }

  const t = languages[language]

  return { language, setLanguage, toggleLanguage, t }
}
