import InputWithLabel from "../../../components/inputWithLabel";
import Buttons from "../../../components/button";

const StylerPersonalDetails = () => {
    return ( 
        <div>
          <p className="my-4 font-bold">Create an account:</p>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithLabel
                  labelName={"First name"}
                  inputType={"text"}
                  placeholder={"e.g John"}
                />
                <InputWithLabel
                  labelName={"Last name"}
                  inputType={"text"}
                  placeholder={"e.g Wick"}
                />
            </div>
            <InputWithLabel
              labelName={"Email address"}
              inputType={"email"}
              placeholder={"babayaga@gmail.com"}
            />
            <InputWithLabel
              labelName={"Phone number"}
              inputType={"tel"}
              placeholder={"(250) 555-0199"}
            />
          </div>
          <div className="mt-8">
            <Buttons btnText={'Continue'} btnType={'primary'} type={"submit"}/>
          </div>
        </div>
     );
}
 
export default StylerPersonalDetails;