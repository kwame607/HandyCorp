"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type NavUser = { role: "customer" | "professional" | "admin"; name: string } | null | undefined;

// For showing the right header links only. Real access checks happen on the server.
export function useAuthState(): NavUser {
  const [user, setUser] = useState<NavUser>(undefined);
  // Sign-in happens on the server, so check again whenever the page changes.
  const pathname = usePathname();
  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};
    (async () => {
      let supabase: ReturnType<typeof createBrowserSupabase>;
      try {
        supabase = createBrowserSupabase();
      } catch {
        if (alive) setUser(null);
        return;
      }
      const load = async () => {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        const uid = data.session?.user.id;
        if (!uid) return setUser(null);
        const { data: p } = await supabase.from("profiles").select("role, full_name").eq("id", uid).maybeSingle();
        if (alive) setUser(p ? { role: p.role, name: p.full_name } : null);
      };
      await load();
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") setUser(null);
        else if (event === "SIGNED_IN") void load();
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [pathname]);
  return user;
}
