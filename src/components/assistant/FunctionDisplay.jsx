import React, { useState } from "react";
import {
  Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight,
} from "lucide-react";

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

export default function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const failed = ["failed", "error"].includes(toolCall.status)
    || /error|failed/i.test(String(toolCall.results ?? ""));
  const proj = toolCall.display_projection || {};
  const hidden = proj.hide_details && proj.details_redacted;

  const args = parseMaybeJson(toolCall.arguments_string);
  const results = parseMaybeJson(toolCall.results);

  return (
    <div className="mt-1 rounded-md border border-border bg-muted/60 px-2 py-1.5 text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        {running && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
        {!running && !failed && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />}
        {failed && <XCircle className="h-3 w-3 shrink-0 text-destructive" />}
        <span className="font-medium">{proj.label || toolCall.name}</span>
        {running && (
          <span className="text-muted-foreground">{proj.active_label || "Working…"}</span>
        )}
        {failed && !running && (
          <span className="text-destructive">{proj.error_label || "Failed"}</span>
        )}
      </button>
      {expanded && !hidden && (
        <div className="mt-1.5 space-y-1 border-t border-border pt-1.5">
          <div className="text-muted-foreground">Parameters:</div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-background/60 p-1.5">
            {JSON.stringify(args, null, 2)}
          </pre>
          <div className="text-muted-foreground">Result:</div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-background/60 p-1.5">
            {results === undefined ? "—" : JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}