import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

const mockUser = { id: "user-123", email: "watcher@example.com" };

function makeAuthClient(user: typeof mockUser | null) {
  const signOut = jest.fn().mockResolvedValue({ error: null });
  const signInWithOAuth = jest.fn().mockResolvedValue({ error: null });
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signOut,
      signInWithOAuth,
    },
    _signOut: signOut,
    _signInWithOAuth: signInWithOAuth,
  };
}

beforeEach(() => jest.clearAllMocks());

describe("AuthButton", () => {
  test("shows Sign In button when signed out", async () => {
    (createClient as jest.Mock).mockReturnValue(makeAuthClient(null));
    await act(async () => { render(<AuthButton />); });
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("shows user email and Sign Out when signed in", async () => {
    (createClient as jest.Mock).mockReturnValue(makeAuthClient(mockUser));
    render(<AuthButton />);
    await screen.findByText("watcher@example.com");
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  test("clicking Sign In triggers Google OAuth", async () => {
    const client = makeAuthClient(null);
    (createClient as jest.Mock).mockReturnValue(client);
    await act(async () => { render(<AuthButton />); });
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(client._signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" })
    );
  });

  test("clicking Sign Out calls signOut", async () => {
    const client = makeAuthClient(mockUser);
    (createClient as jest.Mock).mockReturnValue(client);
    render(<AuthButton />);
    await screen.findByRole("button", { name: /sign out/i });
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(client._signOut).toHaveBeenCalled();
  });
});
