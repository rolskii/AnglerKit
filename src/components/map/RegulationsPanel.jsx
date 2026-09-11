import React from "react";
import { X, Loader2, ScrollText, AlertTriangle, ExternalLink, CalendarRange, ListChecks } from "lucide-react";

const PROVINCE_LABELS = {
  ontario: "Ontario",
  quebec: "Quebec",
  manitoba: "Manitoba",
  nova_scotia: "Nova Scotia",
};

// Bottom-sheet panel showing fishing regulations for the current map centre.
// The backend resolves the province (and the Ontario FMZ) under the map
// centre, then returns a structured summary sourced from official regs.
export default function RegulationsPanel({ open, onOpenChange, data, loading, error }) {
  if (!open) return null;

  const regs = data?.regulations;
  const subtitle = loading
    ? "Looking up the fishing zone at the map centre…"
    : regs?.areaLabel ||
      (data?.province
        ? `${PROVINCE_LABELS[data.province] || data.province}${data?.zone ? ` · Zone ${data.zone}` : ""}`
        : "");

  return (
    <>
      <div className="absolute inset-0 z-[540] bg-black/30" onClick={() => onOpenChange(false)} />
      <div
        className="absolute inset-x-0 bottom-0 z-[550] max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background/95 backdrop-blur-xl shadow-2xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScrollText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-sm">Fishing Regulations</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">{subtitle || "Map centre"}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking the current regulations for this area…
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-2 text-sm text-destructive py-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && !data.supported && (
            <p className="text-sm text-muted-foreground py-4">
              Move the map to a location in Ontario, Quebec, Manitoba or Nova Scotia to see its fishing
              regulations.
            </p>
          )}

          {!loading && !error && regs && (
            <>
              {/* Seasons */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <CalendarRange className="w-3.5 h-3.5" /> Open Seasons &amp; Limits
                </div>
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {regs.seasons?.map((s, i) => (
                    <div key={i} className="px-3 py-2 bg-card">
                      <div className="text-sm font-medium">{s.species}</div>
                      <div className="text-xs text-muted-foreground">{s.season}</div>
                      <div className="text-xs mt-0.5">{s.limit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General rules */}
              {regs.generalRules?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <ListChecks className="w-3.5 h-3.5" /> Key Rules
                  </div>
                  <ul className="space-y-1.5">
                    {regs.generalRules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exceptions */}
              {regs.exceptionsNote && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{regs.exceptionsNote}</span>
                </div>
              )}

              {/* Official links */}
              {regs.links?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {regs.links.map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent/10"
                    >
                      {l.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Disclaimer */}
          {!loading && (
            <p className="text-[11px] text-muted-foreground/70 leading-snug pt-1">
              AI-generated summary of the official regulations and may be out of date. Always verify with
              the official source before fishing.
            </p>
          )}
        </div>
      </div>
    </>
  );
}