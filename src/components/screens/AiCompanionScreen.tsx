"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Send, Loader2, RefreshCw, X, ChevronRight } from "lucide-react";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import { auth, memory } from "@eazo/sdk";
import type { Child } from "@/lib/db/schema/children";
import type { ReminderItem } from "@/app/api/ai/reminders/route";
import { ChildSwitcher } from "@/components/ChildSwitcher";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  autoSaved?: boolean;
}

// 快速追问提示词（根据最后一条 AI 消息提取关键词生成）
const FOLLOW_UP_PROMPTS = [
  "详细说说怎么做",
  "给我举个具体例子",
  "为什么会这样？",
  "如果没效果怎么办",
  "针对我孩子的情况",
];

// ── 提醒卡片 ─────────────────────────────────────────────
function ReminderCard({ item, onDismiss }: { item: ReminderItem; onDismiss: () => void }) {
  const urgencyColor = item.urgency === "high" ? "var(--color-secondary)" : "var(--color-primary)";
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
      className="mx-4 mb-3 p-3 rounded-2xl border flex items-start gap-3"
      style={{ backgroundColor: "rgba(255,255,255,0.8)", borderColor: item.urgency === "high" ? "rgba(211,110,82,0.3)" : "var(--color-border)" }}>
      <div className="flex-1">
        <p className="text-xs font-bold mb-0.5" style={{ color: urgencyColor }}>{item.title}</p>
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.body}</p>
      </div>
      <motion.button whileTap={{ scale: 0.9 }} onClick={onDismiss}
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: "var(--color-border)" }}>
        <X className="w-2.5 h-2.5" style={{ color: "var(--color-text-muted)" }} />
      </motion.button>
    </motion.div>
  );
}

