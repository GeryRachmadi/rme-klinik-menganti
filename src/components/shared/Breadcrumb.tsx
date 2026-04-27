import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="col-span-12 flex items-center gap-1.5 px-2"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                size={14}
                strokeWidth={2.5}
                className="text-gray-300 flex-shrink-0"
              />
            )}
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="text-sm text-[#2BB5A0] font-medium hover:underline"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-sm font-medium ${isLast ? "text-gray-500" : "text-[#2BB5A0]"}`}
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
