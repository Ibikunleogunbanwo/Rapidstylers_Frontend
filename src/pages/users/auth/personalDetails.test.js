import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PersonalDetails from "./personalDetails";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));
vi.mock("../../../components/AddressAutocomplete", () => ({ default: () => null }));

const renderStep = () => render(<MemoryRouter><PersonalDetails /></MemoryRouter>);
const set = (name, value) => fireEvent.change(document.querySelector(`[name="${name}"]`), { target: { value } });

beforeEach(() => { navigate.mockClear(); sessionStorage.clear(); });

it("rejects digits in names, a bad city, too many phone digits and an invalid area code", async () => {
  renderStep();
  set("firstname", "John123");
  set("lastname", "<b>");
  set("city", "Toronto 2");
  set("phoneNumber", "416555123456");
  expect(document.querySelector('[name="phoneNumber"]')).toHaveValue("416555123456");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText(/First name can only contain letters/)).toBeInTheDocument();
  expect(screen.getByText(/Last name can only contain letters/)).toBeInTheDocument();
  expect(screen.getByText(/City can only contain letters/)).toBeInTheDocument();
  expect(screen.getByText(/Too many digits/)).toBeInTheDocument();
  expect(screen.getByText("Select a province or territory")).toBeInTheDocument();
  set("phoneNumber", "1234567890");
  expect(await screen.findByText(/cannot start with 0 or 1/)).toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
});

it("trims names and saves the province from the dropdown", async () => {
  renderStep();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Personal details");
  set("firstname", "  Li ");
  set("lastname", " O'Brien ");
  set("street", "123 Main Street");
  set("city", " Toronto ");
  set("province", "Ontario");
  set("postalCode", "m5v2t6");
  set("phoneNumber", "4165551234");
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("/secureAccount"));
  const saved = JSON.parse(sessionStorage.getItem("userProfileData"));
  expect(saved).toMatchObject({ firstname: "Li", lastname: "O'Brien", state: "Ontario", phoneNumber: "4165551234" });
  expect(saved.address).toContain("Toronto, Ontario M5V 2T6");
});
