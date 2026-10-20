import React, { useState } from "react";
import { images } from "../data/images.js";
import { fallbackSitePhoto, PageHero } from "./SiteShell.jsx";

function eventPoster(event, repository) {
  if (!event.poster_path) return repository.photoUrl ? repository.photoUrl(images.fest) : images.fest;
  return repository.photoUrl ? repository.photoUrl(event.poster_path) : event.poster_path;
}

function RegistrationForm({ event, onRegister }) {
  const [sent, setSent] = useState(false);
  return <form className="registration-form" onSubmit={(submission) => {
    submission.preventDefault();
    const form = submission.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    Promise.resolve(onRegister(event.id, values)).then(() => {
      form.reset();
      setSent(true);
    }).catch(() => {});
  }}>
    <span className="mono">Reserve your place</span>
    <h3 className="serif">Register for this event</h3>
    {sent && <p className="registration-success" role="status">Registration received! We’ll be in touch.</p>}
    <label>Full name<input name="full_name" autoComplete="name" required maxLength="120" /></label>
    <label>Email address<input name="email" type="email" autoComplete="email" required maxLength="254" /></label>
    <label>Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength="32" /></label>
    <button className="button" type="submit">Register ↗</button>
    <small>Your contact details are only shared with the event organisers.</small>
  </form>;
}

export default function LiveEventsPage({ events, repository, onRegister }) {
  return <>
    <PageHero
      eyebrow="Upcoming at YFAC"
      title={<>Live <i>events.</i></>}
      description="See the latest event posters and reserve your place with the registration form."
      image={images.garba}
      photoUrl={repository.photoUrl}
    />
    <section className="section"><div className="wrap">
      {events.length
        ? <div className="live-event-list">{events.map((event) => (
          <article className="live-event-card" key={event.id}>
            <div className="event-poster"><img src={eventPoster(event, repository)} alt={`${event.title} poster`} onError={fallbackSitePhoto} /></div>
            <div className="event-information">
              <span className="mono">{event.event_date || "Date to be announced"}{event.venue ? ` · ${event.venue}` : ""}</span>
              <h2 className="serif">{event.title}</h2>
              <p className="muted event-description">{event.description}</p>
              {event.registration_open
                ? <RegistrationForm event={event} onRegister={onRegister} />
                : <p className="event-closed">Registration for this event is closed.</p>}
            </div>
          </article>
        ))}</div>
        : <div className="empty-events"><span className="mono">Nothing scheduled just yet</span><h2 className="serif">New events are <i>on the way.</i></h2><p className="muted">Check back soon for posters, event details and registration.</p></div>}
    </div></section>
  </>;
}
