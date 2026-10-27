import subprocess

from model_trainer_backend.schemas.job import DeviceOut


def list_train_devices() -> list[DeviceOut]:
    devices = [DeviceOut(id="cpu", label="CPU")]
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=index,name", "--format=csv,noheader"],
            text=True,
            timeout=5,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.SubprocessError):
        return devices
    for line in output.splitlines():
        if "," not in line:
            continue
        index, name = line.split(",", 1)
        gpu_id = index.strip()
        devices.append(DeviceOut(id=gpu_id, label=f"GPU {gpu_id}: {name.strip()}"))
    return devices
