import { useEffect, useState } from "react"

export function useRetryLock(storageKey: string) {
  const [until, setUntil] = useState(() => {
    const raw = sessionStorage.getItem(storageKey)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) ? parsed : 0
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (until <= Date.now()) {
      sessionStorage.removeItem(storageKey)
      return
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [storageKey, until])

  const remaining = Math.max(0, Math.ceil((until - now) / 1000))

  function lock(seconds: number) {
    const wait = Math.max(1, Math.floor(seconds))
    const next = Date.now() + wait * 1000
    sessionStorage.setItem(storageKey, String(next))
    setUntil(next)
    setNow(Date.now())
  }

  return { remaining, locked: remaining > 0, lock }
}

export function formatRetryWait(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes > 0) {
    return `${minutes} 分 ${rest} 秒`
  }
  return `${rest} 秒`
}
