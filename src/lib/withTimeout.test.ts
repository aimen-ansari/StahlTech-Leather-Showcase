import { describe, it, expect, vi, afterEach } from "vitest";
import { withTimeout } from "./withTimeout";

afterEach(() => {
  vi.useRealTimers();
});

describe("withTimeout", () => {
  it("resolves with the promise result when it settles in time", async () => {
    const p = new Promise((resolve) => setTimeout(() => resolve("ok"), 5));
    await expect(withTimeout(p, 1000, "too slow")).resolves.toBe("ok");
  });

  it("rejects with the timeout message when the promise never settles", async () => {
    vi.useFakeTimers();
    const never = new Promise(() => {});
    const raced = withTimeout(never, 1000, "timed out");
    vi.advanceTimersByTime(1000);
    await expect(raced).rejects.toThrow("timed out");
  });

  it("clears the timer once the promise settles", async () => {
    vi.useFakeTimers();
    const fast = Promise.resolve("done");
    const raced = withTimeout(fast, 1000, "timed out");
    await expect(raced).resolves.toBe("done");
    // No pending timers should remain after the race settles.
    expect(vi.getTimerCount()).toBe(0);
  });
});