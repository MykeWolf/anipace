import { createClient } from "@/lib/supabase/client";
import {
  loadPlans as lsLoad,
  savePlan as lsSave,
  deletePlan as lsDelete,
} from "@/lib/localStorage";
import type { SavedPlan } from "@/types";

const STORAGE_KEY = "anipace_plans";

async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function loadUserPlans(): Promise<SavedPlan[]> {
  const user = await getUser();
  if (!user) return lsLoad();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("data")
    .eq("user_id", user.id);

  if (error || !data) return lsLoad();
  return (data as { data: SavedPlan }[]).map((row) => row.data);
}

export async function saveUserPlan(plan: SavedPlan): Promise<boolean> {
  const user = await getUser();
  if (!user) return lsSave(plan);

  const supabase = createClient();
  const { error } = await supabase
    .from("plans")
    .upsert({ id: plan.id, user_id: user.id, data: plan });

  return !error;
}

export async function deleteUserPlan(id: string): Promise<boolean> {
  const user = await getUser();
  if (!user) return lsDelete(id);

  const supabase = createClient();
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return !error;
}

export async function migrateFromLocalStorage(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const plans = lsLoad();
  if (plans.length === 0) return;

  const supabase = createClient();
  await Promise.all(
    plans.map((plan) =>
      supabase
        .from("plans")
        .upsert({ id: plan.id, user_id: user.id, data: plan })
    )
  );

  localStorage.removeItem(STORAGE_KEY);
}
