// Public browser configuration. Keep service-role and VAPID private keys on the backend only.
window.YFAC_CONFIG = {
  url:    "", // https://YOUR-PROJECT.supabase.co
  anon:   "", // Supabase anon/public key; safe to expose with row-level security enabled
  vapid:  "", // Public VAPID key used by browser push subscriptions
  apiUrl: ""  // HTTPS URL of the FastAPI backend, for example https://your-api.example.com
};
