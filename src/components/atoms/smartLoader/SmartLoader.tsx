"use client";

import { useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// DotLottieReact uses a Web Worker + WASM — importing it on the server throws at
// module-evaluation time, so defer the import to the browser entirely.
// The WASM file is served from /public to avoid CDN fetch failures in dev.
const DotLottieAnimation = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then((m) => {
      m.setWasmUrl("/dotlottie-player.wasm");
      return { default: m.DotLottieReact };
    }),
  { ssr: false }
);

interface SmartLoaderProps {
  skeleton?: React.ReactNode;
}

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function SmartLoader({ skeleton }: SmartLoaderProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isClient) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <DotLottieAnimation
        src="/lottieAnimation/lottieAnimation.lottie"
        loop
        autoplay
        style={{ width: 350, height: 350 }}
      />
    </div>
  );
}
