# Model Trainer UI

模型训练控制台骨架：前端 React + Vite + shadcn/ui，后端 FastAPI（uv），训练框架通过 Adapter 接入（YOLO 预留）。

## 目录

- `frontend/` — Vite + React + TypeScript + shadcn
- `backend/` — uv 项目，FastAPI + JWT 登录

## 启动

仓库根目录一条命令同时拉起前后端。

Windows：

```powershell
.\dev.ps1
```

Linux / macOS：

```bash
chmod +x dev.sh
./dev.sh
```

或：

```bash
npm install
npm run dev
```

前端 http://localhost:5173 ，API http://127.0.0.1:8000 。在 Cursor 里也可以 `Ctrl+Shift+B` 跑默认任务「启动前后端」。

分开启动：

```powershell
cd backend
uv sync
uv run uvicorn model_trainer_backend.main:app --reload --port 8000
```

```powershell
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173 ，可注册账号或使用本地默认管理员 `admin` / `admin123`。每个用户只能看到自己的数据集和训练任务。数据存在 `backend/data/app.db`（SQLite）。

## Linux 裸机部署

生产只跑 FastAPI：前端先 build 成 `frontend/dist`，由同一进程在 `8000` 提供页面和 `/api`。服务器需要 Python 3.12、Node.js 20+、[uv](https://docs.astral.sh/uv/)。

以部署用户为例（路径按实际修改）：

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin modeltrainer
sudo mkdir -p /opt/model_trainer_ui
sudo chown -R modeltrainer:modeltrainer /opt/model_trainer_ui
sudo -u modeltrainer -H bash -lc 'curl -LsSf https://astral.sh/uv/install.sh | sh'

# 把代码放到 /opt/model_trainer_ui 后：
sudo -u modeltrainer -H bash -lc 'cd /opt/model_trainer_ui && chmod +x scripts/*.sh && ./scripts/setup-prod.sh'
sudo -u modeltrainer nano /opt/model_trainer_ui/deploy/model-trainer.env
```

`deploy/model-trainer.env` 里至少改：

- `SECRET_KEY`：`openssl rand -hex 32`
- `ADMIN_PASSWORD`：强密码

安装 systemd（把 `deploy/model-trainer.service` 里的路径、用户改成你的）：

```bash
sudo cp /opt/model_trainer_ui/deploy/model-trainer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now model-trainer
sudo systemctl status model-trainer
```

代码更新后：

```bash
sudo -u modeltrainer -H bash -lc 'cd /opt/model_trainer_ui && git pull && ./scripts/setup-prod.sh'
sudo systemctl restart model-trainer
```

访问 `http://服务器IP:8000`。若要用 80/443，把 uvicorn 的 `HOST=127.0.0.1`，再按 `deploy/nginx.conf.example` 反代。训练 Worker 以后单独进程跑，不要放进 uvicorn。
