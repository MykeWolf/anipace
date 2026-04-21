import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailSignup from "@/components/sections/EmailSignup";

const fetchMock = jest.fn();
global.fetch = fetchMock;

function okResponse() {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
}

function errResponse(error: string, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("EmailSignup component", () => {
  test("renders email input and submit button", () => {
    render(<EmailSignup />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
  });

  test("shows success message after valid submission", async () => {
    fetchMock.mockReturnValue(okResponse());
    render(<EmailSignup />);

    await userEvent.type(screen.getByRole("textbox"), "watcher@example.com");
    await userEvent.click(screen.getByRole("button", { name: /join/i }));

    expect(await screen.findByText(/you're in/i)).toBeInTheDocument();
  });

  test("clears email input on success", async () => {
    fetchMock.mockReturnValue(okResponse());
    render(<EmailSignup />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "watcher@example.com");
    await userEvent.click(screen.getByRole("button", { name: /join/i }));

    await screen.findByText(/you're in/i);
    // Input is gone (success state replaces the form)
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("shows API error message on failure", async () => {
    fetchMock.mockReturnValue(errResponse("Already subscribed", 409));
    render(<EmailSignup />);

    await userEvent.type(screen.getByRole("textbox"), "dupe@example.com");
    await userEvent.click(screen.getByRole("button", { name: /join/i }));

    expect(await screen.findByText("Already subscribed")).toBeInTheDocument();
  });

  test("disables input and button while loading", async () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<EmailSignup />);

    await userEvent.type(screen.getByRole("textbox"), "watcher@example.com");

    // Don't await — fetch is pending
    act(() => { screen.getByRole("button", { name: /join/i }).click(); });

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
