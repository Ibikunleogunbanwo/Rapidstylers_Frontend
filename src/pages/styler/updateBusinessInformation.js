import Button from "../../components/button";
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
          <div className="md:col-span-2 mb-6">
            <InputWithLabel
              labelName={"Physical address"}
              inputType={"text"}
              inputName={"businessAddress"}
            />
            {/* Same rule as signup: this is where clients travel to. */}
            <p className="mt-1.5 text-xs leading-[1.5] text-gray-500">
              Clients travel here when they book a visit, so this must be a place they can
              come to, not a mailing address. Removing it takes you out of search until a
              new one is on file.
            </p>
          </div>

          <Button text={"Update details"} variant={"primary"} />
        </div>
      </div>
    </div>
  );
}

export default BusinessInformation;
