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
    if (profile.avatarUrl) {
      return (
        <Image
          src={profile.avatarUrl}
          alt="Profile"
          className="rounded-full object-cover"
          width={sizePx}
          height={sizePx}
          unoptimized
        />
      );
    }
    if (profile.avatarPresetId && presetAvatars[profile.avatarPresetId]) {
      return (
        <div className="rounded-full flex items-center justify-center bg-surface-alt text-xl" style={{ width: sizePx, height: sizePx }}>
          <span aria-hidden>{presetAvatars[profile.avatarPresetId]}</span>
        </div>
      );
    }
    return (
      <div className="rounded-full flex items-center justify-center bg-surface-alt text-xl" style={{ width: sizePx, height: sizePx }}>
        <span aria-hidden>👤</span>
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
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-surface/95 border border-border z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs text-muted">
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
                <Link href="/login" className="block px-4 py-2 text-sm text-fg hover:bg-surface-alt focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg" role="menuitem">
                  Login / Register
                </Link>
                <Link href="/register" className="block px-4 py-2 text-sm text-fg hover:bg-surface-alt focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg" role="menuitem">
                  Register with OAuth
                </Link>
                <div className="border-t border-border my-1" />
              </>
            )}
            <Link href="/profile" className="block px-4 py-2 text-sm text-fg hover:bg-surface-alt focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg" role="menuitem">
              Profile Overview
            </Link>
            <Link href="/profile/edit" className="block px-4 py-2 text-sm text-fg hover:bg-surface-alt focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg" role="menuitem">
              Edit Profile
            </Link>
            {(session?.user || guestName) && (
              <>
                <div className="border-t border-border my-1" />
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-fg hover:bg-surface-alt focus:outline-none focus:ring-2 ring-focus ring-offset-2 ring-offset-bg"
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
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}