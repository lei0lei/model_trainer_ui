import { passwordStrength } from "@/lib/auth-validation"
import { cn } from "@/lib/utils"

export function PasswordStrength({ value }: { value: string }) {
  const { score, label } = passwordStrength(value)
  if (!value) {
    return <p className="text-xs text-muted-foreground">至少 6 位，建议字母和数字组合</p>
  }
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1 rounded-full bg-muted",
              score >= step && score === 1 && "bg-destructive",
              score >= step && score === 2 && "bg-amber-500",
              score >= step && score === 3 && "bg-emerald-600",
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs",
          score === 1 && "text-destructive",
          score === 2 && "text-amber-600",
          score === 3 && "text-emerald-700",
        )}
      >
        密码强度：{label}
      </p>
    </div>
  )
}
