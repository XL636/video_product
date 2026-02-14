import { useLanguage, Language } from '@/hooks/useLanguage'
import { motion } from 'framer-motion'

export const languages = {
  'en-US': {
    appName: 'AnimeGen Studio',
    appTitle: 'AnimeGen Studio',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    download: 'Download',
    upload: 'Upload',
    settings: 'Settings',
    logout: 'Logout',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    error: 'Error',
    success: 'Success',
  },
  'zh-CN': {
    appName: '动漫视频生成器',
    appTitle: '动漫视频生成器',
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    search: '搜索',
    filter: '筛选',
    download: '下载',
    upload: '上传',
    settings: '设置',
    logout: '退出登录',
    back: '返回',
    next: '下一步',
    done: '完成',
    error: '错误',
    success: '成功',
  },
}

export function useLanguage() {
  const [language, setLanguage] = useLanguage()

  // 验证语言是否在支持列表中
  if (!languages[language]) {
    console.error(`Language '${language}' is not supported. Defaulting to 'en-US'.`)
    return languages['en-US']
  }

  return [language, setLanguage]
}

export default Language
