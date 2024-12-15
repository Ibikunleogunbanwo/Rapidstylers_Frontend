
import Buttons from "../../components/button";
import Back from "../../components/goBack";
import InputWithLabel from "../../components/inputWithLabel";

const PersonalInformation = () => {
    return (
      <div className="rounded-md border">
        <div className="flex items-center gap-3 border-b p-4 text-sm font-medium">
          <Back />
          <span>Personal information</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWithLabel
              labelName={"Full name"}
              inputType={"text"}
              placeholder={"e.g John Smith"}
              inputName={"fullName"}
            />
            <InputWithLabel
              labelName={"Email address"}
              inputType={"email"}
              placeholder={"e.g John@gmail.com"}
              inputName={"email"}
            />
            <InputWithLabel
              labelName={"Phone number"}
              inputType={"number"}
              inputName={"phoneNumber"}
            />
<br />
           <div className="mt-6">
               <Buttons btnText={"Update details"} btnType={"primary"} />
           </div>
          </div>
        </div>
      </div>
    );
}
 
export default PersonalInformation;