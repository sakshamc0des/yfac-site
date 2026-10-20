import React, { useState } from "react";
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
  const [zoomed, setZoomed] = useState("");
  const sortedHolders = [...data.post_holders].sort((a, b) => a.pri - b.pri);
  const sortedFaculty = [...data.faculty].sort((a, b) => a.pri - b.pri);
  const gallery = data.gallery.length ? data.gallery : defaultGallery;

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
        <div className="page-hero" style={{ ...photoBackground(images.garba, repository.photoUrl), paddingInline: 0 }}><span className="mono">Gallery</span><h1 className="serif">Moments that <i>matter.</i></h1><p>From NGO visits and art sessions to marathons and Garba nights. A look at life at YFAC.</p></div>
        <div className="photo-grid">{gallery.map((item) => {
          const src = publicPhoto(item, repository);
          return <button className="gallery-button" key={item.id} onClick={() => setZoomed(src)} aria-label={`Enlarge ${item.cap}`}>
            <Photo src={src} alt={item.cap} caption={item.cap} />
          </button>;
        })}</div>
      </>}
      {zoomed && <button className="lightbox" onClick={() => setZoomed("")} aria-label="Close image">
        <img src={zoomed} alt="Enlarged gallery item" />
      </button>}
    </div>
  </section>;
}
