import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import AccessibleDialog, { AccessibleModal, DialogCloseButton } from "./accessibleDialog";

const Harness = ({ keepMounted = false }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <AccessibleDialog open={open} onClose={() => setOpen(false)} labelledBy="t" keepMounted={keepMounted}>
        <h2 id="t">Book a time</h2>
        <button type="button">First</button>
        <input aria-label="Middle" />
        <DialogCloseButton onClick={() => setOpen(false)} />
      </AccessibleDialog>
    </>
  );
};

describe("AccessibleDialog", () => {
  it("is a labelled modal dialog that takes focus and returns it on Escape", () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Book a time" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });

  it("keeps Tab inside the dialog in both directions", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const first = screen.getByRole("button", { name: "First" });
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(close).toHaveFocus();
  });

  it("hides rather than unmounts when keepMounted", () => {
    render(<Harness keepMounted />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe("AccessibleModal", () => {
  it("names the dialog by its title and closes from the labelled button", () => {
    const onClose = vi.fn();
    render(<AccessibleModal isVisible onClose={onClose} modalTitle="Sign up"><p>body</p></AccessibleModal>);
    expect(screen.getByRole("dialog", { name: "Sign up" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
