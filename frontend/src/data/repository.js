import { createClient } from "@supabase/supabase-js";
import { defaultGallery, images } from "./images.js";

const TABLES = {
  announcements: "announcements",
  post_holders: "post_holders",
  faculty: "faculty",
  members: "members",
  alumni: "alumni",
  gallery: "gallery",
  events: "live_events",
};
const LOCAL_KEY = "yfac3";
const demoPins = { admin: "yfac-admin", member: "yfac-member" };

function createLocalRepository() {
  let data;
  let role = sessionStorage.getItem("yfac_role") || "visitor";

  function read() {
    if (data) return data;
    try {
      data = JSON.parse(localStorage.getItem(LOCAL_KEY));
    } catch {
      data = null;
    }
    data ||= {
      announcements: [],
      post_holders: [
        "President", "CTC", "Co-CTC", "Vice President", "General Secretary",
        "Management Head", "Secretary Head",
      ].map((post, index) => ({
        id: `post-${index}`,
        role: post,
        name: "Add name in Admin",
        year: "2026-27",
        pri: index + 1,
      })),
      faculty: [{
        id: "faculty-1",
        name: "Add faculty name in Admin",
        post: "Faculty Coordinator",
        descr: "Add a short description of the faculty member here.",
        pri: 1,
      }],
      members: [
        { id: "member-1", name: "Demo Member", dept: "Design and Social Media", year: "2nd year" },
        { id: "member-2", name: "Demo Member", dept: "Management", year: "1st year" },
      ],
      alumni: [{ id: "alumni-1", name: "Demo Alumnus", batch: "2024", org: "Add current role" }],
      requests: [],
      gallery: defaultGallery.map((photo) => ({ ...photo })),
      events: [],
      registrations: [],
    };
    data.events ||= [];
    data.registrations ||= [];
    return data;
  }

  function persist() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }

  return {
    live: false,
    getRole: async () => role,
    signIn: async (accountRole, pin) => {
      if (demoPins[accountRole] !== pin) throw new Error("Wrong PIN");
      role = accountRole;
      sessionStorage.setItem("yfac_role", role);
      return role;
    },
    signInWithGoogle: async () => {
      throw new Error("Google sign-in needs Supabase project settings.");
    },
    signOut: async () => {
      role = "visitor";
      sessionStorage.removeItem("yfac_role");
    },
    load: async () => {
      const current = read();
      return {
        ...structuredClone(current),
        registrations: role === "admin" ? structuredClone(current.registrations) : [],
      };
    },
    save: async (table, record, file) => {
      const rows = read()[table];
      const saved = { ...record };
      if (file) saved.photo_path = await localImage(file);
      if (saved.id) {
        const current = rows.find((item) => item.id === saved.id);
        if (!current) throw new Error("The item no longer exists.");
        Object.assign(current, saved);
      } else {
        saved.id = crypto.randomUUID();
        rows.unshift(saved);
      }
      persist();
    },
    remove: async (table, record) => {
      read()[table] = read()[table].filter((item) => item.id !== record.id);
      if (table === "events") {
        read().registrations = read().registrations.filter((item) => item.event_id !== record.id);
      }
      persist();
    },
    register: async (eventId, registration) => {
      const event = read().events.find((item) => item.id === eventId && item.published);
      if (!event || !event.registration_open) throw new Error("Registration for this event is closed.");
      const email = registration.email.trim().toLowerCase();
      if (read().registrations.some((item) => item.event_id === eventId && item.email === email)) {
        throw new Error("This email is already registered for the event.");
      }
      read().registrations.push({
        id: crypto.randomUUID(),
        event_id: eventId,
        full_name: registration.full_name.trim(),
        email,
        phone: registration.phone.trim(),
        created_at: new Date().toISOString(),
      });
      persist();
    },
    ask: async (request) => {
      const saved = { ...request, id: crypto.randomUUID(), status: "pending" };
      read().requests.push(saved);
      persist();
    },
    review: async (id, approved) => {
      const item = read().requests.find((request) => request.id === id);
      if (!item) throw new Error("Request not found.");
      if (item.kind === "member" && role !== "admin") {
        throw new Error("Only the admin approves member requests.");
      }
      if (item.kind === "alumni" && !["member", "admin"].includes(role)) {
        throw new Error("Only members approve alumni requests.");
      }
      read().requests = read().requests.filter((request) => request.id !== id);
      if (approved && item.kind === "member") {
        read().members.push({
          id: crypto.randomUUID(),
          name: item.name,
          dept: item.dept,
          year: item.year,
          contact: item.contact,
        });
      } else if (approved) {
        read().alumni.push({
          id: crypto.randomUUID(),
          name: item.name,
          batch: item.year,
          org: item.org,
          contact: item.contact,
        });
      }
      persist();
    },
    resetGallery: async () => {
      read().gallery = defaultGallery.map((photo) => ({ ...photo }));
      persist();
    },
    migrateSitePhotos: async () => {
      throw new Error("Configure Supabase to move site photos into shared storage.");
    },
    notify: async (notice) => {
      if (Notification.permission !== "granted") return;
      new Notification(`YFAC: ${notice.title}`, { body: notice.txt || "" });
    },
    subscribe: async () => {
      if (!("Notification" in window)) throw new Error("Notifications are not supported.");
      if ((await Notification.requestPermission()) !== "granted") {
        throw new Error("Notifications are blocked.");
      }
    },
    profiles: async () => [],
    setRole: async () => {
      throw new Error("Access management needs Supabase.");
    },
  };
}

