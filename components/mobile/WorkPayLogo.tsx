"use client";

import Image from "next/image";

type WorkPayLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16"
};

export function WorkPayLogo({ size = "md", className = "" }: WorkPayLogoProps) {
  return (
    <div className={`${sizes[size]} relative shrink-0 overflow-hidden rounded-2xl bg-[#08090a] p-1 ring-2 ring-[#a3e635] shadow-[0_0_20px_rgba(163,230,53,0.25)] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.2),transparent_70%)] pointer-events-none" />
      <Image alt="WorkPay 3D" className="h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(163,230,53,0.3)]" height={96} priority={size === "lg"} src="/workpay-logo.png" width={96} />
    </div>
  );
}
