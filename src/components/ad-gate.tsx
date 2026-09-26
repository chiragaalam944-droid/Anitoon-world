import { useState } from "react";
import { Tv } from "lucide-react";
import { saveAdResume, startAdSkip, type AdResume } from "@/lib/ad";

export function AdGate({
  resume,
  onClose,
}: {
  resume: AdResume;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSkip() {
    if (busy) return;
    setBusy(true);
    setError(null);
    saveAdResume(resume);
    try {
      const next = await startAdSkip();
      if (!next) throw new Error("Destination URL is missing");
      window.location.href = next;
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not start skip ads.");
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-xl p-5 sm:p-6">
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-accent text-accent-fg">
          <Tv className="size-5" />
        </div>
        <h3 className="font-display text-xl text-fg">Please Skip Ad to Watch or Download</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Complete the skip to unlock 48 hours of ad-free plays and downloads. Refresh and Back will
          not skip this step.
        </p>
        {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void startSkip()}
            disabled={busy}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
          >
            {busy ? "Opening skip…" : "Skip Ads"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-full bg-surface-2 px-4 text-sm font-medium text-muted hover:text-fg"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
