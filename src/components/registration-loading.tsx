import { Brand } from "./ui";

export function RegistrationLoading() {
  return (
    <main className="leap-registration" aria-busy="true">
      <aside className="leap-registration-aside">
        <Brand />
      </aside>
      <section className="leap-registration-main">
        <div className="leap-form-wrap application-loading">
          <div className="leap-form-heading" role="status">
            <span>LEAP 3 · STARTUP APPLICATION</span>
            <h2>Tell us about your startup.</h2>
            <p>Preparing your application…</p>
          </div>
          <div className="application-skeleton" aria-hidden="true">
            <div className="form-grid">
              <div />
              <div />
            </div>
            <div className="application-skeleton-description" />
            <div className="application-skeleton-upload" />
          </div>
        </div>
      </section>
    </main>
  );
}
