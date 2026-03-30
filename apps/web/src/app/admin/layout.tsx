"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { isAuthenticated, clearToken } from "@/lib/admin-api";

const SIDEBAR_ITEMS = [
  { href: "/admin/dashboard", label: "대시보드", icon: "📊" },
  { href: "/admin/teams", label: "팀 관리", icon: "👥" },
  { href: "/admin/seasons", label: "시즌 관리", icon: "🗓️" },
  { href: "/admin/game-events", label: "게임 이벤트", icon: "🎮" },
  { href: "/admin/moderation", label: "응원 관리", icon: "🛡️" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
  { href: "/admin/analytics", label: "분석", icon: "📈" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname !== "/admin/login" && !isAuthenticated()) {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  // 로그인 페이지는 레이아웃 없이
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted || !isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-ink flex-col fixed h-full z-30">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center text-white font-black text-sm shadow-md">
              K
            </div>
            <div>
              <div className="text-white font-bold text-sm">K-F-C Admin</div>
              <div className="text-white/50 text-xs">관리자 패널</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-coral text-white shadow-lg shadow-coral/30"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white/80 text-sm transition-colors"
          >
            ← 사이트로 돌아가기
          </Link>
          <button
            onClick={() => {
              clearToken();
              router.push("/admin/login");
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 text-sm transition-colors mt-1"
          >
            🚪 로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-ink h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className="block w-5 h-0.5 bg-white rounded-full" />
            <span className="block w-5 h-0.5 bg-white rounded-full" />
            <span className="block w-5 h-0.5 bg-white rounded-full" />
          </div>
        </button>
        <span className="text-white font-bold text-sm">K-F-C Admin</span>
        <button
          onClick={() => {
            clearToken();
            router.push("/admin/login");
          }}
          className="text-red-400 text-sm font-medium"
        >
          로그아웃
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-72 h-full bg-ink p-4 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 p-2">
                <div className="text-white font-bold">K-F-C Admin</div>
              </div>
              {SIDEBAR_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      active
                        ? "bg-coral text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
