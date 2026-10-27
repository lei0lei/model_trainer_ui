import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createJob, listDatasets, type DatasetOut } from "@/lib/api"
import { cn } from "@/lib/utils"

export function TrainPage() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState<DatasetOut[]>([])
  const [datasetId, setDatasetId] = useState("")
  const [modelName, setModelName] = useState("yolo11n.pt")
  const [epochs, setEpochs] = useState("50")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listDatasets()
      .then((items) => {
        setDatasets(items)
        if (items[0]) {
          setDatasetId(String(items[0].id))
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "加载失败"))
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!datasetId) {
      setError("请先创建数据集")
      return
    }
    setSaving(true)
    try {
      await createJob({
        dataset_id: Number(datasetId),
        model_name: modelName,
        epochs: Number(epochs),
      })
      navigate("/jobs")
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>新建训练</CardTitle>
        <CardDescription>任务会记在当前用户下，状态先进入排队</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="dataset">数据集</Label>
            <select
              id="dataset"
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
            >
              {datasets.length === 0 ? <option value="">暂无数据集</option> : null}
              {datasets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {(item.tasks ?? []).length ? ` (${item.tasks.join(", ")})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">模型</Label>
            <Input id="model" value={modelName} onChange={(e) => setModelName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="epochs">Epochs</Label>
            <Input id="epochs" type="number" min={1} max={1000} value={epochs} onChange={(e) => setEpochs(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={saving || datasets.length === 0}>
            {saving ? "提交中…" : "提交训练任务"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
