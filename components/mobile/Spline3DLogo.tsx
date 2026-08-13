"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

type Spline3DLogoProps = {
  className?: string;
  height?: string;
  showBadge?: boolean;
};

export function Spline3DLogo({ className = "", height = "h-48", showBadge = true }: Spline3DLogoProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-[#a3e635]/30 bg-[#0d0e12] shadow-[0_12px_40px_rgba(163,230,53,0.15)] ${height} ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0e12] text-[#a3e635]">
          <Sparkles className="h-6 w-6 animate-spin text-[#a3e635]" />
          <span className="text-[11px] font-black tracking-wider uppercase text-[#a3e635]/80">3D Web3 Spline Logo</span>
        </div>
      )}
      <iframe
        allow="autoplay; fullscreen; xr-spatial-tracking"
        className={`h-full w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        src="https://my.spline.design/33web3icons-HW880lC2ZEe2K2ACLW1KvgYb/"
        title="3D Web3 Icons"
      />
      {showBadge && (
        <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5 rounded-full border border-[#a3e635]/40 bg-[#08090a]/80 px-2.5 py-1 text-[10px] font-black text-[#a3e635] backdrop-blur-md">
          <Sparkles className="h-3 w-3" />
          <span>3D Web3 Icons</span>
        </div>
      )}
    </div>
  );
}
