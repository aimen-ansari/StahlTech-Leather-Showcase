import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import InquiriesPanel from "./InquiriesPanel";

const mocks = vi.hoisted(() => {
  const state: Record<string, any> = {};
  state.order = vi.fn();
  state.select = vi.fn(() => ({ order: state.order }));
  state.updateEq = vi.fn();
  state.update = vi.fn(() => ({ eq: state.updateEq }));
  state.deleteEq = vi.fn();
  state.delete = vi.fn(() => ({ eq: state.deleteEq }));
  state.channelObject = {};
  state.channelOn = vi.fn(() => state.channelObject);
  state.channelSubscribe = vi.fn(() => state.channelObject);
  state.channelObject = { on: state.channelOn, subscribe: state.channelSubscribe };
  state.channel = vi.fn(() => state.channelObject);
  state.removeChannel = vi.fn();
  state.from = vi.fn(() => ({
    select: state.select,
    update: state.update,
    delete: state.delete,
  }));
  return state;
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mocks.from,
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const inquiries = [
  {
    id: "1",
    name: "Alice Rivera",
    email: "alice@example.com",
    subject: "Custom Whip Commission",
    message: "I would like a 10ft bullwhip in brandy leather.",
    is_read: false,
    created_at: "2026-11-10T10:00:00Z",
  },
  {
    id: "2",
    name: "Bob Chen",
    email: "bob@example.com",
    subject: "Wholesale/Export Partnership",
    message: "Do you ship to Singapore?",
    is_read: true,
    created_at: "2026-11-09T09:00:00Z",
  },
];

describe("InquiriesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.order.mockResolvedValue({ data: inquiries, error: null });
    mocks.updateEq.mockResolvedValue({ error: null });
    mocks.deleteEq.mockResolvedValue({ error: null });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("lists inquiries and reports the unread count", async () => {
    const onUnreadCountChange = vi.fn();

    render(<InquiriesPanel onUnreadCountChange={onUnreadCountChange} />);

    expect(await screen.findByText("Alice Rivera")).toBeInTheDocument();
    expect(screen.getByText("Bob Chen")).toBeInTheDocument();
    expect(screen.getByText(/brandy leather/)).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(onUnreadCountChange).toHaveBeenCalledWith(1);
    expect(mocks.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("marks an inquiry as read", async () => {
    render(<InquiriesPanel />);

    const button = await screen.findByRole("button", {
      name: /mark inquiry from alice rivera as read/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith({ is_read: true });
      expect(mocks.updateEq).toHaveBeenCalledWith("id", "1");
    });

    await waitFor(() => {
      expect(screen.queryByText("New")).not.toBeInTheDocument();
    });
  });

  it("deletes an inquiry after confirmation", async () => {
    render(<InquiriesPanel />);

    const button = await screen.findByRole("button", {
      name: /delete inquiry from alice rivera/i,
    });
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(mocks.delete).toHaveBeenCalled();
      expect(mocks.deleteEq).toHaveBeenCalledWith("id", "1");
    });

    await waitFor(() => {
      expect(screen.queryByText("Alice Rivera")).not.toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith("Inquiry deleted.");
    });
  });

  it("filters inquiries by the search term", async () => {
    render(<InquiriesPanel />);
    await screen.findByText("Alice Rivera");

    fireEvent.change(screen.getByPlaceholderText(/search name, email, message/i), {
      target: { value: "singapore" },
    });

    expect(screen.getByText("Bob Chen")).toBeInTheDocument();
    expect(screen.queryByText("Alice Rivera")).not.toBeInTheDocument();
  });
});
