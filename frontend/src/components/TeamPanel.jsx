import React, { useEffect, useState } from "react";
import { defaultGallery, images } from "../data/images.js";
import { fallbackSitePhoto, Photo, photoBackground } from "./SiteShell.jsx";

const teamTabs = [
  ["ph", "Post holders"],
  ["mem", "Members"],
  ["alu", "Alumni"],
];

function publicPhoto(item, repository) {
  if (item.photo_path) return repository.photoUrl ? repository.photoUrl(item.photo_path) : item.photo_path;
  const path = item.key ? images[item.key] : "";
  return path && repository.photoUrl ? repository.photoUrl(path) : path;
}

function RequestForm({ kind, onSubmit }) {
  const isMember = kind === "member";
  return <details className="card-panel" style={{ marginTop: "2rem" }}>
    <summary>{isMember ? "I am a current member, add my details" : "I am an alumnus, add me to the list"}</summary>
    <form className="form-grid" onSubmit={(event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      const request = onSubmit({
        kind,
        name: values.name,
        dept: values.dept || "",
        year: values.year || "",
        org: values.org || "",
        contact: values.contact || "",
        msg: values.msg || "",
      });
      Promise.resolve(request).then(() => form.reset()).catch(() => {});
    }}>
      <label>Full name<input name="name" required /></label>
      {isMember
        ? <><label>Department<input name="dept" required /></label><label>Year of study<input name="year" /></label></>
        : <><label>Batch (passing year)<input name="year" required /></label><label>Current role / organisation<input name="org" /></label></>}
      <label>Email or phone (never shown publicly)<input name="contact" /></label>
      <label className="full">Message for the team<textarea name="msg" rows="2" /></label>
      <button className="button" type="submit">Send for approval</button>
    </form>
  </details>;
}

function PeopleList({ people, first, second }) {
  return people.length
    ? <div className="list">{people.map((person) => <div className="list-row" key={person.id}>
      <b>{person.name}</b><span>{person[first] || ""}</span><span>{person[second] || ""}</span>
    </div>)}</div>
    : <p className="muted">Nobody listed yet.</p>;
}

