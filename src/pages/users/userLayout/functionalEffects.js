import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allUserAppointments, getStylerTypeList, singleStylerProfile, stylerByService, userPendingAppointments } from "../../../hooks/local/userReducer";

function useRemoteData(actionCreator, key, options = {}) {
  const dispatch = useDispatch();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: [], loading: true, error: "" });
  useEffect(() => {
    let current = true;
    setState({ data: [], loading: true, error: "" });
    (async () => {
      try {
        const action = await dispatch(actionCreator(key));
        if (action.meta?.requestStatus === "rejected" || action.error || action.payload?.data == null) throw new Error("Failed read");
        if (current) setState({ data: action.payload.data, loading: false, error: "" });
      } catch {
        if (current) setState({ data: [], loading: false, error: "Could not load this information. Please try again." });
      }
    })();
    return () => { current = false; };
  }, [dispatch, actionCreator, key, attempt]);
  return options.withState ? { ...state, retry: () => setAttempt(value => value + 1) } : state.data;
}
export function useStylerList(options) { return useRemoteData(getStylerTypeList, undefined, options); }
export function useStylerByCategoryList(serviceId, options) { return useRemoteData(stylerByService, serviceId, options); }
export function useSingleStylerProfile(stylerId, options) { return useRemoteData(singleStylerProfile, stylerId, options); }
export function useUserPendingAppointments(options) {
  const userId = useSelector(state => state.user.userSessionData?.userId);
  return useRemoteData(userPendingAppointments, userId, options);
}
export function useAllUserAppointments(options) {
  const userId = useSelector(state => state.user.userSessionData?.userId);
  return useRemoteData(allUserAppointments, userId, options);
}
