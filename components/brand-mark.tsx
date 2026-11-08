"use client";

import { useI18n } from "@/components/language-provider";
import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  linked?: boolean;
};

export function BrandMark({ linked = true }: BrandMarkProps) {
  const { t } = useI18n();
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
      aria-label={t.common.brandHome}
      className="inline-flex no-underline"
      href="/"
    >
      {logo}
    </Link>
  ) : (
    logo
  );
}
