/* GlassCode theme initializer: applies persisted or system theme early */
(function(){
  try {
    var match = document.cookie.match(/(?:^|; )gc-theme=([^;]+)/);
    var cookieTheme = match ? decodeURIComponent(match[1]) : '';
    var storedTheme = localStorage.getItem('theme');
    var legacy = localStorage.getItem('darkMode');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var html = document.documentElement;

    // Decide the source of truth: prefer explicit localStorage if set,
    // then fallback to cookie, then legacy key, else system.
    var selected = (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')
      ? storedTheme
      : ((cookieTheme === 'light' || cookieTheme === 'dark')
          ? cookieTheme
          : (legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'system'));

    var finalTheme = selected === 'system' ? (prefersDark ? 'dark' : 'light') : selected;

    html.classList.remove('light', 'dark');
    if (finalTheme === 'dark') {
      html.classList.add('dark');
      try { html.style.colorScheme = 'dark'; } catch {}
    } else {
      try { html.style.colorScheme = 'light'; } catch {}
    }
    html.setAttribute('data-theme', finalTheme);
  } catch { /* noop */ }
})();