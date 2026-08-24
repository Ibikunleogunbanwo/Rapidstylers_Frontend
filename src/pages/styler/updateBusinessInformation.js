import Buttons from "../../components/button";
import Back from "../../components/goBack";
import InputWithLabel from "../../components/inputWithLabel";
import SelectInput from "../../components/selectInput";
import { useState, useEffect } from "react";
import { APIService } from "../../hooks/remote/apiService";

const BusinessInformation = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setCategories(
          items.map((c) => ({
            value: c.serviceTypeId || c.id,
            label: c.serviceTypeName || c.serviceName || c.name || c.serviceType,
          }))
        );
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 border-b p-4 text-sm font-medium">
        <Back />
        <span>Business information</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectInput
            labelName={"Category"}
            selectOptions={loading ? [] : categories}
            valueKey={"value"}
            labelKey={"label"}
            selectName={"category"}
          />
          <InputWithLabel
            labelName={"Business name"}
            inputType={"text"}
            placeholder={"e.g RapidStylers"}
            inputName={"businessName"}
          />
          <div className="md:col-span-2 mb-6"><InputWithLabel
            labelName={"Physical address"}
            inputType={"text"}
            inputName={"businessAddress"}
          /></div>

          <Buttons btnText={"Update details"} btnType={"primary"} />
        </div>
      </div>
    </div>
  );
}

export default BusinessInformation;
