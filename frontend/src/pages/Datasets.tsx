import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PathBrowser } from "@/components/PathBrowser"
import { createDataset, deleteDataset, listDatasets, type DatasetOut, type DatasetTask } from "@/lib/api"
import { cn } from "@/lib/utils"

const TASK_OPTIONS: DatasetTask[] = ["detect", "segment"]

export function DatasetsPage() {
  const [items, setItems] = useState<DatasetOut[]>([])
  const [name, setName] = useState("")
  const [task, setTask] = useState<DatasetTask>("detect")
  const [description, setDescription] = useState("")
  const [sourcePath, setSourcePath] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickingPath, setPickingPath] = useState(false)

  async function refresh() {
    const data = await listDatasets()
    setItems(data)
  }

  useEffect(() => {
    refresh()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false))
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await createDataset({
        name: name.trim(),
        tasks: [task],
        description: description.trim(),
        source_path: sourcePath.trim(),
      })
      setName("")
      setTask("detect")
      setDescription("")
      setSourcePath("")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: number) {
    setError(null)
    try {
      await deleteDataset(id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>新建数据集</CardTitle>
          <CardDescription>只属于当前登录用户</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="ds-name">名称</Label>
              <Input id="ds-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-task">任务</Label>
              <select
                id="ds-task"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                value={task}
                onChange={(e) => setTask(e.target.value as DatasetTask)}
              >
                {TASK_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-desc">任务说明</Label>
              <Input
                id="ds-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="可选，补充这个数据集做什么"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-path">本地路径</Label>
              <div className="flex gap-2">
                <Input
                  id="ds-path"
                  placeholder="例如 D:\\data\\datasets\\coco"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  required
                />
                <Button type="button" variant="outline" onClick={() => setPickingPath(true)}>
                  浏览
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </form>
          {pickingPath ? (
            <PathBrowser
              initialPath={sourcePath.trim()}
              onSelect={(path) => {
                setSourcePath(path)
                setPickingPath(false)
              }}
              onClose={() => setPickingPath(false)}
            />
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>我的数据集</CardTitle>
          <CardDescription>{loading ? "加载中…" : `共 ${items.length} 个`}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {items.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">还没有数据集。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">名称</th>
                    <th className="py-2 pr-3 font-medium">任务</th>
                    <th className="py-2 pr-3 font-medium">任务说明</th>
                    <th className="py-2 pr-3 font-medium">本地路径</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{item.name}</td>
                      <td className="py-2 pr-3">{(item.tasks ?? []).join(", ") || "—"}</td>
                      <td className="max-w-[12rem] truncate py-2 pr-3 text-muted-foreground">
                        {item.description || "—"}
                      </td>
                      <td className="max-w-[16rem] truncate py-2 pr-3 text-muted-foreground">
                        {item.source_path || "—"}
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                          删除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
