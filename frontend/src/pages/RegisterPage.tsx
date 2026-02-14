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

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const register = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)
  const navigate = useNavigate()
  const { language, toggleLanguage, t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: language === 'zh-CN' ? '两次密码不一致' : 'Passwords do not match', variant: 'destructive' })
      return
    }

    if (password.length < 6) {
      toast({
        title: language === 'zh-CN' ? '密码至少需要6个字符' : 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    try {
      await register(email, username, password)
      navigate('/')
    } catch {
      toast({
        title: language === 'zh-CN' ? '注册失败，请重试' : 'Registration failed. Please try again.',
        variant: 'destructive',
      })
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
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-pink-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[120px]" />
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
            <CardTitle>{language === 'zh-CN' ? '创建账号' : 'Create an account'}</CardTitle>
            <CardDescription>
              {language === 'zh-CN' ? '今天就开始生成动漫视频' : 'Start generating anime videos today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t.form?.username || 'Username'}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={language === 'zh-CN' ? '选择用户名' : 'Choose a username'}
                  required
                />
              </div>
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
                  placeholder={language === 'zh-CN' ? '至少6个字符' : 'At least 6 characters'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t.form?.confirmPassword || 'Confirm Password'}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'zh-CN' ? '再次输入密码' : 'Repeat your password'}
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
                  ? (language === 'zh-CN' ? '创建中...' : 'Creating account...')
                  : (language === 'zh-CN' ? '创建账号' : 'Create account')
                }
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {language === 'zh-CN' ? '已有账号？' : 'Already have an account? '}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {language === 'zh-CN' ? '登录' : 'Sign in'}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <Toaster />
    </div>
  )
}
