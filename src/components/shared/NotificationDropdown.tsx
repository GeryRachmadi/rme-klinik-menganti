"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import {
  getRoleBasedNotifications,
  type NotificationItem,
} from "@/app/actions/notification";

const SESSION_KEY = "notif_read_ids";

function formatWIB(date: Date): string {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

interface NotificationDropdownProps {
  userRole: string;
}

export default function NotificationDropdown({ userRole }: NotificationDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen]           = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [readIds, setReadIds]         = useState<Set<string>>(new Set());

  // Load readIds from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setReadIds(new Set(JSON.parse(stored) as string[]));
    } catch {
      // sessionStorage unavailable — no-op
    }
  }, []);

  // Fetch every time dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoading(true);
    getRoleBasedNotifications(userRole).then((data) => {
      if (!cancelled) {
        setNotifications(data);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [isOpen, userRole]);

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  function handleNotificationClick(notif: NotificationItem) {
    const newReadIds = new Set(readIds);
    newReadIds.add(notif.id);
    setReadIds(newReadIds);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify([...newReadIds]));
    } catch {
      // sessionStorage unavailable — no-op
    }
    setIsOpen(false);
    router.push(notif.href);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={18} className="text-gray-500" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-800" style={{ fontFamily: "var(--font-poppins)" }}>
              Notifikasi
            </p>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-[#2BB5A0]">
                {unreadCount} belum dibaca
              </span>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                Memuat…
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                Tidak ada notifikasi baru.
              </p>
            ) : (
              <ul>
                {notifications.map((notif) => {
                  const isRead = readIds.has(notif.id);
                  return (
                    <li key={notif.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 flex gap-3 transition-colors hover:bg-gray-50 ${
                          isRead ? "opacity-50" : ""
                        }`}
                      >
                        {/* Teal accent bar for unread */}
                        <div
                          className={`flex-shrink-0 w-1 rounded-full self-stretch ${
                            isRead ? "bg-gray-200" : "bg-[#2BB5A0]"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-bold leading-snug ${
                              isRead ? "text-gray-400" : "text-gray-800"
                            }`}
                            style={{ fontFamily: "var(--font-poppins)" }}
                          >
                            {notif.title}
                          </p>
                          <p
                            className={`text-xs mt-0.5 leading-snug line-clamp-2 ${
                              isRead ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-1">
                            {formatWIB(new Date(notif.createdAt))} WIB
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
