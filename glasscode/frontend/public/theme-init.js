/* GlassCode theme initializer: applies persisted or system theme early */
(function(){
  try {
    var match = document.cookie.match(/(?:^|; )gc-theme=([^;]+)/);
    var cookieTheme = match ? decodeURIComponent(match[1]) : '';
    var storedTheme = localStorage.getItem('theme');
    var legacy = localStorage.getItem('darkMode');
    var theme = storedTheme || (legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'system');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var html = document.documentElement;
    var finalTheme = (cookieTheme === 'dark' || cookieTheme === 'light')
      ? cookieTheme
      : (theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme);
    html.classList.remove('light', 'dark');
    html.classList.add(finalTheme);
    html.setAttribute('data-theme', finalTheme);
  } catch { /* noop */ }
})();