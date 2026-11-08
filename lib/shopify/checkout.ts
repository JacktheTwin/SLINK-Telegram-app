// Accetta soltanto URL https il cui host è uno di quelli dello store, così un
// checkoutUrl inatteso (altro schema, altro dominio) non viene mai aperto.
export function isTrustedCheckoutUrl(
  url: string,
  trustedHosts: string[],
): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return (
      parsedUrl.protocol === "https:" &&
      trustedHosts.some((host) => host.toLowerCase() === hostname)
    );
  } catch {
    return false;
  }
}

// Riceve un URL già verificato con isTrustedCheckoutUrl.
export function openCheckout(url: string): void {
  window.location.assign(url);
}
