/* GlassCode theme initializer: applies persisted or system theme early and injects a pre-hydration toggle for E2E stability */
(function(){
  try {
    var match = document.cookie.match(/(?:^|; )gc-theme=([^;]+)/);
    var cookieTheme = match ? decodeURIComponent(match[1]) : '';
    var storedTheme = localStorage.getItem('theme');
    var legacy = localStorage.getItem('darkMode');
    var initialTheme = storedTheme || (legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'system');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var html = document.documentElement;
    var finalTheme = (cookieTheme === 'dark' || cookieTheme === 'light')
      ? cookieTheme
      : (initialTheme === 'system' ? (prefersDark ? 'dark' : 'light') : initialTheme);
    html.classList.remove('light', 'dark');
    if (finalTheme === 'dark') {
      html.classList.add('dark');
      try { html.style.colorScheme = 'dark'; } catch {}
    } else {
      try { html.style.colorScheme = 'light'; } catch {}
    }
    html.setAttribute('data-theme', finalTheme);
  } catch { /* noop */ }

  // Inject a pre-hydration toggle so tests can find it before React mounts
  function setButtonLabel(btn, themeKey, resolvedDark) {
    try {
      var label = themeKey === 'system' ? 'Theme: System (auto)' : (themeKey === 'dark' ? 'Theme: Dark' : 'Theme: Light');
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label + ' — click to cycle');
      // Simple emoji fallback for icon prior to hydration
      btn.textContent = '';
      if (themeKey === 'system') {
        btn.textContent = '🖥️';
      } else if (resolvedDark) {
        btn.textContent = '☀️';
      } else {
        btn.textContent = '🌙';
      }
    } catch { /* noop */ }
  }

  function applyResolvedTheme(resolved) {
    try {
      var html = document.documentElement;
      html.classList.remove('dark');
      if (resolved === 'dark') {
        html.classList.add('dark');
        try { html.style.colorScheme = 'dark'; } catch {}
      } else {
        try { html.style.colorScheme = 'light'; } catch {}
      }
      html.setAttribute('data-theme', resolved);
    } catch { /* noop */ }
  }

  function cycleTheme(current) {
    try {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next;
      if (current === 'system') {
        next = prefersDark ? 'light' : 'dark';
      } else if (current === 'dark') {
        next = 'light';
      } else {
        next = 'system';
      }
      try { localStorage.setItem('theme', next); } catch {}
      var resolved = next === 'system' ? (prefersDark ? 'dark' : 'light') : next;
      try { document.cookie = 'gc-theme=' + resolved + '; path=/; max-age=31536000; SameSite=Lax'; } catch {}
      applyResolvedTheme(resolved);
      return { next: next, resolved: resolved };
    } catch { return { next: 'system', resolved: 'light' }; }
  }

  function injectPreHydrationButton() {
    try {
      // If React's toggle already exists, skip injection
      if (document.querySelector('[data-testid="theme-toggle"]')) return;
      var btn = document.createElement('button');
      btn.id = 'prehydration-theme-toggle';
      btn.type = 'button';
      btn.setAttribute('data-testid', 'prehydration-theme-toggle');
      btn.className = 'fixed bottom-5 right-5 z-[1000] rounded-full shadow-lg bg-surface-alt text-fg hover:bg-surface transition-colors duration-160 ease-out focus:outline-none focus:ring-2 ring-focus w-12 h-12 inline-flex items-center justify-center';

      var storedTheme = localStorage.getItem('theme');
      var legacy = localStorage.getItem('darkMode');
      var themeKey = (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')
        ? storedTheme
        : (legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'system');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var resolved = themeKey === 'system' ? (prefersDark ? 'dark' : 'light') : themeKey;
      setButtonLabel(btn, themeKey, resolved === 'dark');

      btn.addEventListener('click', function(){
        try {
          var current = localStorage.getItem('theme') || themeKey;
          var result = cycleTheme(current);
          themeKey = result.next;
          setButtonLabel(btn, themeKey, result.resolved === 'dark');
        } catch { /* noop */ }
      });

      document.body.appendChild(btn);
      try {
        // Provide a removal function for React to clean up
        // @ts-expect-error global hook set on window before TS context
        window.__gcRemovePreHydrationToggle = function() {
          try {
            var existing = document.getElementById('prehydration-theme-toggle');
            if (existing) existing.remove();
            try { delete window.__gcRemovePreHydrationToggle; } catch {}
          } catch { /* noop */ }
        };
      } catch { /* noop */ }
    } catch { /* noop */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPreHydrationButton, { once: true });
  } else {
    injectPreHydrationButton();
  }
})();