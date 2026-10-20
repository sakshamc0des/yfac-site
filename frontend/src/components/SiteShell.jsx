import React, { useEffect, useState } from "react";

const links = [
  ["about", "About"],
  ["initiatives", "Initiatives"],
  ["events", "Events"],
  ["live-events", "Live Events"],
  ["team", "Team"],
  ["faculty", "Faculty"],
  ["gallery", "Gallery"],
  ["join", "Join"],
  ["contact", "Contact"],
];

export function photoBackground(path, photoUrl) {
  const image = photoUrl ? photoUrl(path) : path;
  const filename = path.replace(/^img\//, "");
  return {
    "--page-image": `url("${image}")`,
    "--page-fallback": `url("/img/${filename}")`,
  };
}

export function fallbackSitePhoto(event) {
  const image = event.currentTarget;
  const match = image.src.match(/\/site\/([^/?#]+)(?:[?#]|$)/);
  if (match && !image.dataset.fallback) {
    image.dataset.fallback = "true";
    image.src = `/img/${match[1]}`;
  }
}

export function Header({ page }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [page]);

  return (
    <header className="site-header">
      <div className="wrap nav">
        <a className="brand" href="#home">
          <span className="brand-mark" aria-hidden="true">✺</span>
          <span><b>Youth For A Cause</b><small>JSS GROUP OF INSTITUTIONS</small></span>
        </a>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>
        <nav id="main-navigation" className={`nav-links${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {links.map(([id, label]) => (
            <a className={page === id ? "active" : ""} href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a className="nav-pill" href="https://www.instagram.com/yfacjssaten" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
            @yfacjssaten
          </a>
        </nav>
      </div>
    </header>
  );
}

export function PageHero({ eyebrow, title, description, image, photoUrl }) {
  return (
    <div className="page-hero" style={image ? photoBackground(image, photoUrl) : undefined}>
      <div className="wrap">
        <span className="mono">{eyebrow}</span>
        <h1 className="serif">{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, children }) {
  return <><span className="mono">{eyebrow}</span><h2 className="section-title serif">{children}</h2></>;
}

export function Photo({ src, alt, caption, rotate = -1 }) {
  return (
    <figure className="photo-card" style={{ "--rotate": `${rotate}deg` }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={fallbackSitePhoto}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Footer({ onAlerts }) {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✺</span>
          <span><b>Youth For A Cause</b><small>NOT FOR FAME, FOR IMPACT</small></span>
        </div>
        <div><h4>Explore</h4>{links.slice(0, 5).map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</div>
        <div>
          <h4>Connect</h4>
          <a href="#join">Join YFAC</a><a href="#contact">Contact</a><a href="#admin">Admin</a>
          <a href="#notifications" onClick={(event) => { event.preventDefault(); onAlerts(); }}>Get notifications</a>
          <a href="https://www.instagram.com/yfacjssaten" target="_blank" rel="noreferrer">Instagram</a>
        </div>
        <div className="copyright">© Youth For A Cause · JSS Group of Institutions</div>
      </div>
    </footer>
  );
}
