import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Mock supabase so we can simulate a stalled session check — the exact
// condition that used to leave the app on "Verifying Secure Session" forever.
const { getSessionMock, onAuthStateChangeMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}));

vi.mock("../lib/supabase", () => ({ 
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn(() =>
          Promise.resolve({ data: { role: "admin" }, error: null })
        ),
      };
      return chain;
    },
  },
  isSupabaseConfigured: true,
}));

function Probe() {
  const { loading, isAdmin } = useAuth();
  if (loading) return <div data-testid="status">loading</div>;
  return <div data-testid="status">{isAdmin ? "admin" : "no-session"}</div>;
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("AuthProvider", () => {
  it("resolves the loading screen even when getSession hangs forever", async () => {
    vi.useFakeTimers();
    // Never settles — previously this kept `loading` true indefinitely,
    // showing the "Verifying Secure Session" page forever.
    getSessionMock.mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId("status")).toHaveTextContent("loading");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000); // SESSION_TIMEOUT_MS
    });

    expect(screen.getByTestId("status")).toHaveTextContent("no-session");
  });

  it("recognises an admin when the session and role query succeed", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "a@b.com" } } },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await screen.findByText("admin");
  });
});