import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatsAppButton from "./WhatsAppButton";

describe("WhatsAppButton", () => {
  it("links to the workshop WhatsApp number in a new tab", () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole("link", { name: /chat with stahltech on whatsapp/i });

    expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/923338600603"));
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
