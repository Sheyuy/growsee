"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, User, Heart, BookOpen } from "lucide-react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import type { User as DbUser } from "@/lib/db/schema/users";

const ROLES = [
  { value: "mom",         label: "妈妈",   emoji: "👩" },
  { value: "dad",         label: "爸爸",   emoji: "👨" },
  { value: "grandparent", label: "祖父母", emoji: "👴" },
  { value: "other",       label: "其他",   emoji: "🌿" },
];

export function UserProfileScreen() {
  const router = useRouter();
  const eazoUser = useEazo((s) => s.auth.user);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [familyNote, setFamilyNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!eazoUser) return;
    request("/api/user/profile").then(r => r.json())
      .then(({ user }) => {
        setProfile(user);
        setRole(user.role ?? "");
        setBio(user.bio ?? "");
        setFamilyNote(user.familyNote ?? "");
      }).catch(() => {});
  }, [eazoUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await request("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role || null, bio: bio.trim() || null, familyNote: familyNote.trim() || null }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { } finally { setSaving(false); }
  };

  const displayName = profile?.name ?? eazoUser?.name ?? "你";
  const avatarUrl = profile?.avatarUrl ?? eazoUser?.avatarUrl;

  return (
    <div className="min-h-svh" style={{ backgroundColor: "var(--color-accent)" }}>
      <header className="flex items-center px-5 pt-8 pb-4 border-b"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-accent)" }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
          className="w-8 h-8 rounded-full border flex items-center justify-center mr-3 bg-white"
          style={{ borderColor: "var(--color-border)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
        </motion.button>
        <h2 className="text-base font-semibold flex-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          我的资料
        </h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: saved ? "var(--color-states-success)" : "var(--color-primary)" }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
          {saved ? "已保存" : "保存"}
        </motion.button>
      </header>

      <div className="px-5 py-6 space-y-6 pb-24">
        {/* 头像 + 名字（只读，来自 Eazo 账号） */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border bg-white/70"
          style={{ borderColor: "var(--color-border)" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} className="w-14 h-14 rounded-full object-cover" />
            : <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {displayName.slice(0, 1)}
              </div>
          }
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{displayName}</p>
            {profile?.email && (
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{profile.email}</p>
            )}
            <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
              昵称和头像通过 Eazo 账号管理
            </p>
          </div>
        </div>

        {/* 角色选择 */}
        <div>
          <label className="text-xs font-bold mb-2 block" style={{ color: "var(--color-text-secondary)" }}>
            你在家里的角色
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ROLES.map(r => (
              <motion.button key={r.value} whileTap={{ scale: 0.95 }} onClick={() => setRole(r.value)}
                className="py-3 rounded-2xl border text-center transition-colors"
                style={{
                  backgroundColor: role === r.value ? "var(--color-primary)" : "white",
                  borderColor: role === r.value ? "var(--color-primary)" : "var(--color-border)",
                }}>
                <div className="text-xl mb-1">{r.emoji}</div>
                <div className="text-[10px] font-medium"
                  style={{ color: role === r.value ? "white" : "var(--color-text-secondary)" }}>
                  {r.label}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 一句话介绍 */}
        <div>
          <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
            关于你自己（选填）
          </label>
          <input
            className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none"
            style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
            placeholder="比如：二孩妈妈，在摸索边界感"
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={50}
          />
          <p className="text-[9px] mt-1 text-right" style={{ color: "var(--color-text-muted)" }}>{bio.length}/50</p>
        </div>

        {/* 家庭情况备注 */}
        <div>
          <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
            家庭情况备注
          </label>
          <p className="text-[10px] mb-2" style={{ color: "var(--color-text-muted)" }}>
            AI 会参考这里的内容来更好地理解你的家庭，给出更有针对性的回应。
          </p>
          <textarea
            className="w-full px-3 py-2.5 rounded-xl text-base border focus:outline-none resize-none"
            style={{ borderColor: "var(--color-border)", backgroundColor: "white", color: "var(--color-text-primary)" }}
            placeholder="比如：大宝7岁，小宝2岁，爸爸常出差，主要我一个人带。大宝最近不喜欢上学……"
            rows={4}
            value={familyNote}
            onChange={e => setFamilyNote(e.target.value)}
          />
        </div>

        {/* 说明卡片 */}
        <div className="p-4 rounded-2xl border"
          style={{ backgroundColor: "rgba(156,180,138,0.08)", borderColor: "rgba(156,180,138,0.2)" }}>
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              这里的信息只用于让 AI 更好地理解你的情况，不会对外展示，也不会用于任何商业目的。你可以随时修改或清空。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
