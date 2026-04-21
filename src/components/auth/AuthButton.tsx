"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { migrateFromLocalStorage } from "@/lib/planStorage";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        migrateFromLocalStorage().then(() => {
          window.dispatchEvent(new CustomEvent("anipace:saved"));
        });
      } else if (event === "SIGNED_OUT") {
        window.dispatchEvent(new CustomEvent("anipace:saved"));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (user) {
    return (
      <div className="flex items-center gap-3 text-[0.8125rem]">
        <span className="text-foreground-muted truncate max-w-[160px]">
          {user.email}
        </span>
        <button
          onClick={() => createClient().auth.signOut()}
          className="text-foreground-muted hover:text-foreground transition-colors whitespace-nowrap"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() =>
        createClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${location.origin}/auth/callback` },
        })
      }
      className="text-[0.8125rem] text-foreground-muted hover:text-foreground transition-colors border border-border rounded-full px-3 py-1 hover:border-foreground-muted/50"
    >
      Sign In
    </button>
  );
}
