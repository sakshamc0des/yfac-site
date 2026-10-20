import json

from pywebpush import WebPushException, webpush

from .ports import PushSender
from .settings import Settings


class WebPushSender(PushSender):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def send(self, subscription: dict[str, str], payload: str) -> None:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": {
                    "p256dh": subscription["p256dh"],
                    "auth": subscription["auth"],
                },
            },
            data=payload,
            vapid_private_key=self._settings.vapid_private_key,
            vapid_claims={"sub": self._settings.vapid_subject},
        )

    @staticmethod
    def is_expired(error: BaseException) -> bool:
        if not isinstance(error, WebPushException):
            return False
        response = error.response
        return response is not None and response.status_code in (404, 410)


def notification_payload(title: str, body: str, link: str) -> str:
    return json.dumps({"title": f"YFAC: {title}", "body": body, "url": link})
