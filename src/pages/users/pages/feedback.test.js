import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Feedback from './feedback';
let dispatch;
vi.mock('react-redux',()=>({useDispatch:()=>dispatch,useSelector:(selector)=>selector({user:{loading:false,userSessionData:{userId:'U1',emailAddress:'customer@example.com'}}})}));
vi.mock('../../../hooks/local/userReducer',()=>({addUserFeedBack:(values)=>values}));
vi.mock('../../../components/spinner',()=>({default:()=>null}));
vi.mock('../../../components/input',()=>({default:({label,onError,...props})=><label>{label}<input {...props}/></label>}));
vi.mock('../../../components/selectInput',()=>({default:({selectOptions,selectValue,onChange,selectName})=><select aria-label="Feedback Type" name={selectName} value={selectValue} onChange={onChange}>{selectOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>}));
vi.mock('../../../components/button',()=>({default:({text,...props})=><button {...props}>{text}</button>}));
test.each(['rejected','fulfilled'])('feedback awaits %s dispatch and preserves or resets form correctly',async status=>{
 dispatch=vi.fn().mockResolvedValue({meta:{requestStatus:status},payload:status==='fulfilled'?{statusCode:'200'}:undefined,error:status==='rejected'?{message:'Offline'}:undefined});
 render(<Feedback setPageTitle={vi.fn()}/>);
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'Report a bug'}});
 fireEvent.change(screen.getByPlaceholderText('Start typing...'),{target:{value:'The calendar failed'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 if(status==='rejected'){
 expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to submit/);
 expect(screen.getByPlaceholderText('Start typing...')).toHaveValue('The calendar failed');
 }else await waitFor(()=>expect(screen.getByPlaceholderText('Start typing...')).toHaveValue(''));
});
