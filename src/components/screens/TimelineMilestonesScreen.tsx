"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import { memory } from "@eazo/sdk";
import type { Child } from "@/lib/db/schema/children";
import type { Milestone } from "@/lib/db/schema/milestones";
import type { GrowthRecord } from "@/lib/db/schema/growth-records";

// ── 五维雷达图 ─────────────────────────────────────────────
const DIMS = [
  { key: "behavior", label: "行为" },
  { key: "emotion",  label: "情绪" },
  { key: "language", label: "语言" },
  { key: "physical", label: "身体" },
  { key: "social",   label: "社交" },
];

function RadarChart({ records }: { records: GrowthRecord[] }) {
  const counts: Record<string, number> = {};
  for (const r of records) counts[r.category] = (counts[r.category] ?? 0) + 1;
  const max = Math.max(...DIMS.map(d => counts[d.key] ?? 0), 1);
  const scores = DIMS.map(d => (counts[d.key] ?? 0) / max);

  const cx = 80, cy = 80, r = 60;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2;

  const point = (i: number, ratio: number) => {
    const a = startAngle + i * angleStep;
    return { x: cx + ratio * r * Math.cos(a), y: cy + ratio * r * Math.sin(a) };
  };

  const gridPoints = (ratio: number) =>
    DIMS.map((_, i) => point(i, ratio)).map(p => `${p.x},${p.y}`).join(" ");

  const dataPoints = scores.map((s, i) => point(i, Math.max(s, 0.08)))
    .map(p => `${p.x},${p.y}`).join(" ");

  if (records.length === 0) return null;

  return (
    <div className="flex flex-col items-center py-4 px-4">
      <p className="text-xs font-semibold mb-4" style={{ color: "var(--color-text-secondary)" }}>
        你最近在关注什么
      </p>
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* 网格 */}
          {[0.25, 0.5, 0.75, 1].map(ratio => (
            <polygon key={ratio} points={gridPoints(ratio)} fill="none"
              stroke="var(--color-border)" strokeWidth="0.8" />
          ))}
          {/* 轴线 */}
          {DIMS.map((_, i) => {
            const p = point(i, 1);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke="var(--color-border)" strokeWidth="0.8" />;
          })}
          {/* 数据面 */}
          <polygon points={dataPoints} fill="rgba(156,180,138,0.25)"
            stroke="var(--color-primary)" strokeWidth="1.5" strokeLinejoin="round" />
          {/* 数据点 */}
          {scores.map((s, i) => {
            const p = point(i, Math.max(s, 0.08));
            return <circle key={i} cx={p.x} cy={p.y} r="3"
              fill="var(--color-primary)" />;
          })}
          {/* 标签 */}
          {DIMS.map((d, i) => {
            const p = point(i, 1.3);
            return <text key={i} x={p.x} y={p.y} textAnchor="middle"
              dominantBaseline="middle" fontSize="10"
              fill="var(--color-text-secondary)">{d.label}</text>;
          })}
        </svg>
      </div>
      <p className="text-[9px] mt-1" style={{ color: "var(--color-text-muted)" }}>
        你记录了 {records.length} 个瞬间
      </p>
    </div>
  );
}

const EMOJIS = ["⭐", "🌱", "🌸", "🦋", "🎈", "💛", "🍃", "🐣", "🌈", "🎵"];
const MILESTONE_TYPES = [
  { value: "first_word", label: "第一次说话", emoji: "💬" },
  { value: "first_step", label: "第一次走路", emoji: "👣" },
  { value: "first_day_school", label: "第一天上学", emoji: "🎒" },
  { value: "custom", label: "自定义", emoji: "✨" },
];

