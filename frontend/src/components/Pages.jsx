import React from "react";
import { images } from "../data/images.js";
import { PageHero, Photo, SectionHeading } from "./SiteShell.jsx";

const imagesFor = (keys, photoUrl) => keys.map((key) => ({
  src: photoUrl ? photoUrl(images[key]) : images[key],
  caption: {
    nirb: "Nirbhed Foundation visit",
    teach: "Working with children",
    draw: "Drawing together",
    team: "The YFAC family",
    garba: "Garba Eve",
    garbap: "Garba Eve",
    run: "Zone Mile",
    art1: "Festooning workshop",
    mural: "Mural painting",
    fest: "Festooning crew",
    recruit: "Recruitment drive",
    lunch: "Team lunch",
    paint1: "Art session",
    class1: "Recruitment drive, classroom visit",
    class2: "Recruitment drive, classroom visit",
    ladder: "Mural painting",
  }[key] || key,
}));

function PhotoGrid({ keys, photoUrl }) {
  return <div className="photo-grid">{imagesFor(keys, photoUrl).map((photo, index) =>
    <Photo key={`${photo.src}-${index}`} {...photo} alt={photo.caption} rotate={index % 2 ? 1.3 : -1.3} />,
  )}</div>;
}

function HomePage({ photoUrl }) {
  return <div className="home-page">
    <section className="hero">
      <div className="wrap hero-content">
        <span className="mono">Youth For A Cause · JSS Group of Institutions</span>
        <h1 className="serif">Turning <i>Compassion</i> into Action.</h1>
        <p>A student-led social initiative driven by the belief that young people have the power to create meaningful change, bridging the gap between caring about social issues and taking action.</p>
        <div className="hero-actions"><a className="button" href="#initiatives">Explore initiatives ↗</a><a className="button outline" href="#events">View events</a></div>
      </div>
    </section>
    <div className="ticker" aria-label="Not for fame, for impact. Small acts, collective effort. Be a part of YFAC.">
      <div className="ticker-track" aria-hidden="true">
        <span>Not for fame, for impact ✦ Small acts, collective effort ✦ Be a part of YFAC ✦</span>
        <span>Not for fame, for impact ✦ Small acts, collective effort ✦ Be a part of YFAC ✦</span>
      </div>
    </div>
    <section className="section"><div className="wrap two-col">
      <div><span className="mono">01 — Who we are</span><h2 className="section-title serif">Small acts. <i>Collective effort.</i></h2></div>
      <div className="muted"><p>We believe change begins with small acts of kindness, collective effort, and a willingness to make a difference. Through social drives, community outreach and creative initiatives, we encourage students to step beyond classrooms.</p><p>YFAC is more than a student society. It is a community that brings people together to create change, build connections, and make every effort count.</p><a className="button outline" href="#about">Our story</a></div>
    </div></section>
    <section className="section"><div className="wrap">
      <SectionHeading eyebrow="03 — Moments">Impact, <i>in frames</i></SectionHeading>
      <PhotoGrid keys={["nirb", "garbap", "run"]} photoUrl={photoUrl} /><p style={{ marginTop: "2rem" }}><a className="button outline" href="#gallery">Open the gallery</a></p>
    </div></section>
    <div className="quote serif">Not for fame, <i>for impact.</i></div>
    <section className="section"><div className="wrap">
      <SectionHeading eyebrow="Be a part of YFAC">Ready to make every <i>effort count?</i></SectionHeading>
      <a className="button" href="#join">Join the family ↗</a>
    </div></section>
  </div>;
}

