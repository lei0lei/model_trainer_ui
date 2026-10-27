import { useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"

import { AuthShell } from "@/components/AuthShell"
import { PasswordInput } from "@/components/PasswordInput"
import { PasswordStrength } from "@/components/PasswordStrength"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatRetryWait, useRetryLock } from "@/hooks/useRetryLock"
import { register, retrySecondsFromError, setToken } from "@/lib/api"
import {
  validateConfirmPassword,
  validatePassword,
  validateUsername,
} from "@/lib/auth-validation"
import { useAuth } from "@/lib/auth"

export function RegisterPage() {
  const { user, loading, signIn } = useAuth()
  const { remaining, locked, lock } = useRetryLock("mt_register_lock_until")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  function runClientValidation(): boolean {
    const nextUsername = validateUsername(username)
    const nextPassword = validatePassword(password)
    const nextConfirm = validateConfirmPassword(password, confirm)
    setUsernameError(nextUsername)
    setPasswordError(nextPassword)
    setConfirmError(nextConfirm)
    return !nextUsername && !nextPassword && !nextConfirm
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (locked) {
      return
    }
    setFormError(null)
    if (!runClientValidation()) {
      return
    }
    setSubmitting(true)
    try {
      const token = await register(username.trim(), password)
      setToken(token.access_token)
      await signIn(token.username)
    } catch (err) {
      const wait = retrySecondsFromError(err)
      if (wait) {
        lock(wait)
      }
      setFormError(err instanceof Error ? err.message : "注册失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="注册" description="创建账号后即可管理自己的数据集和训练任务">
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            aria-invalid={Boolean(usernameError)}
            aria-describedby="username-hint"
            disabled={locked}
            onChange={(e) => {
              setUsername(e.target.value)
              setUsernameError(null)
              if (!locked) {
                setFormError(null)
              }
            }}
            onBlur={() => setUsernameError(validateUsername(username))}
          />
          <p id="username-hint" className={`text-xs ${usernameError ? "text-destructive" : "text-muted-foreground"}`}>
            {usernameError ?? "3–32 位字母、数字或下划线"}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">密码</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            aria-invalid={Boolean(passwordError)}
            disabled={locked}
            onChange={(e) => {
              setPassword(e.target.value)
              setPasswordError(null)
              if (!locked) {
                setFormError(null)
              }
              if (confirm) {
                setConfirmError(validateConfirmPassword(e.target.value, confirm))
              }
            }}
            onBlur={() => setPasswordError(validatePassword(password))}
          />
          {passwordError ? <p className="text-xs text-destructive">{passwordError}</p> : <PasswordStrength value={password} />}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm">确认密码</Label>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            value={confirm}
            aria-invalid={Boolean(confirmError)}
            disabled={locked}
            onChange={(e) => {
              setConfirm(e.target.value)
              setConfirmError(validateConfirmPassword(password, e.target.value))
              if (!locked) {
                setFormError(null)
              }
            }}
            onBlur={() => setConfirmError(validateConfirmPassword(password, confirm))}
          />
          {confirmError ? <p className="text-xs text-destructive">{confirmError}</p> : null}
        </div>
        {locked ? (
          <p className="text-sm text-destructive">尝试过于频繁，请 {formatRetryWait(remaining)} 后再试</p>
        ) : formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}
        <Button type="submit" disabled={submitting || locked}>
          {submitting ? "注册中…" : locked ? `请稍候 ${formatRetryWait(remaining)}` : "注册并登录"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link className="font-medium text-foreground underline underline-offset-4" to="/login">
            登录
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
