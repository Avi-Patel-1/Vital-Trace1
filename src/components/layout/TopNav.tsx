import { NavLink } from "react-router-dom";

import { SignalWordmark } from "../branding/SignalWordmark";

const links = [
  { to: "/", label: "Home" },
  { to: "/studio", label: "Studio" },
  { to: "/review", label: "Review" },
  { to: "/batch", label: "Batch" },
  { to: "/synthetic", label: "Synthetic" },
  { to: "/cases", label: "Modes" }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 px-4 pb-3 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between rounded-full border border-white/[0.14] bg-[rgba(0,0,0,0.72)] px-4 py-3 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <NavLink to="/" className="min-w-0">
          <SignalWordmark compact />
        </NavLink>
        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm tracking-[0.18em] uppercase transition",
                  isActive
                    ? "border border-white/[0.12] bg-[rgba(210,76,116,0.24)] text-white"
                    : "text-white/[0.72] hover:bg-[rgba(210,76,116,0.1)] hover:text-white"
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/reports"
          className="rounded-full border border-white/[0.18] bg-gradient-to-r from-[rgba(210,76,116,0.92)] to-[rgba(133,57,83,0.96)] px-4 py-2 text-sm uppercase tracking-[0.18em] text-white transition hover:scale-[1.02]"
        >
          Reports
        </NavLink>
      </div>
    </header>
  );
}