function createSupabaseRepository(config) {
  const supabase = createClient(config.url, config.anon, {
    auth: { flowType: "pkce" },
  });
  let role = "visitor";

  function unwrap(result) {
    if (result.error) throw result.error;
    return result.data;
  }

  function publicPhoto(path) {
    if (/^img\//.test(path || "")) {
      return supabase.storage.from("photos").getPublicUrl(`site/${path.slice(4)}`).data.publicUrl;
    }
    if (/^(data:|https?:)/.test(path || "")) return path;
    return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
  }

  return {
    live: true,
    getRole: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return (role = "visitor");
      const profile = unwrap(await supabase.from("profiles")
        .select("role").eq("id", session.user.id).maybeSingle());
      return (role = profile?.role || "visitor");
    },
    signIn: async () => {
      throw new Error("Use Google sign-in for the live site.");
    },
    signInWithGoogle: async () => {
      sessionStorage.setItem("yfac_next", location.hash || "#admin");
      unwrap(await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}${location.pathname}` },
      }));
    },
    signOut: async () => {
      unwrap(await supabase.auth.signOut());
      role = "visitor";
    },
    load: async () => {
      const isReviewer = role === "member" || role === "admin";
      const isAdmin = role === "admin";
      const requests = [
        supabase.from("announcements").select("*").eq("active", true)
          .order("created_at", { ascending: false }),
        supabase.from("post_holders").select("*").order("pri"),
        supabase.from("faculty").select("*").order("pri"),
        supabase.from("members_public").select("*").order("name"),
        supabase.from("alumni_public").select("*").order("name"),
        supabase.from("gallery").select("*").order("created_at", { ascending: false }),
        isAdmin
          ? supabase.from("live_events").select("*").order("event_date", { ascending: true, nullsFirst: false })
          : supabase.from("live_events").select("*").eq("published", true)
            .order("event_date", { ascending: true, nullsFirst: false }),
      ];
      if (isReviewer) {
        requests.push(supabase.from("requests").select("*")
          .eq("status", "pending").order("created_at"));
      }
      if (isAdmin) {
        requests.push(supabase.from("event_registrations").select("*").order("created_at", { ascending: false }));
      }
      const results = await Promise.all(requests);
      const [announcements, postHolders, faculty, members, alumni, gallery] =
        results.slice(0, 6).map(unwrap);
      const liveEvents = unwrap(results[6]);
      let resultIndex = 7;
      const pendingRequests = isReviewer ? unwrap(results[resultIndex++]) : [];
      const registrations = isAdmin ? unwrap(results[resultIndex]) : [];
      return {
        announcements,
        post_holders: postHolders,
        faculty,
        members,
        alumni,
        gallery,
        requests: pendingRequests,
        events: liveEvents,
        registrations,
      };
    },
    save: async (table, record, file) => {
      const payload = { ...record };
      if (file) {
        const path = `${table}/${crypto.randomUUID()}.jpg`;
        const maxDimension = table === "gallery" ? 1400
          : table === "events" ? 1800
            : ["faculty", "post_holders"].includes(table) ? 640
              : 800;
        unwrap(await supabase.storage.from("photos").upload(
          path,
          await compressImage(file, maxDimension),
          { contentType: "image/jpeg" },
        ));
        payload.photo_path = path;
      }
      const query = payload.id
        ? supabase.from(TABLES[table]).update(payload).eq("id", payload.id)
        : supabase.from(TABLES[table]).insert(payload);
      unwrap(await query);
    },
    migrateSitePhotos: async () => {
      if (role !== "admin") throw new Error("Admin access is required to move site photos.");
      const photoFiles = [...new Set(Object.values(images).map((path) => path.replace(/^img\//, "")))];
      for (const filename of photoFiles) {
        const response = await fetch(`/img/${filename}`);
        if (!response.ok) throw new Error(`Could not read existing photo: ${filename}`);
        const image = await compressImage(await response.blob(), 1800);
        const result = await supabase.storage.from("photos").upload(
          `site/${filename}`,
          image,
          { contentType: "image/jpeg", upsert: false },
        );
        if (result.error && String(result.error.statusCode) !== "409") throw result.error;
      }

      const photoReferences = [
        ["gallery", "photo_path"],
        ["faculty", "photo_path"],
        ["post_holders", "photo_path"],
        ["live_events", "poster_path"],
      ];
      for (const [table, column] of photoReferences) {
        const records = unwrap(await supabase.from(table).select(`id,${column}`).like(column, "img/%"));
        for (const item of records) {
          const filename = item[column].slice(4);
          if (!photoFiles.includes(filename)) continue;
          unwrap(await supabase.from(table).update({ [column]: `site/${filename}` }).eq("id", item.id));
        }
      }
      return photoFiles.length;
    },
    register: async (eventId, registration) => {
      const result = await supabase.from("event_registrations").insert({
        event_id: eventId,
        full_name: registration.full_name.trim(),
        email: registration.email.trim().toLowerCase(),
        phone: registration.phone.trim(),
      });
      if (result.error?.code === "23505") {
        throw new Error("This email is already registered for the event.");
      }
      unwrap(result);
    },
    remove: async (table, record) => {
      unwrap(await supabase.from(TABLES[table]).delete().eq("id", record.id));
      const photoPath = record.photo_path || (table === "events" ? record.poster_path : null);
      if (photoPath && !/^(img\/|site\/|data:|https?:)/.test(photoPath)) {
        const result = await supabase.storage.from("photos").remove([photoPath]);
        if (result.error) throw result.error;
      }
    },
    ask: async (request) => {
      unwrap(await supabase.from("requests").insert(request));
    },
    review: async (id, approved) => {
      unwrap(await supabase.rpc("approve_request", { req: id, ok: approved }));
    },
    resetGallery: async () => {
      throw new Error("Reset is only available in demo mode.");
    },
    notify: async (notice) => {
      if (!config.apiUrl) throw new Error("Set apiUrl in config.js to enable notifications.");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in before sending a notification.");
      const response = await fetch(`${config.apiUrl.replace(/\/$/, "")}/api/notifications/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notice),
      });
      if (!response.ok) throw new Error(await response.text() || "Notification delivery failed.");
      return response.json();
    },
    subscribe: async () => {
      if (!config.vapid) throw new Error("Set the public VAPID key in config.js first.");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("This browser does not support push notifications.");
      }
      if ((await Notification.requestPermission()) !== "granted") {
        throw new Error("Notifications are blocked.");
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription()
        || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapid(config.vapid),
        });
      const json = subscription.toJSON();
      const result = await supabase.from("push_subscriptions").insert({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      if (result.error?.code === "23505") return;
      unwrap(result);
    },
    profiles: async () => unwrap(await supabase.from("profiles")
      .select("*").order("created_at")),
    setRole: async (id, newRole) => unwrap(await supabase.from("profiles")
      .update({ role: newRole }).eq("id", id)),
    photoUrl: publicPhoto,
  };
}

function localImage(file) {
  return compressImage(file, 900).then((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  }));
}

function compressImage(file, maxDimension) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not decode image."));
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Image processing is unavailable."));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not compress image."));
        }, "image/jpeg", 0.82);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function decodeVapid(value) {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

const config = window.YFAC_CONFIG || {};
export const repository = config.url && config.anon
  ? createSupabaseRepository(config)
  : createLocalRepository();
export { images };
