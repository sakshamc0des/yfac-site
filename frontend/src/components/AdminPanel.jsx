import React, { useState } from "react";
import { Photo, photoBackground } from "./SiteShell.jsx";
import { images } from "../data/images.js";

const adminTabs = [
  ["ann", "Live now"],
  ["events", "Live Events"],
  ["ph", "Post holders"],
  ["fac", "Faculty"],
  ["mem", "Members"],
  ["alu", "Alumni"],
  ["gal", "Gallery"],
  ["acc", "Access"],
];
const roles = ["visitor", "alumni", "member", "admin"];

function ignoreNotifiedFailure(operation) {
  Promise.resolve(operation).catch(() => {});
}

function Field({ label, name, value = "", type = "text", required = false, className = "", ...props }) {
  return <label className={className}>{label}<input name={name} defaultValue={value} type={type} required={required} {...props} /></label>;
}

function PanelForm({ children, onSubmit, className = "form-grid" }) {
  return <form className={className} onSubmit={(event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const files = Object.fromEntries([...form.querySelectorAll('input[type="file"]')]
      .map((input) => [input.name, input.multiple ? [...input.files] : input.files[0]]));
    Promise.resolve(onSubmit(values, files, form)).catch(() => {});
  }}>{children}</form>;
}

function EditableRows({ rows, fields, table, onEdit, onRemove, displayName }) {
  if (!rows.length) return <p className="muted">Nothing to show yet.</p>;
  return <div className="list">{rows.map((item) => <div className="list-row" key={item.id}>
    <b>{displayName(item)}</b>
    <span>{fields.map((field) => item[field]).filter(Boolean).join(" · ")}</span>
    <span className="admin-actions">
      {onEdit && <button className="small-button" onClick={() => onEdit(table, item)}>Edit</button>}
      <button className="small-button danger" onClick={() => ignoreNotifiedFailure(onRemove(table, item))}>Remove</button>
    </span>
  </div>)}</div>;
}

function PendingRequests({ kind, requests, onReview }) {
  const matching = requests.filter((request) => request.kind === kind);
  return <section><h3 className="serif">Pending requests</h3>
    {matching.length ? matching.map((request) => <div className="list-row" key={request.id}>
      <b>{request.name}</b>
      <span>{kind === "member" ? `${request.dept} · ${request.year}` : `${request.year} · ${request.org}`}<br />
        {request.contact && <>{request.contact}<br /></>}{request.msg && `“${request.msg}”`}
      </span>
      <span className="admin-actions">
        <button className="small-button" onClick={() => ignoreNotifiedFailure(onReview(request.id, true))}>Approve</button>
        <button className="small-button danger" onClick={() => ignoreNotifiedFailure(onReview(request.id, false))}>Reject</button>
      </span>
    </div>) : <p className="muted">No pending requests.</p>}
  </section>;
}

function LoginPanel({ live, onSubmit, onGoogle, onLogout }) {
  return <div className="card-panel">
    {live
      ? <><p className="muted">Sign in with the Google account the admin has approved.</p>
        <button className="button" onClick={onGoogle}>Sign in with Google</button>
        <button className="small-button" onClick={onLogout}>Switch account</button></>
      : <PanelForm onSubmit={(values) => onSubmit("login", values)}>
        <label>Role<select name="role"><option value="admin">Admin</option><option value="member">Member (alumni approvals)</option></select></label>
        <Field label="PIN" name="pin" type="password" required />
        <button className="button">Sign in</button>
      </PanelForm>}
  </div>;
}

