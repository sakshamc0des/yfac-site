// Public browser configuration. Keep service-role and VAPID private keys on the backend only.
window.YFAC_CONFIG = {
  url:    "https://ynosxrwpuohkjnvwwvud.supabase.co",
  anon:   "sb_publishable_Y9hRVRoJYt3J94NLH7af8A_KxUGuwc3",
  vapid:  "", // Public VAPID key used by browser push subscriptions
  apiUrl: ""  // HTTPS URL of the FastAPI backend, for example https://your-api.example.com
};