export default function TeamPanel({ data, tab, repository, onRequest }) {
  const [zoomedIndex, setZoomedIndex] = useState(-1);
  const sortedHolders = [...data.post_holders].sort((a, b) => a.pri - b.pri);
  const sortedFaculty = [...data.faculty].sort((a, b) => a.pri - b.pri);
  const gallery = data.gallery.length ? data.gallery : defaultGallery;
  const zoomed = zoomedIndex >= 0 ? gallery[zoomedIndex] : null;

  useEffect(() => {
    if (!zoomed) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const galleryItems = data.gallery.length ? data.gallery : defaultGallery;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setZoomedIndex(-1);
      if (event.key === "ArrowRight") setZoomedIndex((index) => (index + 1) % galleryItems.length);
      if (event.key === "ArrowLeft") setZoomedIndex((index) => (index - 1 + galleryItems.length) % galleryItems.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [data.gallery, zoomed]);

  return <section className="section">
    <div className="wrap">
      {tab === "faculty" && <>
        <div className="page-hero" style={{ ...photoBackground(images.team, repository.photoUrl), paddingInline: 0 }}>
          <span className="mono">Faculty</span><h1 className="serif">Guidance that <i>moves us forward.</i></h1>
          <p>Meet the faculty members who support and guide Youth For A Cause.</p>
        </div>
        <div className="faculty-grid">{sortedFaculty.map((person) => <article className="faculty-card" key={person.id}>
          <Photo src={publicPhoto(person, repository) || (repository.photoUrl ? repository.photoUrl(images.team) : images.team)} alt={person.name} />
          <div><span className="mono">{person.post}</span><h2 className="serif">{person.name}</h2><p className="muted">{person.descr}</p></div>
        </article>)}</div>
        {!sortedFaculty.length && <p className="muted">Faculty details will be added soon.</p>}
      </>}
      {tab === "team" && <>
        <div className="page-hero" style={{ ...photoBackground(images.team, repository.photoUrl), paddingInline: 0 }}>
          <span className="mono">Team</span><h1 className="serif">The people <i>behind YFAC.</i></h1>
          <p>The post holders leading YFAC this year, our current members, and the alumni who built the society.</p>
        </div>
        <div className="tabs">{teamTabs.map(([id, title]) =>
          <a className={`tab-link ${location.hash === `#team/${id}` ? "active" : ""}`} href={`#team/${id}`} key={id}>{title}</a>,
        )}</div>
        {location.hash.split("/")[1] === "mem" ? <>
          <span className="mono">Current members</span><PeopleList people={data.members} first="dept" second="year" />
          <RequestForm kind="member" onSubmit={onRequest} />
        </> : location.hash.split("/")[1] === "alu" ? <>
          <span className="mono">Our alumni</span><PeopleList people={data.alumni} first="batch" second="org" />
          <RequestForm kind="alumni" onSubmit={onRequest} />
        </> : <>
          <span className="mono">Current post holders</span>
          {sortedHolders.length
            ? <div className="team-grid">{sortedHolders.map((person) => <article className="person" key={person.id}>
              {person.photo_path
                ? <img src={publicPhoto(person, repository)} alt={person.name} loading="lazy" onError={fallbackSitePhoto} />
                : <div className="avatar">{person.name?.charAt(0) || "?"}</div>}
              <h3>{person.name}</h3><p>{person.role}{person.year ? ` · ${person.year}` : ""}</p>
            </article>)}</div>
            : <p className="muted">Post holders will be announced soon.</p>}
        </>}
      </>}
      {tab === "gallery" && <>
        <div className="page-hero gallery-hero" style={{ ...photoBackground(images.garba, repository.photoUrl), paddingInline: 0 }}>
          <span className="mono">Our memories · {gallery.length} moments</span>
          <h1 className="serif">Moments that <i>matter.</i></h1>
          <p>From NGO visits and art sessions to marathons and Garba nights. A look at life at YFAC.</p>
          <a className="gallery-explore" href="#gallery-grid">Explore the photos <span aria-hidden="true">↓</span></a>
        </div>
        <div className="gallery-heading" id="gallery-grid">
          <div><span className="mono">The YFAC story</span><h2 className="serif">Life, <i>together.</i></h2></div>
          <p>{gallery.length} photos <span aria-hidden="true">·</span> Select any photo to view it larger</p>
        </div>
        <div className="gallery-grid">{gallery.map((item, index) => {
          const src = publicPhoto(item, repository);
          return <button className="gallery-button" key={item.id} onClick={() => setZoomedIndex(index)} aria-label={`View ${item.cap}`} type="button">
            <Photo src={src} alt={item.cap} caption={item.cap} />
            <span className="gallery-zoom" aria-hidden="true">↗</span>
          </button>;
        })}</div>
      </>}
      {zoomed && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Photo: ${zoomed.cap}`} onClick={(event) => {
        if (event.target === event.currentTarget) setZoomedIndex(-1);
      }}>
        <button className="lightbox-close" onClick={() => setZoomedIndex(-1)} aria-label="Close image" type="button">×</button>
        <button className="lightbox-nav lightbox-previous" onClick={() => setZoomedIndex((index) => (index - 1 + gallery.length) % gallery.length)} aria-label="Previous photo" type="button">‹</button>
        <figure className="lightbox-figure">
          <img key={zoomed.id} src={publicPhoto(zoomed, repository)} alt={zoomed.cap} onError={fallbackSitePhoto} />
          <figcaption><span>{zoomed.cap}</span><span>{zoomedIndex + 1} / {gallery.length}</span></figcaption>
        </figure>
        <button className="lightbox-nav lightbox-next" onClick={() => setZoomedIndex((index) => (index + 1) % gallery.length)} aria-label="Next photo" type="button">›</button>
        <span className="lightbox-hint">Use ← → to browse · Esc to close</span>
      </div>}
    </div>
  </section>;
}