export default function AdminPanel({
  role, live, data, edited, onAction, onSubmit, onEdit, onCancel,
  onGoogle, onLogout, onReview, onRoleChange, photoUrl,
}) {
  const [accountList, setAccountList] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const isAdmin = role === "admin";
  const canReview = isAdmin || role === "member";
  const activeTab = location.hash.split("/")[1] || (isAdmin ? "ann" : "alu");

  React.useEffect(() => {
    if (isAdmin && activeTab === "acc") {
      onAction("profiles", null, "Could not load accounts")
        .then(setAccountList)
        .catch(() => setAccountList([]));
    }
  }, [activeTab, isAdmin, onAction]);

  if (!canReview) {
    return <section className="section"><div className="wrap">
      <div className="page-hero" style={{ ...photoBackground(images.team, photoUrl), paddingInline: 0 }}><span className="mono">Admin</span><h1 className="serif">Control <i>room.</i></h1><p>Manage YFAC content, membership, announcements and the gallery.</p></div>
      <LoginPanel live={live} onSubmit={onSubmit} onGoogle={onGoogle} onLogout={onLogout} />
    </div></section>;
  }

  const visibleTabs = isAdmin ? adminTabs : [["alu", "Alumni"]];
  const pendingMembers = data.requests.filter((request) => request.kind === "member").length;
  const pendingAlumni = data.requests.filter((request) => request.kind === "alumni").length;
  const tabLabel = visibleTabs.find(([key]) => key === activeTab)?.[1] || "Alumni";
  const selectedEvent = data.events.find((event) => event.id === selectedEventId);
  const selectedEventRegistrations = data.registrations.filter((registration) => registration.event_id === selectedEventId);

  function submitForm(kind, values, files, form) {
    return onSubmit(kind, values, files).then(() => form.reset());
  }

  return <section className="section"><div className="wrap">
    <div className="page-hero" style={{ ...photoBackground(images.team, photoUrl), paddingInline: 0 }}><span className="mono">Admin</span><h1 className="serif">Control <i>room.</i></h1><p>Manage YFAC content, membership, announcements and the gallery.</p></div>
    <div className="admin-bar"><span className="mono">Signed in as {role}{live ? "" : " · demo mode, data stays in this browser"}</span><button className="small-button" onClick={onLogout}>Sign out</button></div>
    <div className="tabs">{visibleTabs.map(([key, label]) => <a className={`tab-link ${activeTab === key ? "active" : ""}`} href={`#admin/${key}`} key={key}>
      {label}{key === "mem" && pendingMembers ? ` ${pendingMembers}` : ""}{key === "alu" && pendingAlumni ? ` ${pendingAlumni}` : ""}
    </a>)}</div>
    <h2 className="serif">{tabLabel}</h2>

    {activeTab === "ann" && isAdmin && <>
      <PanelForm onSubmit={(values, files, form) => submitForm("ann", values, files, form)}>
        <label>Type<select name="type"><option>Recruitment</option><option>Event</option><option>Notice</option></select></label>
        <Field label="Title" name="title" required />
        <label className="full">Details<textarea name="txt" rows="2" /></label>
        <Field className="full" label="Link (form or Instagram post)" name="link" placeholder="https://" />
        <label className="full"><input type="checkbox" name="notify" value="yes" defaultChecked /> Notify subscribers</label>
        <button className="button">Go live</button>
      </PanelForm>
      <h3 className="serif">Live right now</h3>
      <EditableRows rows={data.announcements} fields={["type"]} table="announcements" onRemove={onAction} displayName={(item) => item.title} />
    </>}

    {activeTab === "events" && isAdmin && <>
      <p className="muted">Upload the event poster and add the details. Published events appear under Live Events with a registration form.</p>
      <PanelForm key={edited?.table === "events" ? edited.item.id : "event-new"} onSubmit={(values, files, form) => submitForm("event", values, files, form)}>
        {edited?.table === "events" && <input type="hidden" name="id" value={edited.item.id} />}
        <Field label="Event name" name="title" value={edited?.table === "events" ? edited.item.title : ""} required maxLength="160" />
        <Field label="Date" name="event_date" type="date" value={edited?.table === "events" ? edited.item.event_date || "" : ""} />
        <Field className="full" label="Venue" name="venue" value={edited?.table === "events" ? edited.item.venue || "" : ""} placeholder="Campus / location" />
        <label className="full">Event details<textarea name="description" rows="4" defaultValue={edited?.table === "events" ? edited.item.description || "" : ""} /></label>
        {edited?.table === "events" && edited.item.poster_path &&
          <div className="full"><Photo src={photoUrl ? photoUrl(edited.item.poster_path) : edited.item.poster_path} alt={`${edited.item.title} current poster`} caption="Current poster" /></div>}
        <label className="full">Poster image<input type="file" name="poster" accept="image/*" required={!edited} /></label>
        <label><input type="checkbox" name="published" value="yes" defaultChecked={edited?.table === "events" ? edited.item.published : true} /> Publish on Live Events page</label>
        <label><input type="checkbox" name="registration_open" value="yes" defaultChecked={edited?.table === "events" ? edited.item.registration_open : true} /> Accept registrations</label>
        <button className="button">{edited?.table === "events" ? "Save event" : "Publish event"}</button>
        {edited && <button type="button" className="small-button" onClick={onCancel}>Cancel</button>}
      </PanelForm>
      <div className="admin-event-list">
        {data.events.map((event) => {
          const registrationCount = data.registrations.filter((registration) => registration.event_id === event.id).length;
          return <article className="admin-event-row" key={event.id}>
            <Photo src={event.poster_path ? (photoUrl ? photoUrl(event.poster_path) : event.poster_path) : photoUrl ? photoUrl(images.fest) : images.fest} alt={`${event.title} poster`} />
            <div><span className="mono">{event.event_date || "Date to be announced"} · {event.published ? "Published" : "Draft"}</span>
              <h3 className="serif">{event.title}</h3><p className="muted">{event.venue}</p>
              <div className="admin-actions">
                <button className="small-button" onClick={() => setSelectedEventId(selectedEventId === event.id ? "" : event.id)}>
                  Registrations ({registrationCount})
                </button>
                <button className="small-button" onClick={() => onEdit("events", event)}>Edit</button>
                <button className="small-button danger" onClick={() => ignoreNotifiedFailure(onAction("events", event))}>Remove</button>
              </div>
            </div>
          </article>;
        })}
        {!data.events.length && <p className="muted">No events published yet. Upload your first poster above.</p>}
      </div>
      {selectedEvent && <section className="registrations-panel">
        <h3 className="serif">Registrations: {selectedEvent.title}</h3>
        {selectedEventRegistrations.length
          ? <div className="list">{selectedEventRegistrations.map((registration) => <div className="list-row" key={registration.id}>
            <b>{registration.full_name}</b><span>{registration.email}</span><span>{registration.phone}</span>
          </div>)}</div>
          : <p className="muted">No registrations for this event yet.</p>}
      </section>}
    </>}

    {activeTab === "ph" && isAdmin && <>
      <PanelForm key={edited?.id || "post-new"} onSubmit={(values, files, form) => submitForm("ph", values, files, form)}>
        {edited?.table === "post_holders" && <input type="hidden" name="id" value={edited.item.id} />}
        <Field label="Post" name="role" value={edited?.table === "post_holders" ? edited.item.role : ""} required placeholder="President" />
        <Field label="Name" name="name" value={edited?.table === "post_holders" ? edited.item.name : ""} required />
        <Field label="Term" name="year" value={edited?.table === "post_holders" ? edited.item.year : "2026-27"} />
        <Field label="Order" name="pri" type="number" value={edited?.table === "post_holders" ? edited.item.pri : 9} />
        <label className="full">Photo<input type="file" name="photo" accept="image/*" /></label>
        <button className="button">{edited?.table === "post_holders" ? "Save changes" : "Add post holder"}</button>
        {edited && <button type="button" className="small-button" onClick={onCancel}>Cancel</button>}
      </PanelForm>
      <EditableRows rows={data.post_holders} fields={["role", "year"]} table="post_holders" onEdit={onEdit} onRemove={onAction} displayName={(item) => item.name} />
    </>}

    {activeTab === "fac" && isAdmin && <>
      <PanelForm key={edited?.id || "faculty-new"} onSubmit={(values, files, form) => submitForm("fac", values, files, form)}>
        {edited?.table === "faculty" && <input type="hidden" name="id" value={edited.item.id} />}
        <Field label="Name" name="name" value={edited?.table === "faculty" ? edited.item.name : ""} required />
        <Field label="Post / designation" name="post" value={edited?.table === "faculty" ? edited.item.post : ""} required />
        <Field label="Order" name="pri" type="number" value={edited?.table === "faculty" ? edited.item.pri : 9} />
        <label className="full">Description<textarea name="descr" rows="4" defaultValue={edited?.table === "faculty" ? edited.item.descr : ""} /></label>
        <label className="full">Photo<input type="file" name="photo" accept="image/*" /></label>
        <button className="button">{edited?.table === "faculty" ? "Save changes" : "Add faculty"}</button>
        {edited && <button type="button" className="small-button" onClick={onCancel}>Cancel</button>}
      </PanelForm>
      <EditableRows rows={data.faculty} fields={["post"]} table="faculty" onEdit={onEdit} onRemove={onAction} displayName={(item) => item.name} />
    </>}

    {activeTab === "mem" && isAdmin && <>
      <PendingRequests kind="member" requests={data.requests} onReview={onReview} />
      <PanelForm onSubmit={(values, files, form) => submitForm("madd", values, files, form)}>
        <Field label="Name" name="name" required /><Field label="Department" name="dept" /><Field label="Year" name="year" />
        <button className="button">Add member</button>
      </PanelForm>
      <EditableRows rows={data.members} fields={["dept", "year"]} table="members" onRemove={onAction} displayName={(item) => item.name} />
    </>}

    {activeTab === "alu" && <>
      <PendingRequests kind="alumni" requests={data.requests} onReview={onReview} />
      {isAdmin && <PanelForm onSubmit={(values, files, form) => submitForm("aadd", values, files, form)}>
        <Field label="Name" name="name" required /><Field label="Batch" name="batch" /><Field label="Current role" name="org" />
        <button className="button">Add alumnus</button>
      </PanelForm>}
      {isAdmin && <EditableRows rows={data.alumni} fields={["batch", "org"]} table="alumni" onRemove={onAction} displayName={(item) => item.name} />}
    </>}

    {activeTab === "gal" && isAdmin && <>
      <PanelForm onSubmit={(values, files, form) => submitForm("gal", values, files, form)}>
        <label className="full">Photos<input type="file" name="photos" accept="image/*" multiple required /></label>
        <Field className="full" label="Caption" name="cap" placeholder="Event name" />
        <button className="button">Upload photos</button>
      </PanelForm>
      {live && <button className="small-button" onClick={() => ignoreNotifiedFailure(onAction("migrateSitePhotos"))}>
        Move existing site photos into Supabase Storage
      </button>}
      {!live && <button className="small-button" onClick={() => ignoreNotifiedFailure(onAction("resetGallery"))}>Restore original photos</button>}
      <div className="photo-grid">{data.gallery.map((photo) => <div className="card-panel" key={photo.id}>
        <Photo src={photo.photo_path ? (photoUrl ? photoUrl(photo.photo_path) : photo.photo_path) : photoUrl ? photoUrl(`/img/${photo.key}.jpg`) : `/img/${photo.key}.jpg`} alt={photo.cap} caption={photo.cap} />
        <button className="small-button danger" onClick={() => ignoreNotifiedFailure(onAction("gallery", photo))}>Remove</button>
      </div>)}</div>
    </>}

    {activeTab === "acc" && isAdmin && <>
      <p className="muted">Members can approve alumni requests; admins can manage all content and user roles.</p>
      {accountList.length ? <div className="list">{accountList.map((account) => <div className="list-row" key={account.id}>
        <b>{account.name || account.email}</b><span>{account.email}</span>
        <select value={account.role} onChange={(event) => ignoreNotifiedFailure(onRoleChange(account.id, event.target.value))}>
          {roles.map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>)}</div> : <p className="muted">No signed-in accounts found.</p>}
    </>}
  </div></section>;
}
