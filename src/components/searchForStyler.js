import HeroInput from "./heroInput"
import HeroSelect from "./heroSelect";
import Buttons from "./button";

const SearchForStyler = () => {

    const stylers = [
        { value: 'Hairstylists', label: 'Hairstylists' },
        { value: 'Barbers', label: 'Barbers' },
      ];

    return (
      <div className="text-white mt-10 justify-center flex">
        <div className="bg-white p-5 md:p-1 rounded-md w-full grid md:flex items-center gap-4 md:gap-2">
          <HeroInput
            inputType={"search"}
            placeholder={"Search for stylist..."}
          />
          <HeroSelect
            selectOptions={stylers}
            valueKey={"value"}
            labelKey={"label"}
            selectName={"Select styler"}
          />
          <Buttons btnType={"primary"} btnText={"Search"} type={"submit"} />
        </div>
      </div>
    );
}
 
export default SearchForStyler;