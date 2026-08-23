import { Link } from "react-router-dom";
import search from "../../../assets/svg-icons/search.svg";
import { useEffect, useState } from "react";
import Spinner from "../../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import Back from "../../../components/goBack";
import { searchStyler } from "../../../hooks/local/userReducer";
import ServiceCard from "../../../components/serviceCard";

const SearchStyler = ({ setPageTitle, stylerSearchName }) => {
  useEffect((() => {
    setPageTitle("Book Appointment");
    document.title = "Search | RapidStylers";
  }));
  const dispatch = useDispatch();
  const [userSearchWord, setUserSearchWord] = useState(stylerSearchName);
  const [stylerProfileData, setStylerProfileData] = useState([]);

  const searchForAStyler = async()=>{
    try{
        const { payload } = await dispatch(searchStyler(userSearchWord));
        setStylerProfileData(payload.data);
    }
    catch(e){}
  }
  useEffect(()=>{
    searchForAStyler();
    // Intentionally runs only when the parent's search term changes (or on mount).
    // Manual searches go through the Search button, so searchForAStyler is not a
    // dependency — including it (or memoizing it on userSearchWord) would fire a
    // network request on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[stylerSearchName]);

  return (
    <div className="bg-white border rounded-lg">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center justify-between border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <div className="flex gap-2 items-center">
          <Back />
          <span>Search for a professional.</span>
        </div>
      
      </div>
      <div className="p-4">
        <div className="text-sm grid gap-4 md:flex md:justify-between ">
          <p>
            Current location:{" "}
            <span className="font-medium text-brand">Edmonton, Canada</span>
          </p>
          <p className="text-brand">[ Change location ]</p>
        </div>
        <div className="my-6 overflow-hidden rounded-[4px]">
          <span className="border w-full rounded-[4px] bg-white flex items-center gap-3 p-1">
            <img src={search} alt="" className="h-5 ps-4" />
            <input
              type="search"
              value={userSearchWord}
              onChange={(e)=>setUserSearchWord(e.target.value)}
              className="w-full active:border-0 active:outline-0 focus:border-0 focus:outline-0 placeholder:text-sm"
              placeholder="Search for a professional"
            />
              <button onClick={searchForAStyler} className="bg-brand text-sm h-full flex gap-2 items-center text-white py-4 md:py-3 px-5 rounded" >
                <span>Search</span>
              </button>
           
          </span>
        </div>
   
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {
          stylerProfileData.length > 0
            ? (
                stylerProfileData.map((val, key) => {
                return (
                  <div className="grid grid-cols-1 gap-4">
                    <Link to={`/stylistProfile/${btoa(val.stylerId)}/${btoa(val.businessName)}`}>
                      <ServiceCard
                        coverImg={val.profileImageUrl}
                        name={val.businessName}
                        status={val.visibilityStatus}
                        distance={"24km"}
                        rating={"5.0"}
                        reviews={"200"}
                      />
                    </Link>
                  </div>
                )
              })
            )
            :
            (
              <div>
                No professionals found with that name.
              </div>
            )
        }

        </div>
      </div>
      <div className="p-4">
        <p className="text-red-500 font-semibold">Disclaimer.</p>
        <p className="text-red-400">
          Connecting with stylists outside the app can be risky. To ensure your
          safety and security, please only use our platform to book
          appointments.
        </p>
      </div>
    </div>
  );
};

export default SearchStyler;
