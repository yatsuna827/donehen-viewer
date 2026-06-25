import { useEffect, useEffectEvent, useRef } from "react";

import type { ParsedDonation } from "../parser/types";
import { useDonationRenderer } from "./useDonationRenderer";

type Props = {
  donation: ParsedDonation;
  onReturn: () => void;
};
export const Viewer: React.FC<Props> = ({ donation, onReturn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useDonationRenderer(donation, canvasRef);

  const handleKeydown = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") onReturn();
  });
  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="w-full flex justify-center p-4 sm:p-6 font-mono text-[#33ff33] bg-[#0a0a0a]">
      <div className="flex flex-col gap-4 w-fit max-w-full">
        <canvas
          ref={canvasRef}
          className="border border-[#33ff33] bg-black max-w-full h-auto"
        />
        <button
          className="bg-transparent border-none p-1 font-mono text-xs text-[#1a7a1a] cursor-pointer text-left hover:text-[#33ff33]"
          onClick={onReturn}
        >
          [ESC] return
        </button>
      </div>
    </div>
  );
};
