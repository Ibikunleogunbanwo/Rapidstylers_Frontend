import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getStylerTypeList, stylerByService } from "../../../hooks/local/userReducer";

export function useStylerList(){
    const [stylerList, setStylerList] = useState([]);
    const dispatch = useDispatch();
    useEffect(()=>{
        const fetchAllStylerList = async()=>{
            try{
                const { payload } = await dispatch(getStylerTypeList());
                setStylerList(payload.data);
            }
            catch(e){}
        }
        fetchAllStylerList();
    },[dispatch]);
    return stylerList;
}
export function useStylerByCategoryList(serviceId){
    const [stylerCategoryList, setStylerCategoryList] = useState([]);
    const dispatch = useDispatch();
    useEffect(()=>{
        const fetchStylerByCategoryList = async()=>{
            try{
                const { payload } = await dispatch(stylerByService(serviceId));
                setStylerCategoryList(payload.data);
            }
            catch(e){}
        }
        fetchStylerByCategoryList();
    }, [dispatch, serviceId]);
    return stylerCategoryList;
}