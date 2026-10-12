import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Availability from './stylerAvailability';
import Services from './stylerServices';
import Appointments from './stylerAppointments';
import Calendar from './stylerCalendar';
import MyWork from './myWork';
import Reviews from './reviews';
import Payouts from './stylerPayouts';
import Business from './stylerComponents/businessSummary';
import ReviewCard from './stylerComponents/reviewsSummary';
import { APIService } from '../../hooks/remote/apiService';
vi.mock('../../hooks/remote/apiService', () => ({ APIService: {
 stylerAvailability: vi.fn(), stylerAvailabilityExceptions: vi.fn(), stylerTravelSettings: vi.fn(),
 updateStylerTravelSettings: vi.fn(),
 listSubServices: vi.fn(), stylerAppointments: vi.fn(), getOwnPortfolio: vi.fn(), getOwnStylerReviews: vi.fn(), getStylerPayouts: vi.fn(), getStylerBusinessSummary: vi.fn(), createSubService: vi.fn(),
}}));
beforeEach(() => { vi.resetAllMocks(); sessionStorage.setItem('rapidstylers_auth_token', 'jwt'); });
const mount = (Component) => render(<MemoryRouter><Component /></MemoryRouter>);
it.each([[Availability,'stylerAvailability'], [Services,'listSubServices'], [Appointments,'stylerAppointments'], [Calendar,'stylerAppointments'], [MyWork,'getOwnPortfolio'], [Reviews,'getOwnStylerReviews'], [Payouts,'getStylerPayouts'], [Business,'getStylerBusinessSummary'], [ReviewCard,'getOwnStylerReviews']])('provides retry after %s fails to load', async (Component, method) => {
 APIService[method].mockRejectedValue(new Error('offline'));
 mount(Component);
 expect(await screen.findByRole('button', {name: /retry/i})).toBeEnabled();
});
it('blocks saving default availability and travel settings after a failed initial load', async () => {
 APIService.stylerAvailability.mockRejectedValue(new Error('offline'));
 mount(Availability);
 await screen.findByRole('button', {name: /retry/i});
 expect(screen.getByRole('button', {name: 'Save hours'})).toBeDisabled();
 expect(screen.getByRole('button', {name: 'Save home visit settings'})).toBeDisabled();
});
it.each(['0','-2','Infinity','abc'])('rejects nonpositive or nonfinite service price %s', async price => {
 APIService.listSubServices.mockResolvedValue({data: {data: []}});
 mount(Services);
 fireEvent.click(screen.getByText('+ Add a new service'));
 fireEvent.change(screen.getByPlaceholderText('e.g. Knotless braids'), {target: {value: 'Braids'}});
 fireEvent.change(screen.getByPlaceholderText('$0.00'), {target: {value: price}});
 fireEvent.click(screen.getByRole('button', {name: 'Add service'}));
 await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/positive|greater than zero/i));
 expect(APIService.createSubService).not.toHaveBeenCalled();
});
it('exposes revenue visibility as a named pressed button', async () => {
 APIService.getStylerBusinessSummary.mockResolvedValue({data: {data: {netRevenue: '42'}}});
 mount(Business);
 const button = screen.getByRole('button', {name: 'Show revenue'});
 expect(button).toHaveAttribute('aria-pressed','false');
 fireEvent.click(button);
 expect(await screen.findByText('$42.00')).toBeInTheDocument();
 expect(screen.getByRole('button', {name: 'Hide revenue'})).toHaveAttribute('aria-pressed','true');
});
it('labels portfolio photo and category controls', async () => {
 APIService.getOwnPortfolio.mockResolvedValue({data: {data: []}});
 mount(MyWork);
 expect(screen.getByLabelText('Photo')).toHaveAttribute('type','file');
 expect(screen.getByLabelText('Category')).toHaveRole('combobox');
});
it('retry restores authoritative availability before enabling saves', async () => {
 APIService.stylerAvailability.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({data: {data: [{dayOfWeek:'1',startTime:'10:00',endTime:'16:00'}]}});
 APIService.stylerAvailabilityExceptions.mockResolvedValue({data:{data:[]}});
 APIService.stylerTravelSettings.mockResolvedValue({data:{data:{includedTravelKm:8,baseTravelFee:'12.00'}}});
 mount(Availability);
 fireEvent.click(await screen.findByRole('button',{name:'Retry'}));
 await waitFor(() => expect(screen.getByRole('button',{name:'Save hours'})).toBeEnabled());
 expect(screen.getByDisplayValue('10:00')).toBeInTheDocument();
 expect(screen.getByDisplayValue('12.00')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Save home visit settings'})).toBeEnabled();
});
it('uses the professional calendar day at a UTC month boundary', async () => {
 vi.useFakeTimers({toFake:['Date']});
 vi.setSystemTime(new Date('2026-11-01T01:00:00Z'));
 APIService.stylerAppointments.mockResolvedValue({data:{data:[{appointmentId:'z',appointmentDate:'2026-10-31',arrivalTime:'18:00',statusCode:'3',stylerData:{timeZone:'America/Vancouver'}}]}});
 mount(Calendar);
 expect(await screen.findByText('October 2026')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'2026-10-31'})).toHaveAttribute('aria-current','date');
 vi.useRealTimers();
});
it.each([
 [{offersSalonVisits:false,offersHomeVisits:true,maxTravelKm:30}, {offersSalonVisits:false,offersHomeVisits:true,maxTravelKm:30}],
 [{offersSalonVisits:true,offersHomeVisits:false,maxTravelKm:null}, {offersSalonVisits:true,offersHomeVisits:false,maxTravelKm:null}],
 [{}, {}],
])('home-visit fee saves preserve loaded location options %s',async (options,expected)=>{
 APIService.stylerAvailability.mockResolvedValue({data:{data:[]}});
 APIService.stylerAvailabilityExceptions.mockResolvedValue({data:{data:[]}});
 APIService.stylerTravelSettings.mockResolvedValue({data:{data:{includedTravelKm:8,baseTravelFee:'12.00',...options}}});
 APIService.updateStylerTravelSettings.mockResolvedValue({data:{statusCode:'200',message:'Saved'}});
 mount(Availability);
 await waitFor(()=>expect(screen.getByRole('button',{name:'Save home visit settings'})).toBeEnabled());
 fireEvent.click(screen.getByRole('button',{name:'Save home visit settings'}));
 await waitFor(()=>expect(APIService.updateStylerTravelSettings).toHaveBeenCalledWith(8,'12.00',expected));
});
