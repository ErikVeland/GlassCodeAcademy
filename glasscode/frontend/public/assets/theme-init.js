/* GlassCode theme initializer: applies persisted or system theme early */
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
})();