function AboutPage({ photoUrl }) {
  const values = [
    ["Empathy", "Listen first. Meet every person and community with care."],
    ["Integrity", "Be honest, keep our word, and do the right thing."],
    ["Unity", "Bring our different strengths together and act as one."],
    ["Mutual respect", "Value every person, perspective, and contribution."],
    ["Meaningful participation", "Choose genuine effort and lasting impact over recognition."],
  ];

  return <>
    <PageHero image={images.team} photoUrl={photoUrl} eyebrow="About" title={<>More than a <i>society.</i></>} description="A community that brings people together to create change, build connections, and make every effort count." />
    <section className="section"><div className="wrap">
      <div className="two-col"><p className="serif" style={{ fontSize: "2rem" }}>We aim to bridge the gap between <i>caring</i> about social issues and <i>taking action</i> to address them.</p>
        <div className="muted"><p>Youth For A Cause (YFAC) is a student-led social initiative at JSS Group of Institutions, driven by the belief that young people have the power to create meaningful change.</p><p>Through social drives, community outreach and creative initiatives, we encourage students to step beyond classrooms and contribute to a more compassionate and responsible society.</p></div>
      </div>
      <div style={{ maxWidth: 900, margin: "4rem auto" }}><Photo src={photoUrl ? photoUrl(images.team) : images.team} alt="YFAC family" caption="The YFAC family" /></div>
    </div></section>
    <section className="values-section">
      <div className="wrap values-content">
        <div className="values-heading">
          <div><span className="mono">The heart of YFAC</span><h2 className="serif">What we <i>stand for.</i></h2></div>
          <p>These are more than words. They shape how we show up, work together, and make a difference.</p>
        </div>
        <div className="values-grid">{values.map(([title, description], index) =>
          <article className="value-card" key={title}>
            <span className="value-number">0{index + 1}</span>
            <span className="value-rule" aria-hidden="true" />
            <h3 className="serif">{title}</h3>
            <p>{description}</p>
          </article>,
        )}</div>
      </div>
    </section>
  </>;
}

function InitiativesPage({ photoUrl }) {
  return <>
    <PageHero image={images.nirb} photoUrl={photoUrl} eyebrow="Initiatives" title={<>What we <i>do.</i></>} description="Two strands of work, one purpose: students stepping beyond the classroom." />
    <section className="section"><div className="wrap">
      <PhotoGrid keys={["nirb", "teach", "draw"]} photoUrl={photoUrl} />
      <div className="two-col section"><div><span className="mono">01</span><h2 className="section-title serif">Social outreach and community development</h2></div><div className="muted"><p>We organize and participate in initiatives that create meaningful impact beyond campus, giving students the chance to engage with communities and contribute to a better environment.</p><ul><li>NGO visits and collaborations</li><li>Tree plantation drives</li><li>Renovation projects</li><li>Community service activities</li></ul></div></div>
      <div className="two-col"><div><span className="mono">02</span><h2 className="section-title serif">Creative and cultural engagement</h2></div><p className="muted">Through artistic activities, collaborative projects and campus initiatives, students express themselves while building teamwork, leadership and a sense of belonging.</p></div>
      <div style={{ marginTop: "3rem" }}><PhotoGrid keys={["mural", "fest", "ladder"]} photoUrl={photoUrl} /></div>
    </div></section>
  </>;
}

function EventsPage({ photoUrl }) {
  const events = [
    ["Pot Graffiti", "Teams transform their designated pots with colourful artwork and imaginative designs."],
    ["Treasure Valley", "A treasure hunt testing observation, teamwork and problem-solving."],
    ["Lifestyle Puzzles", "A challenge that encourages participants to think logically and work together."],
    ["Beyblade", "A competitive and entertaining event of friendly battles."],
    ["React Rumble", "An orientation competition with questions across topics and audience likes."],
    ["Zone Mile: Run for a Cause", "A campus run where students come together for a cause."],
  ];
  return <>
    <PageHero image={images.run} photoUrl={photoUrl} eyebrow="Events and competitions" title={<>Play with a <i>purpose.</i></>} description="Team-based events that combine creativity, problem-solving, knowledge and friendly competition." />
    <section className="section"><div className="wrap"><PhotoGrid keys={["run", "garba", "art1"]} photoUrl={photoUrl} />
      <div className="list" style={{ marginTop: "3rem" }}>{events.map(([name, details], index) =>
        <div className="list-row" key={name}><span className="mono">0{index + 1}</span><h3 className="serif">{name}</h3><p className="muted">{details}</p></div>,
      )}</div>
      <p className="muted" style={{ maxWidth: 700, marginTop: "2rem" }}>These events help students connect, discover their strengths, and experience teamwork alongside the social purpose that defines YFAC.</p>
      <div className="live-events-callout">
        <div><span className="mono">Upcoming at YFAC</span><h2 className="serif">See what’s <i>live now.</i></h2><p className="muted">Browse current event posters and register for an upcoming event.</p></div>
        <a className="button" href="#live-events">View live events ↗</a>
      </div>
    </div></section>
  </>;
}

