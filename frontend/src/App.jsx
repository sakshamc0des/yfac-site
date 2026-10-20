import React, { useCallback, useEffect, useRef, useState } from "react";
import AdminPanel from "./components/AdminPanel.jsx";
import LiveEventsPage from "./components/LiveEventsPage.jsx";
import { StaticPage } from "./components/Pages.jsx";
import { Footer, Header, PageHero } from "./components/SiteShell.jsx";
import TeamPanel from "./components/TeamPanel.jsx";
import { images } from "./data/images.js";
import { repository } from "./data/repository.js";

const emptyData = {
  announcements: [],
  post_holders: [],
  faculty: [],
  members: [],
  alumni: [],
  requests: [],
  gallery: [],
  events: [],
  registrations: [],
};
const validPages = new Set([
  "home", "about", "initiatives", "events", "live-events", "team", "faculty", "gallery", "join", "contact", "admin",
]);

function currentRoute() {
  const parts = (location.hash || "#home").slice(1).split("/");
  const page = validPages.has(parts[0]) ? parts[0] : "home";
  return { page, tab: parts[1] || "" };
}

export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [data, setData] = useState(emptyData);
  const [role, setRole] = useState("visitor");
  const [toast, setToast] = useState("");
  const [edited, setEdited] = useState(null);
  const [introPhase, setIntroPhase] = useState("entering");
  const introTimers = useRef([]);

  const dismissIntro = useCallback(() => {
    introTimers.current.forEach(window.clearTimeout);
    setIntroPhase("leaving");
    introTimers.current = [window.setTimeout(() => setIntroPhase("done"), 500)];
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(""), 4000);
  }, []);

  const refresh = useCallback(async () => {
    const currentRole = await repository.getRole();
    setRole(currentRole);
    setData(await repository.load());
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const currentRole = await repository.getRole();
        if (!active) return;
        setRole(currentRole);
        setData(await repository.load());
        const next = sessionStorage.getItem("yfac_next");
        if (next && currentRole !== "visitor") {
          sessionStorage.removeItem("yfac_next");
          location.hash = next;
        }
      } catch (error) {
        if (active) notify(`Could not load site data: ${error.message}`);
      }
    }
    const updateRoute = () => {
      const nextRoute = currentRoute();
      setRoute(nextRoute);
      setEdited(null);
      if (nextRoute.page !== "home") window.scrollTo({ top: 0, behavior: "smooth" });
      refresh().catch((error) => notify(`Could not refresh site data: ${error.message}`));
    };
    initialize();
    window.addEventListener("hashchange", updateRoute);
    return () => {
      active = false;
      window.removeEventListener("hashchange", updateRoute);
    };
  }, [notify, refresh]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroPhase("done");
      return undefined;
    }
    introTimers.current = [
      window.setTimeout(() => setIntroPhase("leaving"), 2300),
      window.setTimeout(() => setIntroPhase("done"), 2850),
    ];
    return () => introTimers.current.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll(
      "main .section, main .page-hero, main .photo-grid, main .gallery-button, main .quote, main .live-event-card, main .empty-events, main .list-row, main .person, main .faculty-card, main .value-card, main .card-panel",
    );
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("motion-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("motion-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });

    targets.forEach((target, index) => {
      if (target.classList.contains("motion-visible")) return;
      target.classList.add("motion-reveal");
      target.style.setProperty("--motion-delay", `${Math.min(index % 5, 4) * 75}ms`);
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [route.page, route.tab, data]);

  const perform = useCallback(async (operation, successMessage) => {
    try {
      await operation();
      await refresh();
      if (successMessage) notify(successMessage);
    } catch (error) {
      notify(error.message || "Something went wrong.");
      throw error;
    }
  }, [notify, refresh]);

  const sendRequest = useCallback(async (request) => {
    await perform(() => repository.ask(request), "Sent. The team will review it.");
  }, [perform]);

  const registerForEvent = useCallback(async (eventId, registration) => {
    await perform(
      () => repository.register(eventId, registration),
      "Registration received! We’ll be in touch.",
    );
  }, [perform]);

  const handleAction = useCallback(async (table, record) => {
    if (table === "profiles") {
      try {
        return await repository.profiles();
      } catch (error) {
        notify(`Could not load accounts: ${error.message}`);
        throw error;
      }
    }
    if (table === "resetGallery") {
      return perform(() => repository.resetGallery(), "Original photos restored.");
    }
    if (table === "migrateSitePhotos") {
      return perform(() => repository.migrateSitePhotos(), "Existing site photos moved to Supabase Storage.");
    }
    if (record && !window.confirm("Remove this entry?")) return;
    return perform(() => repository.remove(table, record), "Removed.");
  }, [perform]);

  const handleReview = useCallback((id, approved) => perform(
    () => repository.review(id, approved),
    approved ? "Approved and listed." : "Request rejected.",
  ), [perform]);

  const handleRoleChange = useCallback((id, newRole) => perform(
    () => repository.setRole(id, newRole),
    "Role updated.",
  ), [perform]);

  const handleGoogleLogin = useCallback(() => {
    repository.signInWithGoogle().catch((error) => notify(error.message));
  }, [notify]);

  const handleLogout = useCallback(async () => {
    try {
      await repository.signOut();
      setRole("visitor");
      await refresh();
      notify("Signed out.");
    } catch (error) {
      notify(error.message);
    }
  }, [notify, refresh]);

  const handleSubmit = useCallback(async (kind, values, files = {}) => {
    if (kind === "login") {
      await perform(async () => {
        const nextRole = await repository.signIn(values.role, values.pin);
        setRole(nextRole);
      }, "Signed in.");
      return;
    }
    if (kind === "req") return sendRequest(values);
    if (role !== "admin") throw new Error("Only an admin can make this change.");

    if (kind === "ann") {
      const announcement = {
        type: values.type,
        title: values.title,
        txt: values.txt || "",
        link: values.link || "",
        active: true,
      };
      await perform(() => repository.save("announcements", announcement), "Announcement is live.");
      if (values.notify === "yes") {
        try {
          await repository.notify(announcement);
          notify("Live. Subscribers notified.");
        } catch (error) {
          notify(`Announcement is live, but notification delivery failed: ${error.message}`);
        }
      }
      return;
    }
    if (kind === "ph") {
      await perform(() => repository.save("post_holders", {
        role: values.role,
        name: values.name,
        year: values.year,
        pri: Number(values.pri) || 9,
        ...(values.id ? { id: values.id } : {}),
      }, files.photo), "Post holder saved.");
      setEdited(null);
      return;
    }
    if (kind === "fac") {
      await perform(() => repository.save("faculty", {
        name: values.name,
        post: values.post,
        descr: values.descr || "",
        pri: Number(values.pri) || 9,
        ...(values.id ? { id: values.id } : {}),
      }, files.photo), "Faculty details saved.");
      setEdited(null);
      return;
    }
    if (kind === "event") {
      await perform(() => repository.save("events", {
        title: values.title.trim(),
        description: values.description.trim(),
        event_date: values.event_date || null,
        venue: values.venue.trim(),
        published: values.published === "yes",
        registration_open: values.registration_open === "yes",
        ...(values.id ? { id: values.id } : {}),
      }, files.poster), values.id ? "Event updated." : "Event published.");
      setEdited(null);
      return;
    }
    if (kind === "madd") {
      await perform(() => repository.save("members", {
        name: values.name, dept: values.dept || "", year: values.year || "",
      }), "Member added.");
      return;
    }
    if (kind === "aadd") {
      await perform(() => repository.save("alumni", {
        name: values.name, batch: values.batch || "", org: values.org || "",
      }), "Alumnus added.");
      return;
    }
    if (kind === "gal") {
      const photos = files.photos || [];
      if (!photos.length) throw new Error("Choose at least one image.");
      await perform(async () => {
        for (const photo of photos) {
          await repository.save("gallery", { cap: values.cap || "YFAC moment" }, photo);
        }
      }, `${photos.length} photo${photos.length === 1 ? "" : "s"} added.`);
    }
  }, [perform, role, sendRequest]);

  const enableNotifications = useCallback(async () => {
    try {
      await repository.subscribe();
      notify("Notifications are on.");
      await refresh();
    } catch (error) {
      notify(error.message);
    }
  }, [notify, refresh]);

  const announcements = data.announcements.length > 0 && (
    <aside className="announcement-feed" aria-label="Live announcements">
      {data.announcements.map((announcement) => {
        const title = announcement.title?.trim();
        const type = announcement.type?.trim();
        const details = announcement.txt?.trim();
        const repeatedType = title?.toLocaleLowerCase() === type?.toLocaleLowerCase();
        const repeatedDetails = title?.toLocaleLowerCase() === details?.toLocaleLowerCase();
        return <article className="announcement-item" key={announcement.id}>
          <span className="announcement-live"><span aria-hidden="true" />LIVE</span>
          <div className="announcement-copy">
            {!repeatedType && type && <span className="announcement-type">{type}</span>}
            <h2>{title}</h2>
            {details && !repeatedDetails && <p>{details}</p>}
          </div>
          {/^https?:\/\//i.test(announcement.link || "") &&
            <a className="announcement-link" href={announcement.link} target="_blank" rel="noreferrer">Details <span aria-hidden="true">↗</span></a>}
        </article>;
      })}
    </aside>
  );

  const sitePhotoStyle = repository.photoUrl ? {
    "--site-home-image": `url("${repository.photoUrl(images.banyan)}")`,
    "--site-quote-image": `url("${repository.photoUrl(images.garba)}")`,
    "--site-values-image": `url("${repository.photoUrl(images.team)}")`,
  } : undefined;

  return <div className="app-shell" style={sitePhotoStyle}>
    {introPhase !== "done" && <div className={`intro-screen${introPhase === "leaving" ? " is-leaving" : ""}`} role="status" aria-label="Welcome to Youth For A Cause">
      <div className="intro-orbit intro-orbit-one" aria-hidden="true" />
      <div className="intro-orbit intro-orbit-two" aria-hidden="true" />
      <div className="intro-content">
        <span className="intro-mark" aria-hidden="true">✺</span>
        <span className="intro-kicker">JSS Group of Institutions</span>
        <h1 className="intro-title">Youth <i>For</i> A Cause</h1>
        <span className="intro-tagline">Not for fame. For impact.</span>
        <span className="intro-credit">Developed by <strong>Saksham Raghuvanshi</strong><span>CTC · Youth For A Cause</span></span>
        <span className="intro-progress" aria-hidden="true"><span /></span>
      </div>
      <button className="intro-skip" onClick={dismissIntro} type="button">Skip intro <span aria-hidden="true">↗</span></button>
    </div>}
    <Header page={route.page} />
    {announcements}
    {data.announcements.length > 0 && "Notification" in window && Notification.permission === "default" &&
      <div className="notification-banner"><div className="wrap"><span>Get alerts for new recruitments and events</span><button className="small-button" onClick={enableNotifications}>Enable notifications</button></div></div>}
    <main>
      {["home", "about", "initiatives", "events", "join", "contact"].includes(route.page)
        ? <StaticPage page={route.page} photoUrl={repository.photoUrl} />
        : route.page === "live-events"
          ? <LiveEventsPage events={data.events.filter((event) => event.published)} repository={repository} onRegister={registerForEvent} />
          : route.page === "team" || route.page === "faculty" || route.page === "gallery"
          ? <TeamPanel tab={route.page} data={data} repository={repository} onRequest={sendRequest} />
          : route.page === "admin"
            ? <AdminPanel
              role={role}
              live={repository.live}
              data={data}
              tab={route.tab}
              edited={edited}
              onAction={handleAction}
              onSubmit={handleSubmit}
              onEdit={(table, item) => { setEdited({ table, item }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              onCancel={() => setEdited(null)}
              onGoogle={handleGoogleLogin}
              onLogout={handleLogout}
              onReview={handleReview}
              onRoleChange={handleRoleChange}
              photoUrl={repository.photoUrl}
            />
            : <PageHero eyebrow="Youth For A Cause" title="Welcome." description="A student-led social initiative creating meaningful change." />}
    </main>
    <Footer onAlerts={enableNotifications} />
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
