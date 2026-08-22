import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allUserAppointments, getStylerTypeList, singleStylerProfile, stylerByService, userPendingAppointments } from "../../../hooks/local/userReducer";

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

export function useSingleStylerProfile(stylerId){
    const [stylerProfile, setStylerProfile] = useState([]);
    const dispatch = useDispatch();
    useEffect(()=>{
        const fetchStylerProfile = async()=>{
            try{
                const {payload} = await dispatch(singleStylerProfile(stylerId));
                setStylerProfile(payload.data);
            }
            catch(e){}
        }
        fetchStylerProfile();
    }, [dispatch,stylerId]);
    return stylerProfile;
}

export function useUserPendingAppointments(){
    const userId = useSelector((state)=>state.user.userSessionData).userId;
    const [appointment, setAppointment] = useState([]);
    const dispatch = useDispatch();
    useEffect(()=>{
        const fetchAllPendingAppointment = async()=>{
            try{
                const {payload} = await dispatch(userPendingAppointments(userId));
                setAppointment(payload.data);
            }
            catch(e){}
        }
        fetchAllPendingAppointment();
    },[dispatch, userId])
    return appointment;
}

export function useAllUserAppointments(){
    const userId = useSelector((state)=>state.user.userSessionData).userId;
    const [appointment, setAppointment] = useState([]);
    const dispatch = useDispatch();
    useEffect(()=>{
        const fetchAllAppointment = async()=>{
            try{
                const {payload} = await dispatch(allUserAppointments(userId));
                setAppointment(payload.data);
            }
            catch(e){}
        }
        fetchAllAppointment();
    },[dispatch, userId])
    return appointment;
}

