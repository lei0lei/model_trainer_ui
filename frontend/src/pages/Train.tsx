import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import {
  createJob,
  listDatasets,
  listDevices,
  type DatasetOut,
  type DatasetTask,
  type DeviceOut,
  type TrainConfig,
} from "@/lib/api"
import { defaultModel, taskForModel, YOLO_MODELS } from "@/lib/yolo-models"

const TASK_OPTIONS: DatasetTask[] = ["detect", "segment"]

function CheckRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 rounded border-input accent-foreground"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  )
}

export function TrainPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [datasets, setDatasets] = useState<DatasetOut[]>([])
  const [devices, setDevices] = useState<DeviceOut[]>([{ id: "cpu", label: "CPU" }])
  const [datasetId, setDatasetId] = useState("")
  const [task, setTask] = useState<DatasetTask>("detect")
  const [modelName, setModelName] = useState(defaultModel("detect"))
  const [epochs, setEpochs] = useState("100")
  const [timeHours, setTimeHours] = useState("")
  const [device, setDevice] = useState("cpu")
  const [imgsz, setImgsz] = useState("640")
  const [exportOnnx, setExportOnnx] = useState(false)
  const [batch, setBatch] = useState("16")
  const [workers, setWorkers] = useState("8")
  const [patience, setPatience] = useState("100")
  const [optimizer, setOptimizer] = useState<TrainConfig["optimizer"]>("auto")
  const [lr0, setLr0] = useState("0.01")
  const [lrf, setLrf] = useState("0.01")
  const [momentum, setMomentum] = useState("0.937")
  const [weightDecay, setWeightDecay] = useState("0.0005")
  const [warmupEpochs, setWarmupEpochs] = useState("3")
  const [seed, setSeed] = useState("0")
  const [amp, setAmp] = useState(true)
  const [cache, setCache] = useState<TrainConfig["cache"]>("False")
  const [rect, setRect] = useState(false)
  const [cosLr, setCosLr] = useState(false)
  const [closeMosaic, setCloseMosaic] = useState("10")
  const [freeze, setFreeze] = useState("")
  const [pretrained, setPretrained] = useState(true)
  const [mosaic, setMosaic] = useState("1")
  const [mixup, setMixup] = useState("0")
  const [copyPaste, setCopyPaste] = useState("0")
  const [hsvH, setHsvH] = useState("0.015")
  const [hsvS, setHsvS] = useState("0.7")
  const [hsvV, setHsvV] = useState("0.4")
  const [degrees, setDegrees] = useState("0")
  const [translate, setTranslate] = useState("0.1")
  const [scale, setScale] = useState("0.5")
  const [fliplr, setFliplr] = useState("0.5")
  const [flipud, setFlipud] = useState("0")
  const [overlapMask, setOverlapMask] = useState(true)
  const [maskRatio, setMaskRatio] = useState("4")
  const [plots, setPlots] = useState(true)
  const [val, setVal] = useState(true)
  const [savePeriod, setSavePeriod] = useState("-1")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const preset = searchParams.get("dataset")
    Promise.all([listDatasets(), listDevices()])
      .then(([items, nextDevices]) => {
        setDatasets(items)
        setDevices(nextDevices.length ? nextDevices : [{ id: "cpu", label: "CPU" }])
        const gpu = nextDevices.find((item) => item.id !== "cpu")
        setDevice(gpu?.id ?? "cpu")
        const match = items.find((item) => String(item.id) === preset) ?? items[0]
        if (match) {
          setDatasetId(String(match.id))
          const nextTask = (match.tasks?.[0] ?? "detect") as DatasetTask
          setTask(nextTask)
          setModelName(defaultModel(nextTask))
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "加载失败"))
  }, [searchParams])

  function onDatasetChange(id: string) {
    setDatasetId(id)
    const match = datasets.find((item) => String(item.id) === id)
    const nextTask = (match?.tasks?.[0] ?? "detect") as DatasetTask
    setTask(nextTask)
    setModelName(defaultModel(nextTask))
  }

  function onTaskChange(next: DatasetTask) {
    setTask(next)
    setModelName(defaultModel(next))
  }

  function onModelChange(next: string) {
    setModelName(next)
    setTask(taskForModel(next))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!datasetId) {
      setError("请先创建数据集")
      return
    }
    const epochsValue = Number(epochs)
    const timeValue = timeHours.trim() === "" ? null : Number(timeHours)
    if ((!Number.isFinite(epochsValue) || epochsValue <= 0) && (timeValue === null || timeValue <= 0)) {
      setError("请设置 Epochs 或训练时长 time")
      return
    }
    setSaving(true)
    try {
      const config: TrainConfig = {
        time: timeValue && timeValue > 0 ? timeValue : null,
        device,
        imgsz: Number(imgsz),
        task,
        export_onnx: exportOnnx,
        batch: Number(batch),
        workers: Number(workers),
        patience: Number(patience),
        optimizer,
        lr0: Number(lr0),
        lrf: Number(lrf),
        momentum: Number(momentum),
        weight_decay: Number(weightDecay),
        warmup_epochs: Number(warmupEpochs),
        seed: Number(seed),
        amp,
        cache,
        rect,
        cos_lr: cosLr,
        close_mosaic: Number(closeMosaic),
        freeze: freeze.trim() === "" ? null : Number(freeze),
        pretrained,
        mosaic: Number(mosaic),
        mixup: Number(mixup),
        copy_paste: Number(copyPaste),
        hsv_h: Number(hsvH),
        hsv_s: Number(hsvS),
        hsv_v: Number(hsvV),
        degrees: Number(degrees),
        translate: Number(translate),
        scale: Number(scale),
        fliplr: Number(fliplr),
        flipud: Number(flipud),
        overlap_mask: overlapMask,
        mask_ratio: Number(maskRatio),
        plots,
        val,
        save_period: Number(savePeriod),
      }
      await createJob({
        dataset_id: Number(datasetId),
        model_name: modelName,
        epochs: Number.isFinite(epochsValue) ? epochsValue : 0,
        config,
      })
      navigate("/jobs")
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle>新建训练</CardTitle>
        <CardDescription>参数会随任务保存，供后续 YOLO Worker 使用</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="dataset">数据集</Label>
              <NativeSelect id="dataset" value={datasetId} onChange={(e) => onDatasetChange(e.target.value)}>
                {datasets.length === 0 ? <option value="">暂无数据集</option> : null}
                {datasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.description ? ` · ${item.description}` : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task">任务类型</Label>
              <NativeSelect id="task" value={task} onChange={(e) => onTaskChange(e.target.value as DatasetTask)}>
                {TASK_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">模型</Label>
              <NativeSelect id="model" value={modelName} onChange={(e) => onModelChange(e.target.value)}>
                {YOLO_MODELS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="device">GPU</Label>
              <NativeSelect id="device" value={device} onChange={(e) => setDevice(e.target.value)}>
                {devices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="epochs">Epochs</Label>
              <Input id="epochs" type="number" min={0} max={10000} value={epochs} onChange={(e) => setEpochs(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">time（小时）</Label>
              <Input
                id="time"
                type="number"
                min={0}
                step="0.1"
                placeholder="留空表示不限制时长"
                value={timeHours}
                onChange={(e) => setTimeHours(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imgsz">图片尺寸 imgsz</Label>
              <Input id="imgsz" type="number" min={32} max={2048} step={32} value={imgsz} onChange={(e) => setImgsz(e.target.value)} />
            </div>
            <div className="flex items-end pb-1">
              <CheckRow id="export-onnx" label="导出 ONNX" checked={exportOnnx} onChange={setExportOnnx} />
            </div>
          </div>

          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer text-sm font-medium">YOLO 高级训练参数</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="batch">batch（-1 自动）</Label>
                <Input id="batch" type="number" min={-1} value={batch} onChange={(e) => setBatch(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workers">workers</Label>
                <Input id="workers" type="number" min={0} value={workers} onChange={(e) => setWorkers(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="patience">patience</Label>
                <Input id="patience" type="number" min={0} value={patience} onChange={(e) => setPatience(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="optimizer">optimizer</Label>
                <NativeSelect id="optimizer" value={optimizer} onChange={(e) => setOptimizer(e.target.value as TrainConfig["optimizer"])}>
                  <option value="auto">auto</option>
                  <option value="SGD">SGD</option>
                  <option value="Adam">Adam</option>
                  <option value="AdamW">AdamW</option>
                  <option value="RMSProp">RMSProp</option>
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lr0">lr0</Label>
                <Input id="lr0" type="number" step="0.0001" value={lr0} onChange={(e) => setLr0(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lrf">lrf</Label>
                <Input id="lrf" type="number" step="0.0001" value={lrf} onChange={(e) => setLrf(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="momentum">momentum</Label>
                <Input id="momentum" type="number" step="0.001" value={momentum} onChange={(e) => setMomentum(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weightDecay">weight_decay</Label>
                <Input id="weightDecay" type="number" step="0.0001" value={weightDecay} onChange={(e) => setWeightDecay(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warmup">warmup_epochs</Label>
                <Input id="warmup" type="number" step="0.1" value={warmupEpochs} onChange={(e) => setWarmupEpochs(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seed">seed</Label>
                <Input id="seed" type="number" min={0} value={seed} onChange={(e) => setSeed(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cache">cache</Label>
                <NativeSelect id="cache" value={cache} onChange={(e) => setCache(e.target.value as TrainConfig["cache"])}>
                  <option value="False">关闭</option>
                  <option value="ram">ram</option>
                  <option value="disk">disk</option>
                </NativeSelect>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closeMosaic">close_mosaic</Label>
                <Input id="closeMosaic" type="number" min={0} value={closeMosaic} onChange={(e) => setCloseMosaic(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="freeze">freeze（层数，可空）</Label>
                <Input id="freeze" type="number" min={0} placeholder="不冻结" value={freeze} onChange={(e) => setFreeze(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="savePeriod">save_period（-1 关闭）</Label>
                <Input id="savePeriod" type="number" min={-1} value={savePeriod} onChange={(e) => setSavePeriod(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mosaic">mosaic</Label>
                <Input id="mosaic" type="number" min={0} max={1} step="0.05" value={mosaic} onChange={(e) => setMosaic(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mixup">mixup</Label>
                <Input id="mixup" type="number" min={0} max={1} step="0.05" value={mixup} onChange={(e) => setMixup(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="copyPaste">copy_paste</Label>
                <Input id="copyPaste" type="number" min={0} max={1} step="0.05" value={copyPaste} onChange={(e) => setCopyPaste(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hsvH">hsv_h</Label>
                <Input id="hsvH" type="number" min={0} max={1} step="0.001" value={hsvH} onChange={(e) => setHsvH(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hsvS">hsv_s</Label>
                <Input id="hsvS" type="number" min={0} max={1} step="0.01" value={hsvS} onChange={(e) => setHsvS(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hsvV">hsv_v</Label>
                <Input id="hsvV" type="number" min={0} max={1} step="0.01" value={hsvV} onChange={(e) => setHsvV(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="degrees">degrees</Label>
                <Input id="degrees" type="number" min={0} value={degrees} onChange={(e) => setDegrees(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="translate">translate</Label>
                <Input id="translate" type="number" min={0} max={1} step="0.01" value={translate} onChange={(e) => setTranslate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scale">scale</Label>
                <Input id="scale" type="number" min={0} max={1} step="0.01" value={scale} onChange={(e) => setScale(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fliplr">fliplr</Label>
                <Input id="fliplr" type="number" min={0} max={1} step="0.05" value={fliplr} onChange={(e) => setFliplr(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flipud">flipud</Label>
                <Input id="flipud" type="number" min={0} max={1} step="0.05" value={flipud} onChange={(e) => setFlipud(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maskRatio">mask_ratio</Label>
                <Input id="maskRatio" type="number" min={1} max={8} value={maskRatio} onChange={(e) => setMaskRatio(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <CheckRow id="amp" label="amp" hint="混合精度" checked={amp} onChange={setAmp} />
              <CheckRow id="rect" label="rect" hint="矩形训练" checked={rect} onChange={setRect} />
              <CheckRow id="cosLr" label="cos_lr" hint="余弦学习率" checked={cosLr} onChange={setCosLr} />
              <CheckRow id="pretrained" label="pretrained" hint="使用预训练权重" checked={pretrained} onChange={setPretrained} />
              <CheckRow id="overlapMask" label="overlap_mask" hint="分割重叠 mask" checked={overlapMask} onChange={setOverlapMask} />
              <CheckRow id="plots" label="plots" hint="保存训练曲线" checked={plots} onChange={setPlots} />
              <CheckRow id="val" label="val" hint="训练中验证" checked={val} onChange={setVal} />
            </div>
          </details>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={saving || datasets.length === 0}>
            {saving ? "提交中…" : "提交训练任务"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
