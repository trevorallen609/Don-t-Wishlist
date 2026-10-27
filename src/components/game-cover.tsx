"use client";

import Image from "next/image";

type Props = {
  title: string;
  size?: number;
  priority?: boolean;
  className?: string;
};

/** Server-friendly next/image wrapper over deterministic /api/cover. */
export function GameCover({ title, size = 48, priority = false, className }: Props) {
  const src = `/api/cover?title=${encodeURIComponent(title)}`;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={className ?? "rounded-md border border-line/80 object-cover"}
      sizes={`${size}px`}
    />
  );
}
