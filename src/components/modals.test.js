import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./modals";

describe("Modal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("renders nothing when not visible", () => {
    const { container } = render(
      <Modal isVisible={false} onClose={jest.fn()} modalTitle="Test">
        <p>content</p>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
    expect(document.querySelector(".fixed.inset-0")).toBeNull();
  });

  test("portals the overlay directly under document.body", () => {
    render(
      <Modal isVisible onClose={jest.fn()} modalTitle="Test">
        <p>content</p>
      </Modal>
    );

    const overlay = document.querySelector(".fixed.inset-0");
    expect(overlay).not.toBeNull();
    // The portal escapes any filtered/transformed ancestor (the header's
    // backdrop-blur used to hijack position: fixed), so the overlay must be a
    // direct child of <body>.
    expect(overlay.parentElement).toBe(document.body);
  });

  test("anchors the overlay to the viewport with explicit offsets and z-index", () => {
    render(
      <Modal isVisible onClose={jest.fn()} modalTitle="Test">
        <p>content</p>
      </Modal>
    );

    const overlay = document.querySelector(".fixed.inset-0");
    expect(overlay.className).toContain("inset-0");
    expect(overlay.className).toContain("z-50");
    // Tall content scrolls inside the overlay instead of pushing off-screen.
    expect(overlay.className).toContain("overflow-y-auto");

    // The card is width-capped inside the padded overlay and height-capped
    // with internal scrolling, so it can never exceed the viewport.
    const card = overlay.querySelector(".bg-white.rounded-md");
    expect(card.className).toContain("w-full");
    expect(card.className).toContain("max-h-[90%]");
    expect(card.className).toContain("overflow-y-auto");
    expect(card.className).toContain("my-auto");
  });

  test("shows the title, renders children, and the close button calls onClose", () => {
    const onClose = jest.fn();
    render(
      <Modal isVisible onClose={onClose} modalTitle="Add new service">
        <p>Service form here</p>
      </Modal>
    );

    expect(screen.getByText("Add new service")).toBeInTheDocument();
    expect(screen.getByText("Service form here")).toBeInTheDocument();

    fireEvent.click(screen.getByAltText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
