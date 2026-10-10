import { renderHook, waitFor } from '@testing-library/react';
import { useStylerList, useStylerByCategoryList, useSingleStylerProfile, useUserPendingAppointments, useAllUserAppointments } from './functionalEffects';
const dispatch=vi.fn();
vi.mock('react-redux',()=>({useDispatch:()=>dispatch,useSelector:(selector)=>selector({user:{userSessionData:{userId:'U1'}}})}));
vi.mock('../../../hooks/local/userReducer',()=>({getStylerTypeList:vi.fn(),stylerByService:vi.fn(),singleStylerProfile:vi.fn(),userPendingAppointments:vi.fn(),allUserAppointments:vi.fn()}));
test.each([useStylerList,useStylerByCategoryList,useSingleStylerProfile,useUserPendingAppointments,useAllUserAppointments])('rejected thunk cannot poison hook data',async hook=>{
 dispatch.mockResolvedValue({meta:{requestStatus:'rejected'},payload:{data:undefined}});
 const {result}=renderHook(()=>hook('S1'));
 await waitFor(()=>expect(dispatch).toHaveBeenCalled());
 await new Promise(resolve=>setTimeout(resolve,0));
 expect(result.current).toEqual([]);
});
test('state mode exposes a failed read and supports retry',async()=>{
 dispatch.mockResolvedValueOnce({error:{message:'offline'}}).mockResolvedValue({payload:{data:[]}});
 const {result}=renderHook(()=>useStylerList({withState:true}));
 await waitFor(()=>expect(result.current.error).toBeTruthy());
 result.current.retry();
 await waitFor(()=>expect(result.current.error).toBe(''));
 expect(result.current.loading).toBe(false);
});
