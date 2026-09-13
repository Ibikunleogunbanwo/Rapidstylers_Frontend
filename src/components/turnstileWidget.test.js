import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import TurnstileWidget from "./turnstileWidget";

const SITE_KEY = "1x00000000000000000000AA";
const SCRIPT_ID = "cf-turnstile-script";

/** Stub of the Cloudflare api.js global, capturing the options it was rendered with. */
function stubTurnstile() {
  const widget = {
    render: vi.fn(() => "widget-1"),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  window.turnstile = widget;
  return widget;
}

const lastRenderOptions = (widget) => widget.render.mock.calls[widget.render.mock.calls.length - 1][1];

afterEach(() => {
  delete window.turnstile;
  document.getElementById(SCRIPT_ID)?.remove();
});

describe("TurnstileWidget", () => {
  test("renders nothing and loads no script when no site key is configured", () => {
    const { container } = render(<TurnstileWidget siteKey="" onVerify={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
    expect(document.getElementById(SCRIPT_ID)).toBeNull();
  });

  test("renders the challenge with the configured site key", () => {
    const widget = stubTurnstile();
    const { container } = render(<TurnstileWidget siteKey={SITE_KEY} onVerify={vi.fn()} />);

    expect(container.firstChild).not.toBeNull();
    expect(widget.render).toHaveBeenCalledTimes(1);
    expect(widget.render.mock.calls[0][1].sitekey).toBe(SITE_KEY);
  });

  test("passes the token to onVerify when the challenge is solved", () => {
    const widget = stubTurnstile();
    const onVerify = vi.fn();
    render(<TurnstileWidget siteKey={SITE_KEY} onVerify={onVerify} />);

    act(() => lastRenderOptions(widget).callback("solved-token"));

    expect(onVerify).toHaveBeenCalledWith("solved-token");
  });

  test("clears the token when the challenge expires or errors", () => {
    const widget = stubTurnstile();
    const onVerify = vi.fn();
    render(<TurnstileWidget siteKey={SITE_KEY} onVerify={onVerify} />);

    act(() => lastRenderOptions(widget)["expired-callback"]());
    expect(onVerify).toHaveBeenLastCalledWith("");

    act(() => lastRenderOptions(widget)["error-callback"]());
    expect(onVerify).toHaveBeenLastCalledWith("");
  });

  /**
   * The reset matters because a Turnstile token is single use: without it a
   * second sign-in attempt would submit the spent token and be rejected with a
   * confusing "complete the challenge" error even after the user solved it.
   */
  test("resets the widget and clears the token when resetSignal changes", async () => {
    const widget = stubTurnstile();
    const onVerify = vi.fn();
    const { rerender } = render(
      <TurnstileWidget siteKey={SITE_KEY} onVerify={onVerify} resetSignal={0} />
    );

    rerender(<TurnstileWidget siteKey={SITE_KEY} onVerify={onVerify} resetSignal={1} />);

    await waitFor(() => expect(widget.reset).toHaveBeenCalledWith("widget-1"));
    expect(onVerify).toHaveBeenLastCalledWith("");
  });

  test("loads the Cloudflare script and renders once it is available", async () => {
    const onVerify = vi.fn();
    render(<TurnstileWidget siteKey={SITE_KEY} onVerify={onVerify} />);

    const script = document.getElementById(SCRIPT_ID);
    expect(script).not.toBeNull();
    expect(script.src).toContain("challenges.cloudflare.com");

    // The global appears only after the script executes.
    const widget = stubTurnstile();
    act(() => script.onload());

    expect(widget.render).toHaveBeenCalledTimes(1);
  });

  test("tears the widget down on unmount", () => {
    const widget = stubTurnstile();
    const { unmount } = render(<TurnstileWidget siteKey={SITE_KEY} onVerify={vi.fn()} />);

    unmount();

    expect(widget.remove).toHaveBeenCalledWith("widget-1");
  });
});
