import httpx

from .settings import Settings


class SupabaseRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base_url = settings.supabase_url

    async def is_admin(self, access_token: str) -> bool:
        headers = {
            "apikey": self._settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            user_response = await client.get(
                f"{self._base_url}/auth/v1/user",
                headers=headers,
            )
            if user_response.status_code == 401:
                return False
            user_response.raise_for_status()
            user_id = user_response.json().get("id")
            if not user_id:
                return False
            profile_response = await client.get(
                f"{self._base_url}/rest/v1/profiles",
                params={"select": "role", "id": f"eq.{user_id}", "limit": "1"},
                headers=self._service_headers(),
            )
            profile_response.raise_for_status()
            profiles = profile_response.json()
            return bool(profiles and profiles[0].get("role") == "admin")

    async def list_subscriptions(self) -> list[dict[str, str]]:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{self._base_url}/rest/v1/push_subscriptions",
                params={"select": "endpoint,p256dh,auth"},
                headers=self._service_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def remove_subscriptions(self, endpoints: list[str]) -> None:
        if not endpoints:
            return
        async with httpx.AsyncClient(timeout=10) as client:
            for endpoint in endpoints:
                response = await client.delete(
                    f"{self._base_url}/rest/v1/push_subscriptions",
                    params={"endpoint": f"eq.{endpoint}"},
                    headers=self._service_headers(),
                )
                response.raise_for_status()

    def _service_headers(self) -> dict[str, str]:
        key = self._settings.supabase_service_role_key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
