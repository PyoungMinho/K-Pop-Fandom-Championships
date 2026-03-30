"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/game", label: "클릭 대전", icon: "🎯" },
  { href: "/relay", label: "이어달리기", icon: "🏃‍♂️" },
  { href: "/cheer", label: "응원 게시판", icon: "📣" },
  { href: "/scoreboard", label: "스코어보드", icon: "🏆" },
  { href: "/nomination", label: "투표", icon: "🗳️" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                K
              </div>
              <span className="font-extrabold text-lg tracking-tight text-ink hidden sm:block">
                가을 운동회
              </span>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "text-coral"
                        : "text-ink-muted hover:text-ink hover:bg-gray-50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-coral/8 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2">
              <div className="floating-badge">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-green-700">LIVE</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
              aria-label="메뉴"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <motion.span
                  animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                  className="block w-5 h-0.5 bg-ink rounded-full origin-center"
                />
                <motion.span
                  animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="block w-5 h-0.5 bg-ink rounded-full"
                />
                <motion.span
                  animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                  className="block w-5 h-0.5 bg-ink rounded-full origin-center"
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="absolute top-16 left-3 right-3 bg-white rounded-2xl shadow-xl p-3 border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {NAV_ITEMS.map((item, i) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                        isActive
                          ? "bg-coral/8 text-coral"
                          : "text-ink-muted hover:bg-gray-50 hover:text-ink"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-2 pt-2 border-t border-gray-100 px-4 py-2">
                <div className="floating-badge">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-green-700 text-xs">LIVE - DAY 5</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                  isActive ? "text-coral" : "text-ink-muted"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-semibold">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-active"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-coral"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
