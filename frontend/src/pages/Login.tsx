import { useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"

import { AuthShell } from "@/components/AuthShell"
import { PasswordInput } from "@/components/PasswordInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatRetryWait, useRetryLock } from "@/hooks/useRetryLock"
import { login, retrySecondsFromError, setToken } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const { remaining, locked, lock } = useRetryLock("mt_login_lock_until")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (locked) {
      return
    }
    if (!username.trim() || !password) {
      setError("请输入用户名和密码")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const token = await login(username.trim(), password)
      setToken(token.access_token)
      await signIn(token.username)
    } catch (err) {
      const wait = retrySecondsFromError(err)
      if (wait) {
        lock(wait)
      }
      setError(err instanceof Error ? err.message : "登录失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="登录" description="使用已注册账号进入训练控制台">
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            disabled={locked}
            onChange={(e) => {
              setUsername(e.target.value)
              if (!locked) {
                setError(null)
              }
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">密码</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            disabled={locked}
            onChange={(e) => {
              setPassword(e.target.value)
              if (!locked) {
                setError(null)
              }
            }}
          />
        </div>
        {locked ? (
          <p className="text-sm text-destructive">尝试过于频繁，请 {formatRetryWait(remaining)} 后再试</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        <Button type="submit" disabled={submitting || locked}>
          {submitting ? "登录中…" : locked ? `请稍候 ${formatRetryWait(remaining)}` : "登录"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link className="font-medium text-foreground underline underline-offset-4" to="/register">
            注册
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
