from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

from model_trainer_backend.core.config import settings


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._lock = Lock()
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, key: str, window_seconds: int, now: float) -> deque[float]:
        queue = self._hits[key]
        cutoff = now - window_seconds
        while queue and queue[0] <= cutoff:
            queue.popleft()
        if not queue:
            self._hits.pop(key, None)
            return deque()
        return queue

    def retry_after(self, key: str, max_attempts: int, window_seconds: int) -> int:
        now = monotonic()
        with self._lock:
            queue = self._prune(key, window_seconds, now)
            if len(queue) >= max_attempts:
                return max(1, int(queue[0] + window_seconds - now) + 1)
            return 0

    def record(self, key: str) -> None:
        with self._lock:
            self._hits[key].append(monotonic())

    def consume(self, key: str, max_attempts: int, window_seconds: int) -> int:
        now = monotonic()
        with self._lock:
            queue = self._prune(key, window_seconds, now)
            if len(queue) >= max_attempts:
                return max(1, int(queue[0] + window_seconds - now) + 1)
            queue.append(now)
            self._hits[key] = queue
            return 0

    def reset(self, key: str) -> None:
        with self._lock:
            self._hits.pop(key, None)


limiter = SlidingWindowLimiter()


def client_ip(request: Request) -> str:
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def too_many_attempts(retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many attempts",
        headers={"Retry-After": str(retry_after)},
    )
