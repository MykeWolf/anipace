/**
 * @jest-environment node
 */
import { POST } from "@/app/api/subscribe/route";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

function req(body: unknown) {
  return new NextRequest("http://localhost/api/subscribe", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeClient(error: unknown = null) {
  const insertFn = jest.fn().mockResolvedValue({ error });
  const fromFn = jest.fn().mockReturnValue({ insert: insertFn });
  return { client: { from: fromFn }, _from: fromFn, _insert: insertFn };
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/subscribe", () => {
  test("returns 400 when email is missing", async () => {
    const { client } = makeClient();
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await POST(req({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  test("returns 400 when email format is invalid", async () => {
    const { client } = makeClient();
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await POST(req({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  test("returns 200 and success:true on valid new email", async () => {
    const { client } = makeClient(null);
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await POST(req({ email: "watcher@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("returns 409 on duplicate email (unique constraint)", async () => {
    const { client } = makeClient({ code: "23505", message: "duplicate" });
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await POST(req({ email: "watcher@example.com" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already/i);
  });

  test("returns 500 on unexpected Supabase error", async () => {
    const { client } = makeClient({ code: "PGRST999", message: "db down" });
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await POST(req({ email: "watcher@example.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
