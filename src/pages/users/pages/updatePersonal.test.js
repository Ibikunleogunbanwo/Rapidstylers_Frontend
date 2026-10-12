import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UpdateInformation from "./updatePersonal";
import { phoneProblem, provinceName, PERSON_NAME_PATTERN, CITY_PATTERN } from "./customerProfileRules";

vi.mock("../../../components/goBack", () => ({ default: () => null }));
vi.mock("../../../components/spinner", () => ({ default: () => null }));
vi.mock("../../../components/AddressAutocomplete", () => ({ default: () => null }));
vi.mock("../../../hooks/local/userReducer", () => ({
  getUserDetails: () => ({ type: "details" }),
  updateUserDetails: (data) => ({ type: "update", data }),
}));
const dispatched = [];
let state;
vi.mock("react-redux", () => ({
  useSelector: (selector) => selector(state),
  useDispatch: () => (action) => { dispatched.push(action); return Promise.resolve({ payload: { statusCode: "200" } }); },
}));

const details = {
  emailAddress: "ada@example.com", firstname: "Ada", lastname: "Lovelace", phoneNumber: "4035550123",
  address: "1 Main St, Calgary, AB T2P 1B5, Canada", state: "AB", country: "Canada",
};
const renderForm = (userData = details) => {
  state = { user: { loading: false, userDetailsData: { userData } } };
  dispatched.length = 0;
  return render(<UpdateInformation setPageTitle={vi.fn()} />);
};

describe("shared validation rules (contracts.md)", () => {
  test.each(["O'Brien", "José", "Nguyễn", "Anne-Marie", "St. John", "李", "Li"])("accepts the name %s", (name) => {
    expect(PERSON_NAME_PATTERN.test(name)).toBe(true);
  });
  test.each(["Ada1", "<b>", "Ada 😀", "'Ada", "-", ""])("rejects the name %j", (name) => {
    expect(PERSON_NAME_PATTERN.test(name)).toBe(false);
  });
  test("cities follow the same letters rule", () => {
    expect(CITY_PATTERN.test("Saint-Jérôme")).toBe(true);
    expect(CITY_PATTERN.test("Calgary 2")).toBe(false);
  });
  test("phones need exactly 10 NANP digits (or 11 with a leading 1), never truncated", () => {
    expect(phoneProblem("")).toBeNull();
    expect(phoneProblem("(403) 555-0123")).toBeNull();
    expect(phoneProblem("+1 403 555 0123")).toBeNull();
    expect(phoneProblem("40355501234")).toMatch(/10-digit/);
    expect(phoneProblem("123 555 0123")).toMatch(/valid Canadian/);
    expect(phoneProblem("403 155 0123")).toMatch(/valid Canadian/);
    expect(phoneProblem("403-555-01x3")).toMatch(/digits only/);
  });
  test("provinces map codes and Québec to the dropdown's full names", () => {
    expect(provinceName("ab")).toBe("Alberta");
    expect(provinceName("Québec")).toBe("Quebec");
    expect(provinceName("prince edward island")).toBe("Prince Edward Island");
    expect(provinceName("Karachi")).toBe("");
  });
});

describe("Update personal information (QA C-12)", () => {
  test("shows the email, clear labels, required markers, and province/country dropdowns", () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("First name")).toHaveAttribute("autocomplete", "given-name");
    expect(screen.getByLabelText("Last name")).toHaveValue("Lovelace");
    expect(screen.getByLabelText(/^City/)).toBeRequired();
    const province = screen.getByLabelText(/^Province or territory/);
    expect(province.tagName).toBe("SELECT");
    expect(province).toHaveValue("Alberta");
    expect(screen.getAllByRole("option").filter((o) => o.closest("select") === province && o.value)).toHaveLength(13);
    expect(screen.getByLabelText("Country").tagName).toBe("SELECT");
    expect(screen.queryByText("Firstname:")).not.toBeInTheDocument();
  });

  test("accepts O'Brien and José and sends trimmed, normalized values", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "  José " } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "O'Brien" } });
    fireEvent.change(screen.getByLabelText(/^Phone number/), { target: { value: "+1 (587) 555-0199" } });
    fireEvent.change(screen.getByLabelText(/^Postal code/), { target: { value: "t2p1b5" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Information" }));
    await waitFor(() => expect(dispatched.find((a) => a.type === "update")).toBeTruthy());
    expect(dispatched.find((a) => a.type === "update").data).toEqual({
      emailAddress: "ada@example.com", phoneNumber: "5875550199", firstname: "José", lastname: "O'Brien",
      country: "Canada", address: "1 Main St, Calgary, Alberta T2P 1B5, Canada", state: "Alberta",
    });
  });

  test("rejects digits in names and an over-long phone instead of trimming it", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada2" } });
    fireEvent.change(screen.getByLabelText(/^Phone number/), { target: { value: "403555012345" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Information" }));
    expect(await screen.findByText(/First name can contain letters/)).toBeInTheDocument();
    expect(screen.getByText("Enter a 10-digit phone number")).toBeInTheDocument();
    expect(dispatched.find((a) => a.type === "update")).toBeUndefined();
  });
});
