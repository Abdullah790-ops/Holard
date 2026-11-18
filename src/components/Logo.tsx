import Image from "next/image";
import Link from "next/link";

/** HOLARD Consulting logo. `light` = for dark backgrounds. */
export function Logo({ light = false, height = 52, href = "/" }: { light?: boolean; height?: number; href?: string }) {
  const width = Math.round(height * (640 / 317));
  return (
    <Link href={href} aria-label="HOLARD Consulting — home" className="inline-flex shrink-0 items-center">
      <Image src={light ? "/brand/logo-light.png" : "/brand/logo-dark.png"} alt="HOLARD Consulting" width={width} height={height} priority style={{ height, width }} />
    </Link>
  );
}
