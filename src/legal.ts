import './styles.css';

const root = document.querySelector<HTMLDivElement>('#legal');
if (!root) throw new Error('The legal page root is missing.');

const privacy = location.pathname.startsWith('/privacy');
const content = privacy ? `
  <p class="eyebrow">Effective August 28, 2026</p>
  <h1>How Symptom Visit Brief handles privacy</h1>
  <p class="legal-lede">Your symptom records stay in this browser unless you export them.</p>
  <h2>What stays on your device</h2>
  <p>Observations, severity, duration, context, photos, preferences, and imported backups are stored in your browser’s IndexedDB. They leave the device only when you explicitly download or share an export. Clearing browser or app storage can remove them, so keep a JSON backup if the records matter to you.</p>
  <h2>Licenses and payment</h2>
  <p>If you buy Brief Plus, checkout is hosted by Sociobot and its merchant of record, Dodo. This app stores the returned license token in localStorage and sends that token—not your symptom records—to the Sociobot verification endpoint at most once per day. Their transaction records are governed by their checkout privacy terms.</p>
  <h2>Network and analytics</h2>
  <p>The app does not include advertising, behavioral analytics, third-party fonts, or tracking scripts. Static hosting may retain ordinary security logs such as IP address, request path, and user agent for a limited period. The service worker caches app files so the diary can work offline.</p>
  <h2>Your choices</h2>
  <p>Use “Export backup” before moving devices. Remove this app’s site data in browser settings to delete local records and the local license token. Exports you have shared are outside this app’s control.</p>
  <h2>Contact</h2><p>For privacy questions, contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `
  <p class="eyebrow">Effective August 28, 2026</p>
  <h1>Terms for Symptom Visit Brief</h1>
  <p class="legal-lede">Symptom Visit Brief helps you organize your own observations. It is not a medical service, diagnostic tool, treatment recommendation, or emergency service.</p>
  <h2>Use and safety</h2>
  <p>You are responsible for what you record, export, and share. Do not delay professional or emergency care because of this app. A generated brief may be incomplete or contain mistakes from the information entered; review it before sharing.</p>
  <h2>Local storage</h2>
  <p>Records are kept in browser storage. We do not promise that a browser, device, or operating system will retain that storage forever. Use the JSON backup feature and protect exported files appropriately.</p>
  <h2>Brief Plus purchase</h2>
  <p>Brief Plus is a $9 one-time license for saved symptom presets and personalized brief headings. The diary and core PDF, CSV, and JSON exports remain free. Sociobot / Dodo is the merchant of record. Refunds are handled through the hosted checkout; a refunded or revoked license may stop verifying.</p>
  <h2>Availability and warranty</h2>
  <p>The software is provided “as is,” without warranties. We may change or discontinue features, but the export tools are intended to keep your data portable. To the extent permitted by law, Sociobot is not liable for medical decisions, lost local data, or indirect damages arising from use.</p>
  <h2>Acceptable use</h2>
  <p>Do not attempt to disrupt the service, bypass paid-license verification, or use the app to violate another person’s privacy or rights.</p>
  <h2>Contact</h2><p>Questions may be sent to <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`;

root.innerHTML = `
  <header class="site-header"><div class="header-inner"><a class="wordmark" href="/"><span class="mark" aria-hidden="true"><i></i></span><span>Symptom Visit Brief</span></a><nav aria-label="Legal navigation"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></div></header>
  <main id="main" class="legal-page"><article>${content}<p class="legal-back"><a class="button secondary" href="/">Return to the app</a></p></article></main>
  <footer><p>Private symptom notes for clinician visits.</p><nav aria-label="Footer navigation"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></footer>`;
