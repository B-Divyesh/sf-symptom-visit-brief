import './styles.css';

const root = document.querySelector<HTMLDivElement>('#not-found');
if (!root) throw new Error('The not-found root is missing.');

root.innerHTML = `
  <header class="site-header"><div class="header-inner"><a class="wordmark" href="/"><span class="mark" aria-hidden="true"><i></i></span><span>Symptom Visit Brief</span></a><nav aria-label="Main navigation"><a href="/demo">Demo</a><a href="/privacy/">Privacy</a></nav></div></header>
  <main id="main" class="not-found-page"><section><p class="eyebrow">404</p><h1>This page is not in your timeline.</h1><p class="lede">The address may be incomplete. Return home or open the sample workspace.</p><div class="hero-actions"><a class="button primary" href="/">Return home</a><a class="text-link" href="/demo">Try sample data <span aria-hidden="true">→</span></a></div></section></main>
  <footer><p>Private notes, shaped for a useful conversation.</p><nav aria-label="Footer navigation"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></footer>`;
