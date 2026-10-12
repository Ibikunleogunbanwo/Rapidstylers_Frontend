import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookingPromo from "./bookingPromo";
import { APIService } from "../hooks/remote/apiService";
vi.mock("../hooks/remote/apiService", () => ({ APIService: { checkPromoCode: vi.fn() } }));
vi.mock("../utils/constant", () => ({ getAuthToken: () => "customer-token" }));
test("uses the server discount and invalidates it when the total changes", async () => {
  APIService.checkPromoCode.mockResolvedValue({data:{statusCode:"200",data:{code:"WELCOME",discount:10,total:50}}});
  const onChange=vi.fn();const {rerender}=render(<BookingPromo subtotal={60} onChange={onChange}/>);
  fireEvent.change(screen.getByLabelText("Promo code (optional)"),{target:{value:"welcome"}});
  fireEvent.click(screen.getByRole("button",{name:"Apply"}));
  await screen.findByText("WELCOME: −$10.00 CAD");
  expect(APIService.checkPromoCode).toHaveBeenCalledWith({code:"welcome",subtotal:"60"});
  rerender(<BookingPromo subtotal={80} onChange={onChange}/>);
  await waitFor(()=>expect(onChange).toHaveBeenLastCalledWith(null));
  expect(screen.queryByText("WELCOME: −$10.00 CAD")).toBeNull();
});
test("an invalid code never produces a discount",async()=>{
  APIService.checkPromoCode.mockRejectedValue({response:{data:{message:"That code has expired"}}});
  const onChange=vi.fn();render(<BookingPromo subtotal={60} onChange={onChange}/>);
  fireEvent.change(screen.getByLabelText("Promo code (optional)"),{target:{value:"OLD"}});
  fireEvent.click(screen.getByRole("button",{name:"Apply"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("That code has expired");
  expect(onChange).toHaveBeenLastCalledWith(null);
});
