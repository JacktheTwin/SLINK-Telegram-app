import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  linked?: boolean;
};

export function BrandMark({ linked = true }: BrandMarkProps) {
  const logo = (
    <Image
      alt="SLINK"
      className="brand-logo"
      height={292}
      preload
      src="/brand/slink-logo.png"
      width={1200}
    />
  );

  return linked ? (
    <Link
      aria-label="SLINK, torna alla home"
      className="inline-flex no-underline"
      href="/"
    >
      {logo}
    </Link>
  ) : (
    logo
  );
}
