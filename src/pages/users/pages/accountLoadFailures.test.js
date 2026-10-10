import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NotificationSettings from './notificationSettings';
import Notifications from './notifications';
import Loyalty from './loyalty';
import Support from './support';
vi.mock('../../../components/goBack', () => ({ default: () => null }));
vi.mock('../../../utils/constant', () => ({ getAuthToken: () => 'token', showSuccessToastMessage: vi.fn(), showErrorToastMessage: vi.fn() }));
vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { getNotificationPreferences: vi.fn(), updateNotificationPreferences: vi.fn(), listNotifications: vi.fn(), markNotificationRead: vi.fn(), deleteNotification: vi.fn(), deleteAllNotifications: vi.fn(), getLoyaltyAccount: vi.fn(), listSupportTickets: vi.fn() } }));
import { APIService } from '../../../hooks/remote/apiService';
beforeEach(() => vi.resetAllMocks());
test('failed preferences cannot overwrite existing preferences, and retry loads authoritative values', async () => {
 APIService.getNotificationPreferences.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({data:{data:{availability:false,price:false,verification:true}}});
 render(<NotificationSettings setPageTitle={vi.fn()} />);
 expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load/);
 expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
 expect(APIService.updateNotificationPreferences).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Retry'}));
 expect(await screen.findAllByRole('checkbox')).toHaveLength(3);
 expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
});
test.each([[Notifications,'listNotifications',/You have no notifications/],[Loyalty,'getLoyaltyAccount',/Available points/],[Support,'listSupportTickets',/No support tickets/]])('failed account load shows retry instead of empty/default data', async (Panel, method, emptyText) => {
 APIService[method].mockRejectedValue(new Error('offline'));
 render(<Panel setPageTitle={vi.fn()} />);
 expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load/);
 expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Retry'})).toBeEnabled();
});
test('notification read prevents repeat submission while pending', async () => {
 APIService.listNotifications.mockResolvedValue({data:{data:{items:[{id:'N1',title:'Hello',message:'Update',read:false}]}}});
 let finish;
 APIService.markNotificationRead.mockReturnValue(new Promise(resolve => {finish=resolve;}));
 render(<Notifications setPageTitle={vi.fn()} />);
 const notification=await screen.findByRole('button',{name:/Hello/});
 fireEvent.click(notification);
 expect(notification).toBeDisabled();
 fireEvent.click(notification);
 expect(APIService.markNotificationRead).toHaveBeenCalledTimes(1);
 await act(async()=>finish({}));
 await waitFor(()=>expect(notification).toBeEnabled());
});
test('a notification can be deleted, and clear all asks first', async () => {
 APIService.listNotifications.mockResolvedValue({data:{data:{items:[{id:'N1',title:'Hello',message:'Update',read:true},{id:'N2',title:'Booked',message:'Confirmed',read:true}]}}});
 APIService.deleteNotification.mockResolvedValue({});
 APIService.deleteAllNotifications.mockResolvedValue({});
 render(<Notifications setPageTitle={vi.fn()} />);
 await screen.findByText('Hello');
 fireEvent.click(screen.getAllByRole('button',{name:'Delete this notification'})[0]);
 await waitFor(()=>expect(screen.queryByText('Hello')).not.toBeInTheDocument());
 expect(APIService.deleteNotification).toHaveBeenCalledWith('N1');
 const confirm=vi.spyOn(window,'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
 fireEvent.click(screen.getByRole('button',{name:'Clear all'}));
 expect(APIService.deleteAllNotifications).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Clear all'}));
 expect(await screen.findByText(/You have no notifications/)).toBeInTheDocument();
 expect(APIService.deleteAllNotifications).toHaveBeenCalledTimes(1);
 confirm.mockRestore();
});
test('support fields have accessible labels', () => {
 APIService.listSupportTickets.mockResolvedValue({data:{data:[]}});
 render(<Support setPageTitle={vi.fn()} />);
 expect(screen.getByRole('textbox',{name:'Subject'})).toBeInTheDocument();
 expect(screen.getByRole('textbox',{name:'Describe the issue'})).toBeInTheDocument();
});
test('referral field has an accessible label', async () => {
 APIService.getLoyaltyAccount.mockResolvedValue({data:{data:{points:20}}});
 render(<Loyalty setPageTitle={vi.fn()} />);
 expect(await screen.findByRole('textbox',{name:'Apply a referral code'})).toBeInTheDocument();
});
test.each([[NotificationSettings,'getNotificationPreferences'],[Notifications,'listNotifications'],[Loyalty,'getLoyaltyAccount'],[Support,'listSupportTickets']])('malformed success cannot become authoritative account data', async (Panel,method)=>{
 APIService[method].mockResolvedValue({data:{}});
 render(<Panel setPageTitle={vi.fn()}/>);
 expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load/);
});
