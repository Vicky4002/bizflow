import Link from "next/link";

export default function Home() {
  return <main className="landing">
    <nav className="topbar"><Link className="brand" href="/">◈ BizFlow</Link><Link className="nav-link" href="/auth/sign-in">Sign in</Link></nav>
    <section className="hero">
      <div className="eyebrow">YOUR BUSINESS, IN SYNC</div>
      <h1>Less admin.<br/><span>More momentum.</span></h1>
      <p className="hero-copy">Keep customers, appointments, services and invoices together. A clear view of your day, without the busywork.</p>
      <Link className="primary-btn" href="/auth/sign-in">Get started <span>→</span></Link>
      <div className="hero-note">A simpler workspace for the work that matters.</div>
    </section>
    <section className="feature-strip">
      <article><b>01 / Customers</b><h3>Know your people</h3><p>Keep contact details and notes in one place.</p></article>
      <article><b>02 / Schedule</b><h3>Stay on top of today</h3><p>See upcoming appointments at a glance.</p></article>
      <article><b>03 / Invoices</b><h3>Keep money moving</h3><p>Track what you have collected and what is due.</p></article>
    </section>
    <footer className="landing-footer">© {new Date().getFullYear()} BizFlow</footer>
  </main>;
}