import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listDatasets, listJobs, type DatasetOut, type JobOut } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { formatDateTime, isActiveJob } from "@/lib/job-status"

const HISTORY_LIMIT = 8
const DATASET_LIMIT = 8

export function DashboardPage() {
  const { user } = useAuth()
  const [datasets, setDatasets] = useState<DatasetOut[]>([])
  const [jobs, setJobs] = useState<JobOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(quietly = false) {
    if (!quietly) {
      setError(null)
    }
    try {
      const [nextDatasets, nextJobs] = await Promise.all([listDatasets(), listJobs()])
      setDatasets(nextDatasets)
      setJobs(nextJobs)
    } catch (err) {
      if (!quietly) {
        setError(err instanceof Error ? err.message : "加载失败")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const activeJobs = useMemo(() => jobs.filter(isActiveJob), [jobs])
  const historyJobs = useMemo(() => jobs.filter((job) => !isActiveJob(job)).slice(0, HISTORY_LIMIT), [jobs])

  useEffect(() => {
    if (activeJobs.length === 0) {
      return
    }
    const timer = window.setInterval(() => {
      void load(true)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [activeJobs.length])

  const recentDatasets = datasets.slice(0, DATASET_LIMIT)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">概览</h1>
          <p className="text-sm text-muted-foreground">你好，{user?.username}。以下只显示当前账号的数据。</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/datasets">管理数据集</Link>
          </Button>
          <Button asChild>
            <Link to="/train">新建训练</Link>
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/datasets">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader className="pb-2">
              <CardDescription>我的数据集</CardDescription>
              <CardTitle className="text-3xl">{loading ? "…" : datasets.length}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/jobs">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader className="pb-2">
              <CardDescription>训练中 / 排队</CardDescription>
              <CardTitle className="text-3xl">{loading ? "…" : activeJobs.length}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/jobs">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader className="pb-2">
              <CardDescription>历史任务</CardDescription>
              <CardTitle className="text-3xl">{loading ? "…" : jobs.length - activeJobs.length}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>训练中的模型</CardTitle>
            <CardDescription>排队和正在训练的任务</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/jobs">全部任务</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading && activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">加载中…</p>
          ) : activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              当前没有训练中的模型。
              <Link className="ml-1 underline underline-offset-4" to="/train">
                去提交训练
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">模型</th>
                    <th className="py-2 pr-3 font-medium">数据集</th>
                    <th className="py-2 pr-3 font-medium">Epochs</th>
                    <th className="py-2 pr-3 font-medium">状态</th>
                    <th className="py-2 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{job.model_name}</td>
                      <td className="py-2 pr-3">{job.dataset_name}</td>
                      <td className="py-2 pr-3">{job.epochs}</td>
                      <td className="py-2 pr-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="py-2 text-muted-foreground">{job.message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>我的数据集</CardTitle>
              <CardDescription>{loading ? "加载中…" : `共 ${datasets.length} 个`}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/datasets">管理</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentDatasets.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">
                还没有数据集。
                <Link className="ml-1 underline underline-offset-4" to="/datasets">
                  去创建
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {recentDatasets.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(item.tasks ?? []).join(", ") || "detect"}
                        {item.description ? ` · ${item.description}` : ""} · {item.source_path || "未填写路径"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>训练历史</CardTitle>
              <CardDescription>已结束的任务</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/jobs">全部</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {historyJobs.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">还没有已结束的训练记录。</p>
            ) : (
              <ul className="divide-y">
                {historyJobs.map((job) => (
                  <li key={job.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {job.model_name}
                        <span className="ml-2 font-normal text-muted-foreground">{job.dataset_name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(job.updated_at)}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
