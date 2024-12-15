import { useState } from "react";
import deleteIcon from "../../assets/svg-icons/delete.svg";
import editIcon from "../../assets/svg-icons/edit.svg";
import close from "../../assets/svg-icons/closeBlack.svg";
import deleteGIF from "../../assets/svg-icons/trashGIF.gif";
import Input from "../../components/input";
import Buttons from "../../components/button";

const Services = () => {
    const [deleteServiceModal, setDeleteServiceModal] = useState(false);
    const [editServiceModal, setEditServiceModal] = useState(false);
    const [addServiceModal, setAddServiceModal] = useState(false);

    const toggleDeleteModal = () => {
        setDeleteServiceModal(true);
    };

    const closeDeleteModal = () => {
      setDeleteServiceModal(false);
  };

  const toggleEditModal = () => {
    setEditServiceModal(true);
};

const closeEditModal = () => {
  setEditServiceModal(false);
};

const toggleAddModal = () => {
  setAddServiceModal(true);
};

const closeAddModal = () => {
setAddServiceModal(false);
};

  return (
    <div className="rounded-md border">
      <div className="border-b p-4 font-medium text-sm flex gap-4 justify-between items-center">
        <span>My services</span>
        <span className="text-brand text-xs cursor-pointer" onClick={toggleAddModal}>[ Add a new service ]</span>
      </div>
      <div className="">
         <div className="overflow-x-auto m-2">
          <table class="w-full text-sm text-left bg-primary">
            <thead class=" border-b border-lightPrimary">
              <tr>
              <th scope="col" class="px-4 py-4 whitespace-nowrap">
                  No.
                </th>
                <th scope="col" class="px-4 py-4 whitespace-nowrap">
                  Service name
                </th>
                <th scope="col" class="px-4 py-4 whitespace-nowrap">
                  Amount
                </th>
                <th scope="col" class="px-4 py-4 whitespace-nowrap">
                  Duration
                </th>
                <th scope="col" class="px-4 py-4 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
                <tr className="hover:bg-[#c4c4c424] cursor-default">
                    <td className="text-start py-5 ps-4">1</td>
                    <td className="text-start py-5 ps-4 truncate max-w-48 md:max-w-80">Special haircut - (skin fade, blow out, mohawk) sdkljanljdbavhbsdufbouebouebroubeogboeubebsob</td>
                    <td className="text-start py-5 ps-4">$38.00</td>
                    <td className="text-start py-5 ps-4">30mins</td>
                    <td className="text-start py-5 ps-4 flex gap-6">
                      <span><img src={deleteIcon} alt="" className="h-[18px] cursor-pointer" onClick={toggleDeleteModal}/></span>
                      <span><img src={editIcon} alt="" className="h-[18px] cursor-pointer" onClick={toggleEditModal}/></span>
                    </td>
                </tr>
                <tr className="hover:bg-[#c4c4c424] cursor-default">
                    <td className="text-start py-5 ps-4">2</td>
                    <td className="text-start py-5 ps-4 truncate max-w-48 md:max-w-80">Special haircut - (skin fade, blow out, mohawk) sdkljanljdbavhbsdufbouebouebroubeogboeubebsob</td>
                    <td className="text-start py-5 ps-4">$38.00</td>
                    <td className="text-start py-5 ps-4">30mins</td>
                    <td className="text-start py-5 ps-4 flex gap-6">
                      <span><img src={deleteIcon} alt="" className="h-[18px] cursor-pointer" onClick={toggleDeleteModal}/></span>
                      <span><img src={editIcon} alt="" className="h-[18px] cursor-pointer" onClick={toggleEditModal}/></span>
                    </td>
                </tr>
                <tr className="hover:bg-[#c4c4c424] cursor-default">
                    <td className="text-start py-5 ps-4">3</td>
                    <td className="text-start py-5 ps-4 truncate max-w-48 md:max-w-80">Special haircut - (skin fade, blow out, mohawk) sdkljanljdbavhbsdufbouebouebroubeogboeubebsob</td>
                    <td className="text-start py-5 ps-4">$38.00</td>
                    <td className="text-start py-5 ps-4">30mins</td>
                    <td className="text-start py-5 ps-4 flex gap-6">
                      <span><img src={deleteIcon} alt="" className="h-[18px] cursor-pointer" onClick={toggleDeleteModal}/></span>
                      <span><img src={editIcon} alt="" className="h-[18px] cursor-pointer" onClick={toggleEditModal}/></span>
                    </td>
                </tr>
            </tbody>
          </table>
        </div>
        {
          deleteServiceModal && (
            <div className="h-screen fixed top-0 left-0 bg-black/50 w-full z-50 p-4 flex justify-center items-center">
            <div className="bg-white max-h-[90%] overflow-auto w-full md:w-1/2 lg:w-1/3 rounded-md">
              <div className="p-4 md:p-6 border-b font-medium bg-white sticky top-0 flex justify-between items-center text-sm">
                <div className="text-rose-500">Delete service</div><div className="cursor-pointer"><img src={close} alt="" className="h-4" onClick={closeDeleteModal}/></div>
              </div>
              <div className="p-4 md:p-6 text-center justify-center grid gap-6">
                <div className="flex justify-center">
                  <img src={deleteGIF} alt="" className="h-10"/>
                </div>
                <p className="text-gray-500">This service will be removed. <br /> You won't be able to undo this action</p>
                <div className="flex justify-center">
                  <div className="text-xs font-medium p-4 rounded-md bg-rose-500 text-white w-fit">Yes, delete service</div>
                </div>
              </div>
            </div>
        </div>
          )
        }

{
          editServiceModal && (
            <div className="h-screen fixed top-0 left-0 bg-black/50 w-full z-50 p-4 flex justify-center items-center">
            <div className="bg-white max-h-[90%] overflow-auto w-full md:w-1/2 lg:w-1/3 rounded-md">
              <div className="p-4 md:p-6 border-b font-medium bg-white sticky top-0 flex justify-between items-center text-sm">
                <div>Edit service</div><div className="cursor-pointer"><img src={close} alt="" className="h-4" onClick={closeEditModal}/></div>
              </div>
              <div className="p-4 md:p-6 grid gap-4">
                <Input label={"Service name:"} placeholder={"Sample service name"}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={"Amount:"} placeholder={"$0.00"}/>
                <Input label={"Duration:"} placeholder={"30mins"}/>
              </div>
              <Buttons btnType={"primary"} btnText={"Save"}/>
              </div>
            </div>
        </div>
          )
        }

{
          addServiceModal && (
            <div className="h-screen fixed top-0 left-0 bg-black/50 w-full z-50 p-4 flex justify-center items-center">
            <div className="bg-white max-h-[90%] overflow-auto w-full md:w-1/2 lg:w-1/3 rounded-md">
              <div className="p-4 md:p-6 border-b font-medium bg-white sticky top-0 flex justify-between items-center text-sm">
                <div>Add new service</div><div className="cursor-pointer"><img src={close} alt="" className="h-4" onClick={closeAddModal}/></div>
              </div>
              <div className="p-4 md:p-6 grid gap-4">
                <Input label={"Service name:"} placeholder={"Sample service name"}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={"Amount:"} placeholder={"$0.00"}/>
                <Input label={"Duration:"} placeholder={"30mins"}/>
              </div>
              <Buttons btnType={"primary"} btnText={"Add service"}/>
              </div>
            </div>
        </div>
          )
        }


      </div>
    </div>
  );
};

export default Services;
