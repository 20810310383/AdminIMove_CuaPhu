/* Run: node VERIFY/CHECK_ADMIN_MODAL_V22.mjs
   Project root: AdminIMove_CuaPhu */
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const src = path.join(root, 'src');
const expected = {
  'AdminAccess.jsx': 3, 'App.jsx': 5, 'AuditLogPage.jsx': 1,
  'BroadcastCenterPage.jsx': 1, 'CommerceOrdersPage.jsx': 1,
  'CustomersPage.jsx': 1, 'DriverExperiencePage.jsx': 1,
  'DriverManagement.jsx': 1, 'DriverPointTopupsPage.jsx': 1,
  'TripsPage.jsx': 1,
};
let count = 0;
for (const [name, n] of Object.entries(expected)) {
  const content = fs.readFileSync(path.join(src, name), 'utf8');
  const opens = content.split('<AdminOverlayPortal>').length - 1;
  const closes = content.split('</AdminOverlayPortal>').length - 1;
  if (opens !== n || closes !== n) throw new Error(`${name}: ${opens}/${closes} portals, expected ${n}`);
  if (!content.includes("import AdminOverlayPortal from './AdminOverlayPortal.jsx'")) throw new Error(`${name}: missing Portal import`);
  count += n;
}
for (const file of ['AdBannersAdminPage.jsx','PromotionsAdminPage.jsx','ServicePricingPage.jsx']) {
  const content=fs.readFileSync(path.join(src,file),'utf8');
  if (!content.includes('createPortal(') || !content.includes('document.body')) throw new Error(`${file}: missing Banner/Promotion/Pricing portal`);
}
const css=fs.readFileSync(path.join(src, 'imove-modal-global-v22.css'),'utf8');
const main=fs.readFileSync(path.join(src,'main.jsx'),'utf8');
if (!main.includes("import './imove-modal-global-v22.css'")) throw new Error('Global modal styles not imported in main.jsx');
for (const token of ['.imove-portal-overlay-v22','.imove-overlay-v21','100dvh','align-items: center !important']) {
  if (!css.includes(token)) throw new Error(`Missing global CSS rule ${token}`);
}
console.log(`PASS: ${count} upgraded popups + 3 existing portals; global CSS linked.`);
console.log('Next: npm install && npm run build && deploy Admin frontend.');
