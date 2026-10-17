const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.log('Skipping route generation: dist/index.html not found');
  process.exit(0);
}

const html = fs.readFileSync(indexHtmlPath, 'utf8');

const routes = [
  'experiences',
  'games',
  'offers',
  'news',
  'book',
  'contact',
  'admin',
  'admin/login',
  'admin/dashboard',
  'admin/bookings',
  'admin/bookings/calendar',
  'admin/customers',
  'admin/facilities',
  'admin/facilities/new',
  'admin/categories',
  'admin/games',
  'admin/offers',
  'admin/news',
  'admin/gallery',
  'admin/finance',
  'admin/finance/revenue',
  'admin/finance/expenses',
  'admin/finance/partners',
  'admin/finance/profit',
  'admin/reports',
  'admin/settings',
  'admin/users',
  'admin/audit-logs',
];

// Always generate 404.html fallback
fs.writeFileSync(path.join(distDir, '404.html'), html);

// Generate both directory/index.html and flat .html for each route
routes.forEach(route => {
  // e.g. dist/offers/index.html
  const dir = path.join(distDir, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);

  // e.g. dist/offers.html (cleanUrls fallback)
  const fileWithExt = path.join(distDir, `${route}.html`);
  const parentDir = path.dirname(fileWithExt);
  fs.mkdirSync(parentDir, { recursive: true });
  fs.writeFileSync(fileWithExt, html);
});

console.log(`✅ Successfully generated static entrypoints for ${routes.length} SPA routes + 404.html`);
