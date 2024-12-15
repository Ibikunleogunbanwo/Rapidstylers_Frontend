import InputWithLabel from "../../../components/inputWithLabel";
import Buttons from "../../../components/button";
import { useState } from "react";

const BusinessDetails = () => {
  const [selected, setSelected] = useState("barber");
  const handleSelect = (option) => {
    setSelected(option);
  };

  const activeStyle =
    "text-sm text-center bg-brand text-white truncate rounded p-4 cursor-pointer";
  const inactiveStyle =
    "text-sm text-center truncate bg-[#c4c4c416] rounded p-4 border cursor-pointer";

  return (
    <div>
      <p className="my-4 font-bold">Please provide your business information:</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div onClick={() => handleSelect("barber")} className={selected === "barber" ? activeStyle : inactiveStyle}>
          I'm a barber
        </div>
        <div onClick={() => handleSelect("hairdresser")} className={selected === "hairdresser" ? activeStyle : inactiveStyle}>
          I'm a hairdresser
        </div>
        <p className="hidden">Selected: {selected}</p>
      </div>
      <div className="grid gap-4">
        <InputWithLabel
          labelName={"Business name"}
          inputType={"text"}
          placeholder={"The continental"}
        />
        <InputWithLabel
          labelName={"Physical address"}
          inputType={"text"}
          placeholder={"Business name"}
        />
      </div>
      <div className="mt-8">
        <Buttons btnText={"Continue"} btnType={"primary"} type={"submit"} />
      </div>
    </div>
  );
};

export default BusinessDetails;
