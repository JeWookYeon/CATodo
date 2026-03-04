"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/crud", label: "CRUD" },
  { href: "/lotto", label: "로또" },
  { href: "/stats", label: "통계" },
  { href: "/gold", label: "금시세" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        borderRight: "1px solid #eee",
        padding: "16px 12px",
        background: "white",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 12 }}>MINI-CRUD</div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: active ? "black" : "#666",
                background: active ? "#f3f4f6" : "transparent",
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}