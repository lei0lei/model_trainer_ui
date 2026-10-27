import { JOB_STATUS_LABEL, jobStatusClass } from "@/lib/job-status"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", jobStatusClass(status))}>
      {JOB_STATUS_LABEL[status] ?? status}
    </span>
  )
}
