import Back from "../components/goBack";
// import { Link } from "react-router-dom";
import Input from "../components/input";

const PaymentDetails = () => {
    document.title="Payment details - TrimTech"
    return ( 
        <div className="bg-white rounded-lg border">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Payment details.</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={"Cardholder name:"} type={"text"}/>
        <Input label={"Card number:"} type={"number"}/>
        <Input label={"Expiration date:"} type={"number"}/>
        <Input label={"CVV:"} type={"number"}/>
        <Input label={"Email address:"} type={"email"}/>
        <Input label={"Phone number:"} type={"tel"}/>
        <div className="col-span-1 md:col-span-2">
            <p className="text-sm">By checking this box, you acknowledge that you have read and agree to the terms and conditions of our service. This includes understanding and consenting to our policies regarding the storage and usage of your provided data. Please take a moment to review our comprehensive terms and conditions, which outline the guidelines and expectations for the use of our platform. If you have any questions or concerns, feel free to contact our support team for clarification. Your use of this service is subject to compliance with these terms.</p>
            <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" name="" id=""/>
            <span className="mb-[2px] text-sm">I have read and agree to the terms and conditions.</span>
            </div>
        </div>
        <div className="col-span-1 md:col-span-2"><button className="bg-brand px-6 py-4 md:py-3 text-sm text-white rounded-md">Save payment details</button></div>
      </div>
    </div>
     );
}
 
export default PaymentDetails;