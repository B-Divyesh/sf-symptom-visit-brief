const SLUG = 'symptom-visit-brief';
const isDemo = typeof window !== 'undefined' &&
  (window.location.pathname.replace(/\/$/, '') === '/demo' || new URLSearchParams(window.location.search).get('demo') === '1');
const LICENSE_KEY = `${isDemo ? 'demo:' : ''}sb_license:${SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
const API_BASE = import.meta.env.VITE_BILLING_API_BASE || 'https://api.sociobot.in/api/v1';

interface CachedVerdict {
  valid: boolean;
  checkedAt: number;
}

export const checkoutUrl = `${API_BASE}/products/${SLUG}/checkout`;

export const acceptLicenseFromUrl = (): boolean => {
  const url = new URL(window.location.href);
  const license = url.searchParams.get('license');
  if (!license) return false;
  localStorage.setItem(LICENSE_KEY, license);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
};

export const storeLicense = (license: string): void => {
  localStorage.setItem(LICENSE_KEY, license.trim());
  localStorage.removeItem(VERDICT_KEY);
};

export const cachedUnlock = (): boolean => {
  if (!localStorage.getItem(LICENSE_KEY)) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || '') as CachedVerdict;
    return verdict.valid;
  } catch {
    return true;
  }
};

export const verifyLicense = async (force = false): Promise<boolean> => {
  const license = localStorage.getItem(LICENSE_KEY);
  if (!license) return false;
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || '') as CachedVerdict;
    if (!force && Date.now() - cached.checkedAt < 86_400_000) return cached.valid;
  } catch {
    // A missing cached verdict is verified below.
  }
  const response = await fetch(
    `${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(license)}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!response.ok) throw new Error('License verification is temporarily unavailable.');
  const result = (await response.json()) as { valid: boolean };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
  return result.valid;
};
