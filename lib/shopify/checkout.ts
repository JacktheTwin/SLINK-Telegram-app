export function openCheckout(url: string): void {
  const normalizedUrl = url.trim();

  if (!normalizedUrl) {
    throw new Error("Shopify non ha restituito un indirizzo per il checkout.");
  }

  window.location.assign(normalizedUrl);
}
