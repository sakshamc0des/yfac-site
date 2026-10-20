import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    vapid_private_key: str
    vapid_subject: str
    cors_origins: tuple[str, ...]

    @classmethod
    def from_environment(cls) -> "Settings":
        names = (
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "VAPID_PRIVATE_KEY",
            "VAPID_SUBJECT",
        )
        missing = [name for name in names if not os.getenv(name)]
        if missing:
            raise RuntimeError(f"Missing backend settings: {', '.join(missing)}")
        origins = tuple(
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "").split(",")
            if origin.strip()
        )
        if not origins:
            raise RuntimeError("Set CORS_ORIGINS to your frontend origin.")
        return cls(
            supabase_url=os.environ["SUPABASE_URL"].rstrip("/"),
            supabase_anon_key=os.environ["SUPABASE_ANON_KEY"],
            supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
            vapid_private_key=os.environ["VAPID_PRIVATE_KEY"],
            vapid_subject=os.environ["VAPID_SUBJECT"],
            cors_origins=origins,
        )
