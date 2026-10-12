import Link from "next/link";
import { Header, Footer, SectionLabel } from "@/components/ui";
export default function NotFound(){return <><Header/><main className="container content-page"><SectionLabel>404 · A LITTLE OFF THE MAP</SectionLabel><h1>The next big idea<br/>is <span className="gradient-text">somewhere else.</span></h1><p>This page could not be found.</p><Link className="button button-primary" style={{marginTop:25}} href="/">Back to BuildFest ↗</Link></main><Footer/></>;}
