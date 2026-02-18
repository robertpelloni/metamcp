"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DocsNav({ groups }: { groups: any[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {groups.map((group, i) => (
        <div key={i}>
          <h3 className="font-semibold mb-2 px-2 text-sm text-foreground">{group.group}</h3>
          <div className="space-y-1">
            {group.pages.map((page: string) => {
              const href = `/docs/${page}`;
              const isActive = pathname === href;

              // Format label: "en/concepts/mcp-servers" -> "Mcp Servers"
              // But maybe we can do better. For now, simple format.
              const parts = page.split("/");
              const name = parts[parts.length - 1] || "";
              const label = name.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

              return (
                <Link
                  key={page}
                  href={href}
                  className={cn(
                    "block px-2 py-1.5 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
