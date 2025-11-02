'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProfile } from './ProfileProvider';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function ProfileMenu() {
  const { data: session } = useSession();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('guestUser');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.name) setGuestName(String(parsed.name));
      } else {
        setGuestName(null);
      }
    } catch {
      // ignore
    }
  }, [session?.user?.email, session?.user?.name]);

  // Round avatar sized like previous dark/light switch: ~32-36px button
  // Use 36px circle to match FloatingDarkModeToggle padding visually
  const sizePx = 36;

  const presetAvatars: Record<string, string> = {
    cat: '🐱',
    dog: '🐶',
    rocket: '🚀',
    book: '📘',
    code: '💻',
  };

  const renderAvatar = () => {
    const containerClass = "rounded-full overflow-hidden flex items-center justify-center bg-surface-alt aspect-square";
    const containerStyle = { width: sizePx, height: sizePx } as const;
    if (profile.avatarUrl) {
      return (
        <div className={containerClass} style={containerStyle}>
          <Image
            src={profile.avatarUrl}
            alt="Profile"
            className="object-cover w-full h-full"
            width={sizePx}
            height={sizePx}
            unoptimized
          />
        </div>
      );
    }
    const emoji = profile.avatarPresetId && presetAvatars[profile.avatarPresetId]
      ? presetAvatars[profile.avatarPresetId]
      : '👤';
    return (
      <div className={containerClass} style={containerStyle}>
        <span aria-hidden className="text-xl">{emoji}</span>
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Profile menu"
        className="rounded-full p-1 focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg"
        onClick={() => setOpen(o => !o)}
      >
        {renderAvatar()}
      </button>

      {open && (
        <div className="origin-top-right absolute -right-4 mt-2 min-w-[18rem] rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-[9999]">
          <div className="py-2 px-4" role="menu">
            <div className="text-xs text-muted mb-2">
              {session?.user ? (
                <span>Signed in as {session.user.name || session.user.email}</span>
              ) : guestName ? (
                <span>Guest: {guestName}</span>
              ) : (
                <span>Not signed in</span>
              )}
            </div>
            {!session?.user && !guestName && (
              <>
                <Link href="/login" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem">
                  <span className="mr-2">🔐</span> Login / Register
                </Link>
                <Link href="/register" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem">
                  <span className="mr-2">🔑</span> Register with OAuth
                </Link>
                <div className="border-t border-border my-2" />
              </>
            )}
            <Link href="/profile" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem">
              <span className="mr-2">👤</span> Profile Overview
            </Link>
            <Link href="/profile/edit" className="block px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150" role="menuitem">
              <span className="mr-2">✏️</span> Edit Profile
            </Link>
            {(session?.user || guestName) && (
              <>
                <div className="border-t border-border my-2" />
                <button
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-muted hover:bg-surface-alt hover:text-primary rounded transition-colors duration-150"
                  role="menuitem"
                  onClick={async () => {
                    setOpen(false);
                    try {
                      if (session?.user) {
                        await signOut({ callbackUrl: '/' });
                      } else {
                        localStorage.removeItem('guestUser');
                        window.location.href = '/';
                      }
                    } catch {
                      // ignore
                    }
                  }}
                >
                  <span className="mr-2">🚪</span> Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}