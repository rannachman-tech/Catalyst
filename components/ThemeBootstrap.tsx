// Inline theme bootstrap — runs before paint to avoid FOUC.
// Carefully written to avoid the ternary trap (gotcha #1):
// every branch must produce DIFFERENT values for light vs dark.

export default function ThemeBootstrap() {
  const code = `
    (function () {
      try {
        var stored = localStorage.getItem("ec-theme");
        var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        var mode;
        if (stored === "dark") mode = "dark";
        else if (stored === "light") mode = "light";
        else mode = prefersDark ? "dark" : "light";
        var html = document.documentElement;
        if (mode === "dark") html.classList.add("dark");
        else html.classList.remove("dark");
        html.style.colorScheme = mode;
      } catch (e) { /* ignore */ }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
