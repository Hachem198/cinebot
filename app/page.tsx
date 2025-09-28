"use client";

import type React from "react";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Film, Book, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt?: Date;
}

export default function ChatbotPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm CineBot, your personal entertainment curator. I'm here to help you discover amazing movies and books tailored to your taste. What are you in the mood for today?",
      role: "assistant",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.text,
        role: "assistant",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponseType = (message: string): "movie" | "book" | "general" => {
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("movie") ||
      lowerMessage.includes("film") ||
      lowerMessage.includes("watch")
    ) {
      return "movie";
    }
    if (
      lowerMessage.includes("book") ||
      lowerMessage.includes("read") ||
      lowerMessage.includes("novel")
    ) {
      return "book";
    }
    return "general";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getMessageIcon = (content: string) => {
    const type = getResponseType(content);
    switch (type) {
      case "movie":
        return <Film className="w-4 h-4 text-primary" />;
      case "book":
        return <Book className="w-4 h-4 text-primary" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  const setQuickMessage = (message: string) => {
    setInput(message);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-balance">CineBot</h1>
              <p className="text-sm text-muted-foreground">
                Your AI entertainment curator
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-3xl",
                  message.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-medium",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {message.role === "user" ? "You" : "CB"}
                  </AvatarFallback>
                </Avatar>

                <Card
                  className={cn(
                    "p-4 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border-border"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {message.role === "assistant" &&
                      getMessageIcon(message.content)}
                    <p className="text-sm leading-relaxed text-pretty">
                      {message.content}
                    </p>
                  </div>
                  <time
                    className={cn(
                      "text-xs mt-2 block",
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {(message.createdAt || new Date()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </Card>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-3xl">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                    CB
                  </AvatarFallback>
                </Avatar>
                <Card className="p-4 bg-card border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex gap-3 max-w-3xl">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-destructive text-destructive-foreground text-xs font-medium">
                    !
                  </AvatarFallback>
                </Avatar>
                <Card className="p-4 bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about movies, books, or anything entertainment-related..."
                  className="pr-12 min-h-[44px] resize-none bg-input border-border focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
