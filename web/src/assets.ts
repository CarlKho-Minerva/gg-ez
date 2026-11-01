declare global { interface Window { __embeddedAssets?: Record<string,string> } }
export const assetUrl = (path: string) => window.__embeddedAssets?.[path] ?? `${import.meta.env.BASE_URL}${path}`;
