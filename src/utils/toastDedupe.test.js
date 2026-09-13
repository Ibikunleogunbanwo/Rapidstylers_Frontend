import { render, cleanup, waitFor } from "@testing-library/react";
import { ToastContainer, toast } from "react-toastify";
import { showErrorToastMessage } from "./constant";

/**
 * The real library, not a mock.
 *
 * Collapsing several identical reports into one visible toast is react-toastify's
 * behaviour, driven by the `toastId` the helper passes — so `constant.test.js`,
 * which mocks the library, can only assert that the id is passed. Whether a
 * reader actually sees one toast can only be asserted against a real container,
 * which is what this file does.
 *
 * Each test uses its own message text: a toast id that is still active would
 * make a later call update the existing toast instead of creating one, and a
 * shared id across tests would make the counts meaningless.
 */
const countToasts = (container) =>
  container.querySelectorAll(".Toastify__toast").length;

describe("one failure reports once", () => {
  afterEach(() => {
    toast.dismiss();
    cleanup();
  });

  test("the home page's worst case — six identical reports — shows one toast", async () => {
    const message =
      "Unable to reach the server. Please check your connection and try again. (test: home load)";

    const { container } = render(<ToastContainer />);

    // Three components ask for the service list, and StrictMode runs each mount
    // effect twice in development: six failures, six reports, one toast.
    for (let i = 0; i < 6; i += 1) {
      showErrorToastMessage(message);
    }

    await waitFor(() => expect(countToasts(container)).toBe(1));
    // Still one after the transitions settle, not a transient collapse.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(countToasts(container)).toBe(1);
  });

  test("two different failures still read as two problems", async () => {
    const { container } = render(<ToastContainer />);

    showErrorToastMessage("Could not load your saved professionals. (test: a)");
    showErrorToastMessage("Could not load your notifications. (test: b)");

    await waitFor(() => expect(countToasts(container)).toBe(2));
  });
});
