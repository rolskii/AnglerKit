import React from "react";
import { Waves } from "lucide-react";
import AgentPage from "@/components/assistant/AgentPage";

export default function RiverAdvisor() {
  return (
    <AgentPage
      agentName="river_advisor"
      title="River Advisor"
      icon={Waves}
      newChatLabel="New river briefing"
      conversationName="River briefing"
      conversationDescription="Live conditions advice for favorite stations"
      startLabel="Get a river briefing"
      emptyTitle="Get a river briefing"
      emptyDescription="Ask about any of your favorite stations — the advisor pulls live water levels and flows, compares them to normal and to your own past notes, and tells you what it means for fishing."
      placeholder="How are my rivers looking today?"
    />
  );
}