function AddMilestoneSheet({ open, onClose, childId, onSaved }: {
  open: boolean; onClose: () => void; childId: string; onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [milestoneType, setMilestoneType] = useState("custom");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      // 使用 Eazo SDK 的前端 storage.upload（presigned URL 直传 S3）
      const { storage } = await import("@eazo/sdk");
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `timeline-photos/${Date.now()}.${ext}`;
      const result = await storage.upload(key, file);
      return result.url;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }
      await request("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          title: title.trim(),
          description: desc.trim() || null,
          emoji,
          milestoneType: milestoneType === "custom" && customTypeLabel.trim() ? customTypeLabel.trim() : milestoneType,
          occurredAt: new Date(date).toISOString(),
          photoUrl,
        }),
      });
      memory.reportAction({ content: `用户添加里程碑：${title}`, event_type: "create", page: "timeline-milestones", metadata: { type: "create_milestone", child_id: childId } }).catch(() => {});
      setTitle(""); setDesc(""); setEmoji("⭐"); setPhotoPreview(null); setPhotoFile(null); setMilestoneType("custom"); setCustomTypeLabel("");
      onSaved(); onClose();
    } catch { } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring" as const, stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-4 pb-10" style={{ backgroundColor: "var(--color-accent)" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--color-border)" }} />
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>记录一个里程碑</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>这个时刻叫什么名字 *</label>
                <input className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none" style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
                  placeholder="例：第一次独立骑自行车" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>用几句话记下来（选填）</label>
                <textarea className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none resize-none" rows={3}
                  style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
                  placeholder="那一刻的细节……" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>选一个符号</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map((e) => (
                    <motion.button key={e} whileTap={{ scale: 0.9 }} onClick={() => setEmoji(e)}
                      className="w-9 h-9 rounded-xl text-lg flex items-center justify-center border"
                      style={{ backgroundColor: emoji === e ? "var(--color-primary)" : "white", borderColor: emoji === e ? "var(--color-primary)" : "var(--color-border)" }}>
                      {e}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>发生时间</label>
                <input type="date" className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
                  value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              {/* 自定义里程碑类别 */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--color-text-secondary)" }}>
                  里程碑类别
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {MILESTONE_TYPES.map((t) => (
                    <motion.button key={t.value} whileTap={{ scale: 0.95 }}
                      onClick={() => setMilestoneType(t.value)}
                      className="px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1"
                      style={{
                        background: milestoneType === t.value ? "var(--color-primary)" : "rgba(255,255,255,0.9)",
                        borderColor: milestoneType === t.value ? "var(--color-primary)" : "var(--color-border)",
                        color: milestoneType === t.value ? "#fff" : "var(--color-text)",
                      }}>
                      <span>{t.emoji}</span> {t.label}
                    </motion.button>
                  ))}
                </div>
                {milestoneType === "custom" && (
                  <input
                    className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
                    placeholder="输入自定义类别名称（可留空）"
                    value={customTypeLabel}
                    onChange={(e) => setCustomTypeLabel(e.target.value)}
                  />
                )}
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={!title.trim() || saving || uploading}
                className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: title.trim() ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                {(saving || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                保存这个里程碑
              </motion.button>

              {/* 照片上传 */}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  添加照片 <span style={{ color: "var(--color-text-muted)" }}>（选填，让回顾更有温度）</span>
                </label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="预览" className="w-full h-36 object-cover rounded-xl" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs">✕</button>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">点击添加照片</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function TimelineMilestonesScreen() {
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const [child, setChild] = useState<Child | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [allRecords, setAllRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadData = async (c: Child) => {
    const [msData, recsData] = await Promise.all([
      request(`/api/milestones?childId=${c.id}`).then(r => r.json()).catch(() => []),
      request(`/api/records?childId=${c.id}`).then(r => r.json()).catch(() => []),
    ]);
    setMilestones(msData);
    setAllRecords(recsData);
  };

  useEffect(() => {
    if (!user) return;
    request("/api/children").then((r) => r.json())
      .then(async (data: Child[]) => {
        if (data.length > 0) { setChild(data[0]); await loadData(data[0]); }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [user]);

  const NODE_COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-states-warning)", "var(--color-text-muted)"];

  return (
    <div className="min-h-svh w-full" style={{ backgroundColor: "var(--color-accent)", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
      <header className="sticky top-0 z-20 flex items-center px-5 pt-8 pb-4 border-b backdrop-blur-md" style={{ backgroundColor: "rgba(245,241,232,0.85)", borderColor: "var(--color-border)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="w-8 h-8 rounded-full border flex items-center justify-center mr-3 bg-white" style={{ borderColor: "var(--color-border)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
        </motion.button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>时光萌芽时间线</h2>
          <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>记载那些不必标高下的缓慢足迹</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="w-4 h-4" />
        </motion.button>
      </header>

      <div className="px-5 py-5 pb-24">
        {/* 哲学说明 */}
        <div className="mb-6 p-4 rounded-3xl border" style={{ backgroundColor: "rgba(255,255,255,0.5)", borderColor: "rgba(156,180,138,0.2)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs">🧘‍♀️</span>
            <h4 className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>这里没有成长进度条</h4>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            我们用"树枝向四周伸展"的姿态来纪念日子，因为生命的探求方向各异。有的花开得深，有的根深深扎入泥土。都值得慢慢歌颂。
          </p>
        </div>

        {/* 五维雷达图 */}
        {!loading && allRecords.length > 0 && (
          <div className="mb-5 rounded-3xl border overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "var(--color-border)" }}>
            <RadarChart records={allRecords} />
          </div>
        )}

        {loading ? (
          <div className="space-y-6 pl-6 border-l-2" style={{ borderColor: "rgba(156,180,138,0.3)" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative animate-pulse">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-border)]" />
                <div className="h-3 w-20 bg-[var(--color-border)] rounded-full mb-2" />
                <div className="rounded-2xl p-4 border" style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "var(--color-border)" }}>
                  <div className="h-4 w-3/4 bg-[var(--color-border)] rounded-full mb-2" />
                  <div className="h-3 w-full bg-[var(--color-border)] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}>还没有里程碑</p>
            <p className="text-xs mb-5" style={{ color: "var(--color-text-secondary)" }}>点击右上角的 + 号，记录第一个珍贵瞬间</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: "var(--color-primary)" }}>
              添加第一个里程碑
            </motion.button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-8" style={{ borderLeft: "2px solid rgba(156,180,138,0.3)" }}>
            <AnimatePresence>
              {milestones.map((m, i) => {
                const color = NODE_COLORS[i % NODE_COLORS.length];
                const date = new Date(m.occurredAt);
                const dateStr = date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, type: "spring" as const, stiffness: 200, damping: 30 }} className="relative">
                    <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full border-4 border-white shadow-sm" style={{ backgroundColor: color }} />
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>{m.emoji} 里程碑</span>
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{dateStr}</span>
                    </div>
                    <motion.div whileTap={{ scale: 0.98 }} className="rounded-2xl p-4 border shadow-sm cursor-pointer transition-colors"
                      style={{ backgroundColor: "rgba(255,255,255,0.7)", borderColor: "var(--color-border)" }}
                      onClick={() => router.push("/scientific-insight")}>
                      {m.photoUrl && (
                        <img src={m.photoUrl} alt={m.title} className="w-full h-36 object-cover rounded-xl mb-3" />
                      )}
                      <h4 className="text-sm font-bold mb-1.5" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>{m.title}</h4>
                      {m.description && <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--color-text-secondary)" }}>{m.description}</p>}
                      <span className="text-[10px] font-medium inline-block px-2.5 py-1 rounded-full border"
                        style={{ color: "var(--color-primary)", backgroundColor: "rgba(156,180,138,0.08)", borderColor: "rgba(156,180,138,0.2)" }}>
                        🌱 查看科学洞察 →
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div className="text-center pt-10">
          <p className="text-[10px] tracking-wider" style={{ color: "var(--color-text-muted)" }}>育见时间丛林 · 静候春风与夏花</p>
        </div>
      </div>

      {child && (
        <AddMilestoneSheet open={showAdd} onClose={() => setShowAdd(false)} childId={child.id}
          onSaved={() => loadData(child)} />
      )}
    </div>
  );
}
