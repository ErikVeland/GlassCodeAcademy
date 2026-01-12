"use client";

import React from "react";
import Link from "next/link";
import "../../styles/design-system.scss";
import "../../styles/homepage.scss";
import "../../styles/liquid-glass.scss";

export default function AboutPage() {
  return (
    <div className="liquid-glass-layout">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="glass-morphism p-8 md:p-12 rounded-2xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
            About GlassCode Academy
          </h1>
          <p className="text-xl text-fg/90 max-w-3xl leading-relaxed">
            GlassCode Academy is an open-source educational platform dedicated to mastering modern web development.
            We believe in learning by doing, providing a realistic, full-stack environment where developers can
            practice, experiment, and prepare for technical interviews.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <section className="glass-morphism p-8 rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <h2 className="text-2xl font-bold text-fg mb-4 flex items-center gap-2">
              <span className="text-3xl">🚀</span> Our Mission
            </h2>
            <p className="text-fg/80 leading-relaxed">
              To bridge the gap between theoretical knowledge and production-ready skills.
              We provide deep dives into complex topics like authentication, caching, state management,
              and system design, wrapped in a gamified learning experience.
            </p>
          </section>

          <section className="glass-morphism p-8 rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <h2 className="text-2xl font-bold text-fg mb-4 flex items-center gap-2">
              <span className="text-3xl">🛠️</span> The Tech Stack
            </h2>
            <p className="text-fg/80 leading-relaxed">
              We don&apos;t just teach the stack; we are built on it. GlassCode Academy is a living example
              of a modern monorepo architecture, featuring Next.js 15, Node.js with Fastify, PostgreSQL,
              Redis, and a robust CI/CD pipeline.
            </p>
          </section>
        </div>

        <section className="glass-morphism p-8 md:p-12 rounded-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <h2 className="text-3xl font-bold text-fg mb-8 text-center">Newest Additions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-fg mb-2">Fastify Backend</h3>
              <p className="text-sm text-fg/70">
                Migrated to Fastify for high-performance API handling and reduced latency.
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">🏎️</div>
              <h3 className="text-xl font-semibold text-fg mb-2">Redis Caching</h3>
              <p className="text-sm text-fg/70">
                Implemented comprehensive caching strategies for content and session management.
              </p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-fg mb-2">Gamification 2.0</h3>
              <p className="text-sm text-fg/70">
                New achievements, streaks, and tier-based progression system to keep you motivated.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center animate-in fade-in zoom-in duration-700 delay-500">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Start Learning Now
          </Link>
        </div>
      </main>
    </div>
  );
}
