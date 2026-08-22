import HeroInput from "./heroInput"
import HeroSelect from "./heroSelect";
import Buttons from "./button";
import { useState, useEffect } from "react";
import { APIService } from "../hooks/remote/apiService";

const SearchForStyler = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        APIService.getStylerType()
            .then((res) => {
                const items = res.data?.data || [];
                setCategories(items.map((c) => ({
                    value: c.serviceTypeId || c.id,
                    label: c.serviceTypeName || c.name || c.serviceType,
                })));
            })
            .catch(() => {});
    }, []);

    const options = categories.length > 0
        ? categories
        : [{ value: "", label: "Select service..." }];

    return (
      <div className="text-white mt-10 justify-center flex">
        <div className="bg-white p-5 md:p-1 rounded-md w-full grid md:flex items-center gap-4 md:gap-2">
          <HeroInput
            inputType={"search"}
            placeholder={"Search for a professional..."}
          />
          <HeroSelect
            selectOptions={options}
            valueKey={"value"}
            labelKey={"label"}
            selectName={"Select service"}
          />
          <Buttons btnType={"primary"} btnText={"Search"} type={"submit"} />
        </div>
      </div>
    );
}

export default SearchForStyler;
