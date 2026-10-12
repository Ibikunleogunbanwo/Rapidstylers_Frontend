import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StylerChangePassword from "./stylerChangePassword";
import { ApiClient } from "../../hooks/remote/apiClient";
import { getAuthToken, getRefreshToken, showSuccessToastMessage } from "../../utils/constant";

vi.mock("../../utils/constant", async (importOriginal) => ({ ...(await importOriginal()), showSuccessToastMessage: vi.fn() }));

const mount = () => render(<MemoryRouter><StylerChangePassword /></MemoryRouter>);
const fill = (oldPassword, password, confirmPassword) => {
  fireEvent.change(screen.getByLabelText("Old Password:"), { target: { value: oldPassword } });
  fireEvent.change(screen.getByLabelText("New Password:"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm Password:"), { target: { value: confirmPassword } });
  fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
};

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

it("posts to /update_styler_password and keeps this device signed in with the new tokens", async () => {
  const post = vi.spyOn(ApiClient, "post").mockResolvedValue({ data: { statusCode: "200", message: "Password updated", token: "new-jwt", refreshToken: "new-refresh" } });
  mount();
  fill("OldPass1!", "NewPass2!", "NewPass2!");
  await waitFor(() => expect(post).toHaveBeenCalledWith("/update_styler_password", { oldPassword: "OldPass1!", password: "NewPass2!", confirmPassword: "NewPass2!" }));
  await waitFor(() => expect(getAuthToken()).toBe("new-jwt"));
  expect(getRefreshToken()).toBe("new-refresh");
  expect(showSuccessToastMessage).toHaveBeenCalledWith("Password updated");
  await waitFor(() => expect(screen.getByLabelText("Old Password:")).toHaveValue(""));
});

it("applies the shared password rule before sending", async () => {
  const post = vi.spyOn(ApiClient, "post");
  mount();
  fill("OldPass1!", "Abcdefg1%", "Abcdefg1%");
  expect(await screen.findByText(/special character/, { selector: "p" })).toBeInTheDocument();
  fill("OldPass1!", "NewPass2!", "NewPass3!");
  expect(await screen.findByText("Passwords must match")).toBeInTheDocument();
  expect(post).not.toHaveBeenCalled();
});

it("shows the server's refusal inline and keeps the old token", async () => {
  sessionStorage.setItem("rapidstylers_auth_token", "old-jwt");
  vi.spyOn(ApiClient, "post").mockRejectedValue({ response: { data: { statusCode: "400", message: "Old password is incorrect" } } });
  mount();
  fill("Wrong1!x", "NewPass2!", "NewPass2!");
  expect(await screen.findByRole("alert")).toHaveTextContent("Old password is incorrect");
  expect(getAuthToken()).toBe("old-jwt");
});

it("links back to My profile", () => {
  mount();
  expect(screen.getByRole("link", { name: "Back to My profile" })).toHaveAttribute("href", "/styler-dashboard/profile");
});