function JoinPage({ photoUrl }) {
  return <>
    <PageHero image={images.fest} photoUrl={photoUrl} eyebrow="Recruitment" title={<>Join the <i>family.</i></>} description="We welcome students who are eager to learn, contribute, collaborate and turn their ideas into action." />
    <section className="section"><div className="wrap">
      <SectionHeading eyebrow="Departments">Different skills, <i>one team.</i></SectionHeading>
      <div className="team-grid">{["Design and Social Media", "Art and Festooning", "Management", "Editorial"].map((name, index) => <div className="card-panel" key={name}><span className="mono">0{index + 1}</span><h3 className="serif">{name}</h3></div>)}</div>
      <div style={{ marginTop: "3rem" }}><PhotoGrid keys={["recruit", "lunch", "paint1", "class1", "class2"]} photoUrl={photoUrl} /></div>
      <div className="section"><SectionHeading eyebrow="How it works">Three steps to <i>get involved.</i></SectionHeading><div className="team-grid">{[["Follow our updates", "Dates, mode and timings for each cycle are announced on Instagram."], ["Aptitude test", "The first round is usually conducted online."], ["Personal interview", "Meet the team and tell us what you want to change."]].map(([title, text], index) => <div key={title}><span className="mono">Step 0{index + 1}</span><h3 className="serif">{title}</h3><p className="muted">{text}</p></div>)}</div></div>
    </div></section>
    <div className="quote serif">Not for fame, <i>for impact.</i><div><a className="button" href="https://www.instagram.com/yfacjssaten" target="_blank" rel="noreferrer">Follow @yfacjssaten ↗</a></div></div>
  </>;
}

function ContactPage({ photoUrl }) {
  return <>
    <PageHero image={images.banyan} photoUrl={photoUrl} eyebrow="Contact" title={<>Let’s <i>talk.</i></>} description="Questions, collaborations or NGO partnerships? Reach out to us." />
    <section className="section"><div className="wrap two-col">
      <div><span className="mono">Instagram</span><p className="serif" style={{ fontSize: "2rem" }}><i>@yfacjssaten</i></p><a className="button" href="https://www.instagram.com/yfacjssaten" target="_blank" rel="noreferrer">Message us ↗</a></div>
      <div><span className="mono">Find us</span><p className="serif" style={{ fontSize: "2rem" }}>Youth For A Cause,<br />JSS Group of Institutions</p><p className="muted">The fastest way to reach the team is a direct message on Instagram.</p></div>
    </div></section>
  </>;
}

export function StaticPage({ page, photoUrl }) {
  switch (page) {
    case "home": return <HomePage photoUrl={photoUrl} />;
    case "about": return <AboutPage photoUrl={photoUrl} />;
    case "initiatives": return <InitiativesPage photoUrl={photoUrl} />;
    case "events": return <EventsPage photoUrl={photoUrl} />;
    case "join": return <JoinPage photoUrl={photoUrl} />;
    case "contact": return <ContactPage photoUrl={photoUrl} />;
    default: return null;
  }
}

export { PhotoGrid };
