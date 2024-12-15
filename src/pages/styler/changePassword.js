
import Buttons from "../../components/button";
import Back from "../../components/goBack";
import InputWithLabel from "../../components/inputWithLabel";

const ChangePassword = () => {
    return (
      <div className="rounded-md border">
        <div className="flex items-center gap-3 border-b p-4 text-sm font-medium">
          <Back />
          <span>Change password</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWithLabel
              labelName={"Current password"}
              inputType={"password"}
              inputName={"password"}
            />
            <InputWithLabel
              labelName={"New password"}
              inputType={"password"}
              inputName={"newPassword"}
            />
            
           <div className="mt-6">
               <Buttons btnText={"Update details"} btnType={"primary"} />
           </div>
          </div>
        </div>
      </div>
    );
}
 
export default ChangePassword;