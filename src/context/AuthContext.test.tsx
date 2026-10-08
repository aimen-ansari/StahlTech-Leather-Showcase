import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Mock supabase so we can simulate a stalled session check — the exact
// condition that used to leave the app on "Verifying Secure Session" forever —
// and to assert the auth listener never calls supabase synchronously (which
// deadlocked the auth lock and logged admins out).
const { getSessionMock, onAuthStateChangeMock, fromMock } = vi.hoisted(() => {
  const singleMock = vi.fn(() =>
    Promise.resolve({ data: { role: "admin" }, error: null })
  );
  return {
    getSessionMock: vi.fn(),
    onAuthStateChangeMock: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    fromMock: vi.fn(() => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: singleMock,
      };
      return chain;
    }),
  };
});

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: fromMock,
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

  it("never runs an authenticated supabase call inside the auth listener (no deadlock)", async () => {
    // A stored session exists and the profile check marks the user admin.
    getSessionMock.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText("no-session");

    // Grab the listener supabase-js registered, then fire TOKEN_REFRESHED the
    // way supabase-js does — while its auth lock is held.
    const listener = onAuthStateChangeMock.mock.calls[0][0];
    fromMock.mockClear();

    act(() => {
      // supabase-js invokes listeners synchronously while holding its lock;
      // simulate that. The listener must not call supabase here.
      listener("TOKEN_REFRESHED", { user: { id: "u2", email: "x@y.com" } });
    });

    // Synchronously inside the callback: no authenticated call is made.
    expect(fromMock).not.toHaveBeenCalled();

    // After the emit finishes, the deferred role check can run safely.
    await waitFor(() => expect(fromMock).toHaveBeenCalled());
    expect(screen.getByTestId("status")).toHaveTextContent("admin");
  });
});