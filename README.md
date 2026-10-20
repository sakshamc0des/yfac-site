# Youth For A Cause (YFAC)

YFAC uses a React/JSX frontend, a FastAPI backend for push notifications, and Supabase for authentication, database, and photo storage. The `frontend/` and `backend/` folders are independent deployable applications; Supabase SQL setup files are in `backend/supabase/`.

```text
frontend/  React + Vite site (static hosting)
backend/   FastAPI API and Supabase setup SQL (Python hosting)
```

## Run the frontend locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
cd frontend
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. Without Supabase settings the app uses demo data stored in the browser:

- Demo admin PIN: `yfac-admin`
- Demo member PIN: `yfac-member`

Demo mode is only for previewing the interface. It is not secure authentication and data exists only in that browser.

## Supabase setup

The Supabase free plan can cover a small project within its current quotas; free plans have storage, usage, and inactivity limits that can change. A separate database is not needed.

1. Create a Supabase project and copy its project URL and anon/public key from **Project Settings → API**.
2. Paste them into `frontend/config.js` as `url` and `anon`.
3. Run `backend/supabase/schema.sql` and `backend/supabase/live_events.sql` once each in the Supabase SQL editor.
4. The schema creates the public Storage bucket named `photos` and its policies. If you already ran the schema before this bucket-creation step was added, run this once in the Supabase SQL Editor:

   ```sql
   insert into storage.buckets (id, name, public)
   values ('photos', 'photos', true)
   on conflict (id) do update set public = true;
   ```
5. In **Authentication → Providers**, enable Google and configure its OAuth callback using the URL displayed by Supabase.
6. Set the Supabase Site URL to your deployed frontend domain and add both the domain and `http://localhost:5173/` to Redirect URLs.
7. Sign in on the site at `#admin` using the Google account that will administer it. Then run the following in the SQL editor, replacing the email:

   ```sql
   update profiles set role = 'admin' where email = 'your-google-email';
   ```

8. Sign in again. The Admin → Access page can assign additional roles.

The Supabase anon key is intended to be visible in the browser; keep row-level security enabled. **Never put the Supabase service-role key or VAPID private key in `frontend/config.js` or other frontend files.**

The existing **Events** page remains the events/activities overview. Administrators publish posters, dates and venues from **Admin → Live Events**. Those published items appear on the separate **Live Events** page with a registration form. Registrant contact information is visible only to administrators. Run `backend/supabase/live_events.sql` to create the event and registration tables/policies.

### Move the bundled photos into Supabase Storage

Run the schema and create the public `photos` bucket first. Sign in as an admin, open **Admin → Gallery**, and select **Move existing site photos into Supabase Storage**. This uploads the bundled `frontend/img/` photos to the `site/` folder and updates existing photo references in the gallery, faculty, team, and live-event tables. It is safe to rerun: already-uploaded files are kept, and the references are updated only when they still use the old `img/` paths.

New gallery, faculty, team, and event poster uploads are stored in Supabase Storage automatically. Photo bytes belong in Storage; database rows keep only the Storage path and related display metadata. Until the migration has run, bundled images remain available locally as fallbacks.

## FastAPI backend

The Python API is used for sending web-push notifications. Supabase remains responsible for login and data; the API checks the signed-in user's Supabase identity and admin role before it sends anything.

From `backend/`, install and run:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Configure these environment variables in the backend host (or export them in your local shell):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key; secret, backend only |
| `VAPID_PRIVATE_KEY` | Private VAPID key; secret, backend only |
| `VAPID_SUBJECT` | Contact, e.g. `mailto:you@example.com` |
| `CORS_ORIGINS` | Exact frontend origins, comma-separated; e.g. `https://yfac.example, http://localhost:5173` |

Generate a VAPID key pair with `npx web-push generate-vapid-keys`. Put the public key into `frontend/config.js` as `vapid` and set both keys on the backend.

Set `apiUrl` in `frontend/config.js` to the deployed FastAPI origin, without a trailing slash. The API health check is `/health`; the protected notification endpoint is `/api/notifications/send`.

## Free hosting and custom domains

1. Deploy `frontend/` to Cloudflare Pages (or another static host). Set the project root directory to `frontend`, build command to `npm run build`, and output directory to `dist`.
2. Deploy `backend/` to a Python ASGI host that offers a free tier. Set the project root directory to `backend`, build command to `pip install -r requirements.txt`, start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and add the environment variables above.
3. Update `apiUrl` in `frontend/config.js` to the backend HTTPS URL, then redeploy the frontend. Set `CORS_ORIGINS` to the exact frontend URL.
4. Add your existing domain to the frontend host and follow its DNS instructions.

Hosting services' free tiers may sleep, impose quotas, or change their terms. A custom domain may still require paid registration or renewal even when website hosting is free. Push notifications require HTTPS; on iPhone, users generally need to add the site to their Home Screen first.

## Photos and privacy

The site contains photos of children and community members. Keep permission from the relevant NGO, school, and people pictured before publishing. Public gallery images should not contain private contact details.
