import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { userLogOut } from "../../../hooks/local/userReducer";

const LogOut = () => {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state)=>state.user.isAuthenticated);
    
    useEffect(()=>{
        dispatch(userLogOut());
    },[dispatch]);

    if(!isAuthenticated){
        return <Navigate to={'/'}/>
    }
    
}
 
export default LogOut;