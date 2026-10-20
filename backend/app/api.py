import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, HttpUrl, field_validator

from .notification_service import NotificationDeliveryError, NotificationService
from .settings import Settings
from .supabase_repository import SupabaseRepository
from .web_push_sender import WebPushSender

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
bearer = HTTPBearer(auto_error=False)


class NotificationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    txt: str = Field(default="", max_length=1000)
    link: HttpUrl | None = None

    @field_validator("link", mode="before")
    @classmethod
    def empty_link_is_none(cls, value: object) -> object:
        return None if value == "" else value


def get_settings() -> Settings:
    try:
        return Settings.from_environment()
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


def get_service(settings: Settings = Depends(get_settings)) -> NotificationService:
    sender = WebPushSender(settings)
    return NotificationService(
        SupabaseRepository(settings),
        sender,
        WebPushSender.is_expired,
    )


@router.post("/send")
async def send_notification(
    request: NotificationRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
    service: NotificationService = Depends(get_service),
) -> dict[str, int]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A Supabase access token is required.",
        )
    repository = SupabaseRepository(settings)
    try:
        is_admin = await repository.is_admin(credentials.credentials)
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not validate the Supabase session.",
        ) from error
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    try:
        sent = await service.send(request.title, request.txt, str(request.link or "/"))
    except (httpx.HTTPError, NotificationDeliveryError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Push notification delivery failed.",
        ) from error
    return {"sent": sent}
