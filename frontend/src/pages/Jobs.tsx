import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { listJobs, type JobOut } from "@/lib/api"

export function JobsPage() {
  const [items, setItems] = useState<JobOut[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listJobs()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>我的训练任务</CardTitle>
          <CardDescription>{loading ? "加载中…" : `共 ${items.length} 个`}</CardDescription>
        </div>
        <Button asChild>
          <Link to="/train">新建训练</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
        {items.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">还没有训练任务。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">ID</th>
                  <th className="py-2 pr-3 font-medium">数据集</th>
                  <th className="py-2 pr-3 font-medium">模型</th>
                  <th className="py-2 pr-3 font-medium">Epochs</th>
                  <th className="py-2 pr-3 font-medium">状态</th>
                  <th className="py-2 font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{item.id}</td>
                    <td className="py-2 pr-3">{item.dataset_name}</td>
                    <td className="py-2 pr-3">{item.model_name}</td>
                    <td className="py-2 pr-3">{item.epochs}</td>
                    <td className="py-2 pr-3">
                        <StatusBadge status={item.status} />
                      </td>
                    <td className="py-2 text-muted-foreground">{item.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
