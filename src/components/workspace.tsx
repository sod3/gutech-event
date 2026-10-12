"use client";
import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles, type LucideIcon } from "lucide-react";
import { Brand, LogoutButton } from "./ui";
export type WorkspaceTab = {
  id: string;
  title: string;
  icon: LucideIcon;
  count?: number;
};
export function Workspace({
  title,
  name,
  tabs,
  active,
  onTab,
  children,
}: {
  title: string;
  name: string;
  tabs: WorkspaceTab[];
  active: string;
  onTab: (s: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <Brand />
        <div className="workspace-label">{title}</div>
        <nav className="workspace-nav" aria-label={`${title} navigation`}>
          {tabs.map((t) => (
            <button
              className={active === t.id ? "active" : ""}
              key={t.id}
              onClick={() => onTab(t.id)}
            >
              <t.icon size={16} />
              {t.title}
              {t.count !== undefined && t.count > 0 && (
                <span className="nav-count">{t.count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-event">
            <Sparkles size={21} />
            <h4>Build something that matters.</h4>
            <p>
              One idea. Three minds.
              <br />
              Endless possibilities.
            </p>
            <Link
              className="text-link"
              style={{ fontSize: 12, marginTop: 12 }}
              href="/"
            >
              Visit event website <ArrowUpRight size={11} />
            </Link>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="workspace-main">
        <div className="workspace-topbar">
          <span>
            BuildFest 2026 <span style={{ margin: "0 6px" }}>/</span>{" "}
            {tabs.find((t) => t.id === active)?.title}
          </span>
          <div>
            <span className="avatar">
              {name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </span>
            <span>{name}</span>
            <div className="topbar-logout">
              <LogoutButton />
            </div>
          </div>
        </div>
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