// ── 消息气泡 ─────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[82%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{
            backgroundColor: isUser ? "var(--color-primary)" : "rgba(255,255,255,0.9)",
            color: isUser ? "white" : "var(--color-text-primary)",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}>
          {msg.content || <span className="opacity-40">…</span>}
        </div>
        {/* 自动存档提示，静默显示 */}
        {!isUser && msg.autoSaved && (
          <span className="text-[9px] ml-1 flex items-center gap-0.5" style={{ color: "var(--color-primary)" }}>
            ✦ 已自动记录
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── 主组件 ───────────────────────────────────────────────
export function AiCompanionScreen() {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "你好，有什么关于孩子的事想说说吗？\n\n不管是困惑、担心，还是今天发生的一件小事，都可以直接说。",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  const loadDynamicPrompts = useCallback(async (childId?: string) => {
    setLoadingPrompts(true);
    try {
      const url = childId ? `/api/ai/prompts?childId=${childId}` : "/api/ai/prompts";
      const res = await request(url);
      const data: string[] = await res.json();
      setQuickPrompts(data);
    } catch {
      setQuickPrompts(["孩子最近有没有让你担心的地方？", "今天带孩子有没有开心的瞬间？", "有什么一直想说但说不出口的话吗？", "最近带娃最难的是哪件事？"]);
    } finally { setLoadingPrompts(false); }
  }, []);

  useEffect(() => {
    if (!user) return;
    request("/api/children").then(r => r.json())
      .then(async (data: Child[]) => {
        const child = data[0];
        setAllChildren(data);
        if (child) {
          setActiveChild(child);
          await loadDynamicPrompts(child.id);
          request(`/api/ai/reminders?childId=${child.id}`).then(r => r.json())
            .then((items: ReminderItem[]) => setReminders(items))
            .catch(() => {});
        } else {
          loadDynamicPrompts();
        }
      }).catch(() => {});
  }, [user, loadDynamicPrompts]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text.trim(), timestamp: new Date() }]);
    setInput("");
    setStreaming(true);
    const aId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: aId, role: "assistant", content: "", timestamp: new Date() }]);
    try {
      const sessionHeader = await auth.getSessionHeader();
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionHeader ? { "x-eazo-session": sessionHeader } : {}),
        },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: sessionId.current,
          childId: activeChild?.id,
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("stream failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: full } : m));
      }
      memory.reportAction({
        content: `家长与 AI 对话：${text.trim().slice(0, 50)}`,
        event_type: "message",
        page: "ai-companion",
        metadata: { child_id: activeChild?.id, session_id: sessionId.current },
      }).catch(() => {});
    } catch {
      setMessages(prev => prev.map(m => m.id === aId ? { ...m, content: "抱歉，刚才断开了，可以再说一遍吗？" } : m));
    } finally { setStreaming(false); }
  };

  const handleChildSwitch = (child: Child | null) => {
    if (!child || child.id === activeChild?.id) return;
    setActiveChild(child);
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `好，现在聊${child.nickname ?? child.name}的事。有什么想说的吗？`,
      timestamp: new Date(),
    }]);
    sessionId.current = crypto.randomUUID();
    loadDynamicPrompts(child.id);
    request(`/api/ai/reminders?childId=${child.id}`).then(r => r.json())
      .then((items: ReminderItem[]) => setReminders(items)).catch(() => {});
  };

  return (
    <div className="flex flex-col w-full overflow-hidden" style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px", marginLeft: "auto", marginRight: "auto", height: "calc(100svh - 64px)" }}>
      {/* 头部 */}
      <header className="shrink-0 flex items-center gap-2 px-5 pt-8 pb-3 border-b"
        style={{ backgroundColor: "var(--color-accent)", borderColor: "var(--color-border)" }}>
        <div className="flex-1 flex items-center gap-2">
          <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>聊聊</h2>
          {allChildren.length > 0 && (
            <ChildSwitcher children={allChildren} activeChild={activeChild} onChange={handleChildSwitch} />
          )}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => loadDynamicPrompts(activeChild?.id)}
          disabled={loadingPrompts}
          className="w-8 h-8 rounded-full border flex items-center justify-center bg-white"
          style={{ borderColor: "var(--color-border)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPrompts ? "animate-spin" : ""}`}
            style={{ color: "var(--color-text-secondary)" }} />
        </motion.button>
      </header>

      {/* 提醒卡片 */}
      <AnimatePresence>
        {reminders.map((r, i) => (
          <ReminderCard key={i} item={r} onDismiss={() => setReminders(prev => prev.filter((_, j) => j !== i))} />
        ))}
      </AnimatePresence>

      {/* 消息列表 — flex-1 + overflow-y-auto 让它撑满并可滚动 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 快捷提问 — 统一容器，初始引导或 AI 回复后的追问提示二选一 */}
      {((messages.length <= 1 && quickPrompts.length > 0) ||
        (messages.length > 0 && messages[messages.length - 1].role === "assistant" && !streaming)) && (
        <div className="shrink-0 px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {messages.length <= 1 ? (
              loadingPrompts
                ? <div className="h-8 w-40 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-border)" }} />
                : quickPrompts.map((p, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => sendMessage(p)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border text-xs shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {p}
                  </motion.button>
                ))
            ) : (
              FOLLOW_UP_PROMPTS.map((prompt) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setInput(prompt)}
                  className="shrink-0 px-3 py-1.5 rounded-full border text-[11px] whitespace-nowrap flex items-center gap-1"
                  style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", background: "rgba(255,255,255,0.85)" }}>
                  {prompt}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </motion.button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 输入区 — shrink-0 固定在底部 */}
      <div className="shrink-0 px-4 py-3 border-t pb-[env(safe-area-inset-bottom,12px)]"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-accent)" }}>
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 px-3 py-2.5 rounded-2xl text-base border focus:outline-none resize-none"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(255,255,255,0.9)", color: "var(--color-text-primary)", maxHeight: "120px" }}
            placeholder="直接说就好……"
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            disabled={streaming} />
          <div className="flex items-center gap-1.5 mb-0.5 shrink-0">
            <VoiceInputButton
              disabled={streaming}
              onTranscript={(t) => setInput(prev => prev ? prev + " " + t : t)}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: input.trim() && !streaming ? "var(--color-primary)" : "var(--color-text-muted)" }}>
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </motion.button>
          </div>
        </div>
        <p className="text-[9px] text-center mt-1.5" style={{ color: "var(--color-text-muted)" }}>
          育见 AI · 仅供参考，不构成医疗诊断
        </p>
      </div>
    </div>
  );
}
