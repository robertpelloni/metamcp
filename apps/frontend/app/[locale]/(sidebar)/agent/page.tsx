"use client";

import { Bot, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "@/hooks/useTranslations";
import { vanillaTrpcClient } from "@/lib/trpc";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function AgentPage() {
  const { t } = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [messages]);

  const handleSubmit = async () => {
      if (!input.trim()) return;

      const userMsg: Message = { role: "user", content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
          // Call the backend agent
          const response = await vanillaTrpcClient.frontend.agent.run.mutate({
              task: userMsg.content
          });

          // Result comes back as a JSON string usually from the tool result
          let content = "";
          if (response && response.content && Array.isArray(response.content)) {
              content = response.content.map((c: any) => c.text).join("\n");
          } else {
              content = JSON.stringify(response, null, 2);
          }

          const assistantMsg: Message = { role: "assistant", content };
          setMessages(prev => [...prev, assistantMsg]);
      } catch (error: any) {
          console.error(error);
          const errorMsg: Message = {
              role: "assistant",
              content: `Error: ${error.message || "Failed to execute agent task."}\n\nNote: Agent execution via Web UI currently requires an MCP Client connection or loopback configuration on the backend.`
          };
          setMessages(prev => [...prev, errorMsg]);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Autonomous Agent</h1>
            <p className="text-sm text-muted-foreground">
              Task the agent to perform complex workflows using available tools.
            </p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground mt-20">
                            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Enter a task below to start.</p>
                            <p className="text-xs mt-2">Example: "Find the latest issue in repo X and summarize it"</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            }`}>
                                <div className="prose dark:prose-invert text-sm max-w-none">
                                    {msg.role === "assistant" ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                                <Bot className="h-4 w-4 animate-pulse" />
                                <span className="text-xs text-muted-foreground">Agent is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe a task..."
                        className="min-h-[60px]"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !input.trim()}
                        className="h-auto"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
