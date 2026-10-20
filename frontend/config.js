// Public browser configuration. Keep service-role and VAPID private keys on the backend only.
window.YFAC_CONFIG = {
  url:    "https://ynosxrwpuohkjnvwwvud.supabase.co",
  anon:   "sb_publishable_Y9hRVRoJYt3J94NLH7af8A_KxUGuwc3",
  vapid:  "BExHzQZbZoIDBM1RGiUiQ3Z-D5vAFPha90jyzTiwvnHg2GHISvtr7HXu3PNKckEys74Zg7E7Q_S-XXln3dZjUu8", // Public VAPID key used by browser push subscriptions
  apiUrl: "https://yfac-site.onrender.com" // HTTPS URL of the FastAPI backend
};
