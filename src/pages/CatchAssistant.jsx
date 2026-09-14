import React from "react";
import { Camera } from "lucide-react";
import AgentPage from "@/components/assistant/AgentPage";

export default function CatchAssistant() {
  return (
    <AgentPage
      agentName="catch_logger"
      title="Catch Log Assistant"
      icon={Camera}
      newChatLabel="New catch chat"
      conversationName="Catch log"
      conversationDescription="Document a catch and link it to a spot"
      startLabel="Start a catch chat"
      emptyTitle="Log a catch by chatting"
      emptyDescription="Tell the assistant what you caught — it walks you through the details, suggests your saved spots and gear, then saves the catch."
      placeholder="Tell me about your catch…"
    />
  );
}