import { createClient } from "@/lib/supabase/client";
import {
  loadUserPlans,
  saveUserPlan,
  deleteUserPlan,
  migrateFromLocalStorage,
} from "@/lib/planStorage";
import {
  loadPlans as lsLoad,
  savePlan as lsSave,
  deletePlan as lsDelete,
} from "@/lib/localStorage";
import type { SavedPlan } from "@/types";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/localStorage", () => ({
  loadPlans: jest.fn(),
  savePlan: jest.fn(),
  deletePlan: jest.fn(),
}));

const mockUser = { id: "user-123", email: "test@example.com" };

const mockPlan: SavedPlan = {
  id: "plan-1",
  animeTitle: "Naruto",
  animeMalId: 20,
  coverImage: "https://example.com/naruto.jpg",
  totalEpisodes: 220,
  episodeDuration: 23,
  startDate: "2026-04-20",
  createdAt: "2026-04-20T00:00:00.000Z",
  weeks: [],
  summary: {
    totalWeeks: 28,
    episodesPerWeekAvg: 7.9,
    totalWatchHours: 84.3,
    projectedFinishDate: "2026-10-20",
  },
};

type Resolver = Parameters<Promise<unknown>["then"]>[0];
type Rejecter = Parameters<Promise<unknown>["then"]>[1];

function makeChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> & { then: (resolve: Resolver, reject?: Rejecter) => Promise<unknown> } = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error }),
    then(resolve: Resolver, reject?: Rejecter) {
      return Promise.resolve({ data, error }).then(
        resolve as Parameters<Promise<unknown>["then"]>[0],
        reject as Parameters<Promise<unknown>["then"]>[1]
      );
    },
  };
  (chain.select as jest.Mock).mockReturnValue(chain);
  (chain.eq as jest.Mock).mockReturnValue(chain);
  (chain.delete as jest.Mock).mockReturnValue(chain);
  return chain;
}

function makeClient(
  user: typeof mockUser | null,
  queryData: unknown = null,
  queryError: unknown = null
) {
  const chain = makeChain(queryData, queryError);
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: jest.fn().mockReturnValue(chain),
    _chain: chain,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (lsLoad as jest.Mock).mockReturnValue([]);
  (lsSave as jest.Mock).mockReturnValue(true);
  (lsDelete as jest.Mock).mockReturnValue(true);
});

// ── loadUserPlans ─────────────────────────────────────────────────────────────

describe("loadUserPlans", () => {
  test("delegates to localStorage when signed out", async () => {
    const client = makeClient(null);
    (createClient as jest.Mock).mockReturnValue(client);
    (lsLoad as jest.Mock).mockReturnValue([mockPlan]);

    const result = await loadUserPlans();

    expect(lsLoad).toHaveBeenCalled();
    expect(result).toEqual([mockPlan]);
  });

  test("queries Supabase when signed in", async () => {
    const rows = [{ data: mockPlan }];
    const client = makeClient(mockUser, rows, null);
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await loadUserPlans();

    expect(client.from).toHaveBeenCalledWith("plans");
    expect(result).toEqual([mockPlan]);
    expect(lsLoad).not.toHaveBeenCalled();
  });

  test("falls back to localStorage on Supabase error", async () => {
    const client = makeClient(mockUser, null, { message: "network error" });
    (createClient as jest.Mock).mockReturnValue(client);
    (lsLoad as jest.Mock).mockReturnValue([mockPlan]);

    const result = await loadUserPlans();

    expect(lsLoad).toHaveBeenCalled();
    expect(result).toEqual([mockPlan]);
  });
});

// ── saveUserPlan ──────────────────────────────────────────────────────────────

describe("saveUserPlan", () => {
  test("delegates to localStorage when signed out", async () => {
    const client = makeClient(null);
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await saveUserPlan(mockPlan);

    expect(lsSave).toHaveBeenCalledWith(mockPlan);
    expect(result).toBe(true);
  });

  test("upserts to Supabase when signed in", async () => {
    const client = makeClient(mockUser);
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await saveUserPlan(mockPlan);

    expect(client.from).toHaveBeenCalledWith("plans");
    expect((client._chain.upsert as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockPlan.id, user_id: mockUser.id })
    );
    expect(result).toBe(true);
    expect(lsSave).not.toHaveBeenCalled();
  });

  test("returns false on Supabase error", async () => {
    const client = makeClient(mockUser, null, { message: "constraint violation" });
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await saveUserPlan(mockPlan);

    expect(result).toBe(false);
  });
});

// ── deleteUserPlan ────────────────────────────────────────────────────────────

describe("deleteUserPlan", () => {
  test("delegates to localStorage when signed out", async () => {
    const client = makeClient(null);
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await deleteUserPlan("plan-1");

    expect(lsDelete).toHaveBeenCalledWith("plan-1");
    expect(result).toBe(true);
  });

  test("deletes from Supabase when signed in", async () => {
    const client = makeClient(mockUser);
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await deleteUserPlan("plan-1");

    expect(client.from).toHaveBeenCalledWith("plans");
    expect((client._chain.delete as jest.Mock)).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(lsDelete).not.toHaveBeenCalled();
  });

  test("returns false on Supabase error", async () => {
    const client = makeClient(mockUser, null, { message: "not found" });
    (createClient as jest.Mock).mockReturnValue(client);

    const result = await deleteUserPlan("plan-1");

    expect(result).toBe(false);
  });
});

// ── migrateFromLocalStorage ───────────────────────────────────────────────────

describe("migrateFromLocalStorage", () => {
  test("no-op when signed out", async () => {
    const client = makeClient(null);
    (createClient as jest.Mock).mockReturnValue(client);
    const removeItem = jest.spyOn(Storage.prototype, "removeItem");

    await migrateFromLocalStorage();

    expect(lsLoad).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    removeItem.mockRestore();
  });

  test("no-op when signed in but no local plans", async () => {
    const client = makeClient(mockUser);
    (createClient as jest.Mock).mockReturnValue(client);
    (lsLoad as jest.Mock).mockReturnValue([]);
    const removeItem = jest.spyOn(Storage.prototype, "removeItem");

    await migrateFromLocalStorage();

    expect(client.from).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    removeItem.mockRestore();
  });

  test("upserts each plan and clears localStorage key when signed in", async () => {
    const client = makeClient(mockUser);
    (createClient as jest.Mock).mockReturnValue(client);
    (lsLoad as jest.Mock).mockReturnValue([mockPlan]);
    const removeItem = jest.spyOn(Storage.prototype, "removeItem");

    await migrateFromLocalStorage();

    expect((client._chain.upsert as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ id: mockPlan.id, user_id: mockUser.id })
    );
    expect(removeItem).toHaveBeenCalledWith("anipace_plans");
    removeItem.mockRestore();
  });
});
