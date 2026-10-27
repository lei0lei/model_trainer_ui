import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { File, Folder, FolderUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { listFsEntries, type FsListing } from "@/lib/api"

export function PathBrowser({
  initialPath,
  onSelect,
  onClose,
}: {
  initialPath: string
  onSelect: (path: string) => void
  onClose: () => void
}) {
  const [listing, setListing] = useState<FsListing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load(path: string) {
    setLoading(true)
    setError(null)
    try {
      setListing(await listFsEntries(path))
    } catch (err) {
      if (path) {
        try {
          setListing(await listFsEntries(""))
          return
        } catch {
          /* fall through */
        }
      }
      setListing(null)
      setError(err instanceof Error ? err.message : "无法浏览本地路径")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(initialPath)
  }, [initialPath])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const dialog = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex h-[min(36rem,80vh)] w-full max-w-2xl flex-col border border-border bg-background shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">选择本地路径</p>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{listing?.path || "此电脑"}</p>
        </div>
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={listing == null || listing.parent == null}
            onClick={() => listing && void load(listing.parent ?? "")}
          >
            <FolderUp />
            上级
          </Button>
          {listing?.path ? (
            <Button type="button" size="sm" onClick={() => onSelect(listing.path)}>
              选择当前文件夹
            </Button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {error ? <p className="px-4 py-3 text-sm text-destructive">{error}</p> : null}
          {loading ? <p className="px-4 py-3 text-sm text-muted-foreground">加载中…</p> : null}
          {!loading && listing?.entries.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">此目录为空</p>
          ) : null}
          <ul>
            {listing?.entries.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-4 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => (item.kind === "dir" ? void load(item.path) : onSelect(item.path))}
                >
                  {item.kind === "dir" ? (
                    <Folder className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <File className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{item.name}</span>
                    <span className="block truncate font-mono text-xs text-muted-foreground">{item.path}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end border-t px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialog, document.body)
}
