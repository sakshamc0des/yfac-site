import asyncio
from collections.abc import Callable

from pywebpush import WebPushException
from starlette.concurrency import run_in_threadpool

from .ports import NotificationRepository, PushSender
from .web_push_sender import notification_payload


class NotificationDeliveryError(RuntimeError):
    pass


class NotificationService:
    def __init__(
        self,
        repository: NotificationRepository,
        sender: PushSender,
        is_expired: Callable[[BaseException], bool],
    ) -> None:
        self._repository = repository
        self._sender = sender
        self._is_expired = is_expired

    async def send(self, title: str, body: str, link: str) -> int:
        subscriptions = await self._repository.list_subscriptions()
        payload = notification_payload(title, body, link)

        async def deliver(subscription: dict[str, str]) -> str | None:
            try:
                await run_in_threadpool(self._sender.send, subscription, payload)
                return None
            except WebPushException as error:
                if self._is_expired(error):
                    return subscription["endpoint"]
                raise

        results = await asyncio.gather(
            *(deliver(subscription) for subscription in subscriptions),
            return_exceptions=True,
        )
        failures = [result for result in results if isinstance(result, BaseException)]
        expired = [result for result in results if isinstance(result, str)]
        if expired:
            await self._repository.remove_subscriptions(expired)
        if failures:
            raise NotificationDeliveryError(
                f"Push delivery failed for {len(failures)} subscription(s)."
            ) from failures[0]
        return len(subscriptions) - len(expired)
