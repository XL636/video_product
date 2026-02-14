import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wand2, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toast'
import { useLanguage } from '@/hooks/useLanguage'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const navigate = useNavigate()
  const { language, toggleLanguage, t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/')
    } catch {
      toast({ title: 'Invalid email or password', variant: 'destructive' })
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Language Switcher */}
      <button
        onClick={toggleLanguage}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-slate-800 hover:text-foreground"
        title={language === 'zh-CN' ? 'Switch to English' : '切换到中文'}
      >
        <Globe className="h-4 w-4" />
        <span>{language === 'zh-CN' ? '中文' : 'English'}</span>
      </button>

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-pink-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl anime-gradient">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold anime-gradient-text">
            AnimeGen Studio
          </h1>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle>{t.messages?.welcomeBack || 'Welcome back'}</CardTitle>
            <CardDescription>
              {language === 'zh-CN' ? '登录您的账户以继续' : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.form?.email || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'zh-CN' ? '请输入邮箱' : 'you@example.com'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.form?.password || 'Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'zh-CN' ? '请输入密码' : 'Enter your password'}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="anime"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? (language === 'zh-CN' ? '登录中...' : 'Signing in...')
                  : (language === 'zh-CN' ? '登录' : 'Sign in')
                }
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {language === 'zh-CN' ? '没有账号？' : "Don't have an account? "}{' '}
              <Link
                to="/register"
                className="text-primary hover:underline"
              >
                {language === 'zh-CN' ? '注册' : 'Sign up'}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <Toaster />
    </div>
  )
}
