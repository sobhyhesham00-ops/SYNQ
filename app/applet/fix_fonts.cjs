const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=JetBrains\+Mono:wght@400;500;600&display=swap'\);/,
  `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`
);

css = css.replace(
  /--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;/,
  `--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;`
);

css = css.replace(
  /--font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;/,
  `--font-display: "Space Grotesk", "Inter", ui-sans-serif, system-ui, sans-serif;`
);

fs.writeFileSync('src/index.css', css);
