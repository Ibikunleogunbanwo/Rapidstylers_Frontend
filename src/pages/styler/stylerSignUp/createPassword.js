import Buttons from "../../../components/button";
import InputWithLabel from "../../../components/inputWithLabel";

const CreatePassword = () => {
    return ( 
    <div>
      <p className="my-4 font-bold">Create an account:</p>
          <div className="grid gap-4">
            <InputWithLabel
              labelName={"Set password"}
              inputType={"password"}
            />
            <InputWithLabel
              labelName={"Confirm password"}
              inputType={"password"}
            />
          </div>
          <div className="mt-8">
            <Buttons btnText={'Continue'} btnType={'primary'} type={"submit"}/>
          </div> 
          <div className="mt-6 text-[13px] text-gray-500 leading-relaxed">
            Your password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.
          </div>   
    </div>
    );
}
 
export default CreatePassword;