import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import AgentChat from "@/components/assistant/AgentChat";

// Shared page shell for in-app agent chat: conversation list on the left,
// live chat on the right. Powers both the Catch Log Assistant and the
// River Advisor.
export default function AgentPage({
  agentName,
  title,
  icon: Icon,
  newChatLabel,
  conversationName,
  conversationDescription,
  emptyTitle,
  emptyDescription,
  startLabel,
  placeholder,
}) {
  const [conversations, setConversations] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.agents.listConversations({ agent_name: agentName });
      const sorted = [...(list || [])].sort(
        (a, b) =>
          new Date(b.updated_date || b.created_date) -
          new Date(a.updated_date || a.created_date)
      );
      // Hide conversations with no messages — e.g. a "New chat" button that
      // was tapped by accident — unless it's the one currently open.
      setConversations(sorted);
      setActiveId((current) => current || sorted.find((c) => (c.messages?.length ?? 0) > 0)?.id || null);
    } catch (err) {
      setError(err.message || "Could not load conversations");
      setConversations([]);
    }
  }, [agentName]);

  useEffect(() => { load(); }, [load]);

  const startConversation = async () => {
    setCreating(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: { name: conversationName, description: conversationDescription },
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
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)] md:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 md:w-72">
        <Button onClick={startConversation} disabled={creating} className="w-full">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {newChatLabel}
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations === null && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {conversations
            ?.filter((conv) => conv.id === activeId || (conv.messages?.length ?? 0) > 0)
            .map((conv) => (
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
              <span className="truncate">{conv.metadata?.name || conversationName}</span>
            </button>
          ))}
          {conversations?.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No chats yet — start one to begin.
            </p>
          )}
          {error && <p className="px-3 py-2 text-sm text-destructive">{error}</p>}
        </div>
      </aside>
      <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {active ? (
          <>
            <header className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Icon className="h-4 w-4 text-primary" />
              <h1 className="font-heading text-sm font-semibold">{title}</h1>
            </header>
            <div className="min-h-0 flex-1">
              <AgentChat conversation={active} placeholder={placeholder} />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <Icon className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
            </div>
            <Button onClick={startConversation} disabled={creating || conversations === null}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {startLabel}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}