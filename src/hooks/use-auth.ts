import { useState, useEffect, useCallback } from "react";
import { initStore } from "@/lib/demo/store";

export interface AuthUser {
  id: string;
  openid: string;
  unionid?: string;
  name?: string;
  avatarUrl?: string | null;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isDemo: boolean;
}

const DEMO_USER: AuthUser = {
  id: "demo-user",
  openid: "demo-openid",
  name: "演示用户",
  avatarUrl: null,
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化: 加载示范数据 + 设置模拟用户
  useEffect(() => {
    let cancelled = false;

    async function init() {
      await initStore();
      if (!cancelled) {
        setUser(DEMO_USER);
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    await initStore();
    setUser(DEMO_USER);
    setLoading(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setUser(null);
    window.location.reload();
  }, []);

  return {
    user,
    loading,
    login,
    logout: handleLogout,
    isDemo: true,
  };
}
