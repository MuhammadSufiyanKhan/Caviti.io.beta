import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md" aria-label="Caviti home">
      <Image src="/logo.png" alt="" width={24} height={24} className="rounded-full" />
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">caviti</span>
    </Link>
  );
}
