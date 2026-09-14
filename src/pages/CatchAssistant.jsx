import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MessageSquare, Camera } from "lucide-react";
import AgentChat from "@/components/assistant/AgentChat";

const AGENT = "catch_logger";

export default function CatchAssistant() {
  const [conversations, setConversations] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT });
      const sorted = [...(list || [])].sort(
        (a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
      );
      setConversations(sorted);
      setActiveId((current) => current || sorted[0]?.id || null);
    } catch (err) {
      setError(err.message || "Could not load conversations");
      setConversations([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startConversation = async () => {
    setCreating(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: "Catch log", description: "Document a catch and link it to a spot" },
      });
      setConversations((prev) => [conv, ...(prev || [])]);
      setActiveId(conv.id);
    } catch (err) {
      setError(err.message || "Could not start a new chat");
    } finally {
      setCreating(false);
    }
  };

  const active = (conversations || []).find((c) => c.id === activeId);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)]">
      <aside className="md:w-72 shrink-0 flex flex-col gap-3">
        <Button onClick={startConversation} disabled={creating} className="w-full">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New catch chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations === null && (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          )}
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => setActiveId(conv.id)}
              className={
                conv.id === activeId
                  ? "flex w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary"
                  : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              }
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{conv.metadata?.name || "Catch log"}</span>
            </button>
          ))}
          {conversations?.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No chats yet — start one to log a catch.
            </p>
          )}
          {error && <p className="px-3 py-2 text-sm text-destructive">{error}</p>}
        </div>
      </aside>
      <section className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        {active ? (
          <>
            <header className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Camera className="h-4 w-4 text-primary" />
              <h1 className="font-heading text-sm font-semibold">Catch Log Assistant</h1>
            </header>
            <div className="flex-1 min-h-0">
              <AgentChat conversation={active} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Log a catch by chatting</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell the assistant what you caught — it walks you through the details,
                suggests your saved spots and gear, then saves the catch.
              </p>
            </div>
            <Button onClick={startConversation} disabled={creating || conversations === null}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Start a catch chat
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}