import os
from pathlib import Path
from string import ascii_uppercase

from typing import Literal

from pydantic import BaseModel


class FsEntry(BaseModel):
    name: str
    path: str
    kind: Literal["dir", "file"]


class FsListing(BaseModel):
    path: str
    parent: str | None
    entries: list[FsEntry]


def _drive_roots() -> list[Path]:
    roots: list[Path] = []
    for letter in ascii_uppercase:
        candidate = Path(f"{letter}:/")
        try:
            if candidate.exists():
                roots.append(candidate)
        except OSError:
            continue
    return roots


def _display_name(path: Path) -> str:
    if os.name == "nt" and path.parent == path:
        return f"{path.drive}\\"
    return path.name or str(path)


def _parent_query(path: Path) -> str | None:
    parent = path.parent
    if parent == path:
        return "" if os.name == "nt" else None
    return str(parent)


def _list_dir(path: Path) -> FsListing:
    entries: list[FsEntry] = []
    try:
        children = list(path.iterdir())
    except OSError as exc:
        raise PermissionError(str(exc)) from exc
    for child in children:
        try:
            kind = "dir" if child.is_dir() else "file"
        except OSError:
            continue
        entries.append(FsEntry(name=_display_name(child), path=str(child), kind=kind))
    entries.sort(key=lambda item: (0 if item.kind == "dir" else 1, item.name.casefold()))
    return FsListing(path=str(path), parent=_parent_query(path), entries=entries)


def list_fs(raw_path: str) -> FsListing:
    text = raw_path.strip()
    if not text:
        if os.name == "nt":
            return FsListing(
                path="",
                parent=None,
                entries=[
                    FsEntry(name=_display_name(root), path=str(root), kind="dir") for root in _drive_roots()
                ],
            )
        return _list_dir(Path("/"))

    path = Path(text)
    if not path.exists():
        raise FileNotFoundError(text)
    if path.is_file():
        path = path.parent
    return _list_dir(path)
