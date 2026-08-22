import React, { useState, useEffect } from "react";
import close from "../assets/svg-icons/closeBlack.svg";
import Input from "../components/input";
import { Link } from "react-router-dom";
import { APIService } from "../hooks/remote/apiService";

const CreateAccountAdmin = () => {
  document.title = "Trimtech - Stylist Portal";

  const validID = ['Drivers license', 'Health card', 'Permanent residents card'];
  const [serviceTypes, setServiceTypes] = useState([]);
  const country = ['Canada',];
  const province = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'];

  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setServiceTypes(items.map(c => c.serviceTypeName || c.name || c.serviceType));
      })
      .catch(() => setServiceTypes([]));
  }, []);


  return (
    <div className="px-4 pt-10 pb-16 flex justify-center">
      <div className="w-[100%] md:w-[70%] lg:w-[60%]">

        <div className="col-span-2 flex mb-3">
          <img src={close} alt="close" className="h-5" />
        </div>

        <p className="text-xl font-bold">
          Welcome To <span className="text-brand">Trimtech</span> Stylists
          Portal!
        </p>
        <p>Create your account and start connecting with clients.</p>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <p className="text-brand font-semibold">1. Personal information</p>
          </div>
          <div>
            <Input label={"Fisrt name"} type={"text"} />
          </div>
          <div>
            <Input label={"Last name"} type={"text"} />
          </div>
          <div>
            <Input label={"Email address"} type={"email"} />
          </div>
          <div>
            <Input label={"Phone number"} type={"tel"} />
          </div>
          <div className="col-span-1 md:col-span-2">
            <Input label={"Physical address"} type={"text"} />
          </div>
          <div>
              <Input 
                label={"Select a valid ID"}
                variant={"select"}
                options={validID}
              />
          </div>
          <div>
            <Input 
            label={"Upload valid ID"}
            variant={"file"}
            />
          </div>
          <div>
            <Input 
            label={"Upload profile image"}
            variant={"file"}
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
            <p className="text-brand font-semibold">2. Business information</p>
          </div>
          <div>
            <Input label={"Business name"} type={"text"} />
          </div>
          <div>
            <Input 
              label={"Select service type"}
              variant={"select"}
              options={serviceTypes.length > 0 ? serviceTypes : ['Loading...']}
            />
          </div>
          <div>
            <Input 
              label={"Select country"}
              variant={"select"}
              options={country}
            />
          </div>
          <div>
            <Input 
              label={"Select province"}
              variant={"select"}
              options={province}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <Input label={"Business address"} type={"text"} />
          </div>
          <div className="mt-8 flex justify-center md:justify-start">
                <Link to={"/admin/dashboard"} className="py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountAdmin;
