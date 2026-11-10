import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import Contact from "./Contact";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { functions: { invoke: mocks.invoke } },
}));

vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function fillForm(overrides: Partial<Record<"name" | "email" | "message", string>> = {}) {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: overrides.name ?? "Jane Doe" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: overrides.email ?? "jane@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^message$/i), {
    target: { value: overrides.message ?? "I would like a custom bullwhip." },
  });
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));
}

describe("Contact form", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("sends the inquiry through the send-contact-inquiry function", async () => {
    mocks.invoke.mockResolvedValue({ data: { success: true, emailSent: true }, error: null });

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith("send-contact-inquiry", {
        body: {
          name: "Jane Doe",
          email: "jane@example.com",
          subject: "Custom Whip Commission",
          message: "I would like a custom bullwhip.",
          website: "",
        },
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
  });

  it("shows an error instead of a success message when the request fails", async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error("FunctionsFetchError") });

    render(<Contact />);
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("FunctionsFetchError");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("disables the submit button while the inquiry is in flight", async () => {
    let resolveInvoke: (value: unknown) => void = () => {};
    mocks.invoke.mockImplementation(
      () => new Promise((resolve) => {
        resolveInvoke = resolve;
      }),
    );

    render(<Contact />);
    fillForm();
    submitForm();

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    resolveInvoke({ data: { success: true }, error: null });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send inquiry/i })).not.toBeDisabled();
    });
  });
});
