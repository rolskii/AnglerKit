import React from "react";
import ReactMarkdown from "react-markdown";
import FunctionDisplay from "@/components/assistant/FunctionDisplay";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
            : "max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2 text-sm text-card-foreground shadow-sm"
        }
      >
        {message.content &&
          (isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <ReactMarkdown className="prose prose-sm max-w-none break-words [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
              {message.content}
            </ReactMarkdown>
          ))}
        {message.tool_calls?.map((toolCall, idx) => (
          <FunctionDisplay key={idx} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}