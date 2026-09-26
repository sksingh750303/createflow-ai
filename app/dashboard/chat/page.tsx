"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Globe,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Pencil,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ChatMessage,
  ConversationSummary,
  deleteConversation,
  renameConversation,
  subscribeConversations,
  subscribeMessages,
} from "@/lib/firebase/firestore";
import { streamChatApi, ApiClientError } from "@/lib/api-client";
import { toast } from "@/lib/toast-store";
import { CREDIT_COSTS } from "@/lib/billing/plans";

export default function ChatPage() {
  const { firebaseUser } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webResearch, setWebResearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    return subscribeConversations(firebaseUser.uid, (list) => {
      setConversations(list);
      if (!activeId && list.length > 0) setActiveId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    return subscribeMessages(activeId, setMessages);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  function newChat() {
    setActiveId(null);
    setMessages([]);
  }

  async function handleDeleteChat(id: string) {
    await deleteConversation(id);
    if (activeId === id) setActiveId(null);
    toast("Chat deleted", "success");
  }

  async function handleRenameChat(id: string) {
    const title = window.prompt("Rename chat");
    if (!title) return;
    await renameConversation(id, title);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const message = input;
    setInput("");
    setLoading(true);
    setStreamingText("");
    try {
      const { conversationId } = await streamChatApi({
        conversationId: activeId,
        message,
        onChunk: (chunk) => setStreamingText((prev) => (prev ?? "") + chunk),
      });
      setActiveId(conversationId);
    } catch (err) {
      if (err instanceof ApiClientError) toast(err.message, "error");
      else toast("The assistant failed to respond.", "error");
    } finally {
      setLoading(false);
      setStreamingText(null);
    }
  }

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content).catch(() => {});
    toast("Copied to clipboard", "success");
  }

  return (
    <div className="mx-auto grid h-[calc(100vh-8rem)] max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Card className="hidden flex-col p-3 lg:flex">
        <Button size="sm" onClick={newChat} className="mb-2">
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </Button>
        <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-sm ${
                c.id === activeId ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <button onClick={() => setActiveId(c.id)} className="min-w-0 flex-1 truncate text-left">
                {c.title}
              </button>
              <div className="hidden shrink-0 gap-1 group-hover:flex">
                <button onClick={() => handleRenameChat(c.id)} aria-label="Rename">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
                <button onClick={() => handleDeleteChat(c.id)} aria-label="Delete">
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">No chats yet.</p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && streamingText === null && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="h-8 w-8" />
              <p className="mt-3 max-w-xs text-sm">
                Ask me anything about writing, marketing, or your content strategy.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`group max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>
                {m.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(m.content)}
                    className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                )}
              </div>
            </div>
          ))}
          {streamingText !== null && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-foreground">
                <p className="whitespace-pre-line">
                  {streamingText}
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-foreground/50 align-middle" />
                </p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-2 flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => toast("File attachments coming soon")}
            >
              <Paperclip className="h-3 w-3" /> Attach
            </button>
            <button className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> {CREDIT_COSTS.chatMessage} credits / message
            </button>
            <button
              onClick={() => setWebResearch((w) => !w)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                webResearch ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              <Globe className="h-3 w-3" /> Web research
            </button>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message CreateFlow AI…"
              className="focus-ring min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
            />
            <Button size="icon" onClick={handleSend} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
