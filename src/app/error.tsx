"use client";
import Link from "next/link";
import { Header, Footer } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <>
      <Header />
      <main className="container content-page">
        <h1>
          A brief pause.
          <br />
          <span className="gradient-text">Your idea is safe.</span>
        </h1>
        <p>We couldn’t load this page. Please retry in a moment.</p>
        <div style={{ display: "flex", gap: 15, marginTop: 25 }}>
          <button className="button button-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="button button-secondary">
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
