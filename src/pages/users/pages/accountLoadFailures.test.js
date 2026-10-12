import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NotificationSettings from './notificationSettings';
import Notifications from './notifications';
import Loyalty from './loyalty';
import Support from './support';
vi.mock('../../../components/goBack', () => ({ default: () => null }));
vi.mock('../../../utils/constant', () => ({ getAuthToken: () => 'token', getUserRole: () => 'CUSTOMER', showSuccessToastMessage: vi.fn(), showErrorToastMessage: vi.fn() }));
vi.mock('../../../hooks/remote/apiClient', () => ({ ApiClient: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../userLayout/unreadNotifications', () => ({ announceUnreadNotifications: vi.fn() }));
vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { getNotificationPreferences: vi.fn(), updateNotificationPreferences: vi.fn(), listNotifications: vi.fn(), markNotificationRead: vi.fn(), deleteNotification: vi.fn(), deleteAllNotifications: vi.fn(), getLoyaltyAccount: vi.fn(), listSupportTickets: vi.fn() } }));
import { APIService } from '../../../hooks/remote/apiService';
import { ApiClient } from '../../../hooks/remote/apiClient';
import { formatNotificationTime } from './notifications';
beforeEach(() => { vi.resetAllMocks(); ApiClient.get.mockResolvedValue({data:{data:[]}}); });
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

test('notification times read as "Oct 11, 9:12 PM", with the year only when it differs (QA C-08)', () => {
 const now = new Date(2026, 9, 12);
 expect(formatNotificationTime('2026-10-11 21:12:25', now)).toBe('Oct 11, 9:12 PM');
 expect(formatNotificationTime('2025-01-02 08:05:00', now)).toBe('Jan 2, 2025, 8:05 AM');
 expect(formatNotificationTime('not a date', now)).toBe('not a date');
});
test('support fields show visible labels, counters, and an optional appointment line (QA C-11)', async () => {
 APIService.listSupportTickets.mockResolvedValue({data:{data:[]}});
 APIService.createSupportTicket = vi.fn().mockResolvedValue({});
 ApiClient.get.mockResolvedValue({data:{data:[{appointmentId:'A7',appointmentDate:'2026-10-20',stylerData:{businessName:'Keripe Salon'},subServiceData:{name:'Braids'}}]}});
 render(<Support setPageTitle={vi.fn()} />);
 fireEvent.change(screen.getByLabelText(/^Subject/),{target:{value:'Refund'}});
 expect(screen.getByText('6/120')).toBeInTheDocument();
 const picker = await screen.findByLabelText(/Related appointment/);
 fireEvent.change(picker,{target:{value:'A7'}});
 fireEvent.change(screen.getByLabelText(/^Describe the issue/),{target:{value:'Charged twice'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit ticket'}));
 await waitFor(()=>expect(APIService.createSupportTicket).toHaveBeenCalledWith({subject:'Refund',message:'Appointment A7 (Keripe Salon · Braids · 2026-10-20)\n\nCharged twice'}));
});
test('loyalty explains points, offers a copy button, and reports a refused code once, inline (QA C-10)', async () => {
 APIService.getLoyaltyAccount.mockResolvedValue({data:{data:{points:20,referralCode:'RS-ABC'}}});
 ApiClient.post.mockRejectedValue({response:{data:{message:'Invalid referral code'}}});
 Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue() } });
 render(<Loyalty setPageTitle={vi.fn()} />);
 expect(await screen.findByText(/10 points for each appointment/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Copy code'}));
 expect(navigator.clipboard.writeText).toHaveBeenCalledWith('RS-ABC');
 expect(await screen.findByRole('button',{name:'Copied'})).toBeInTheDocument();
 fireEvent.change(screen.getByRole('textbox',{name:'Apply a referral code'}),{target:{value:'abc'}});
 fireEvent.click(screen.getByRole('button',{name:'Apply'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Invalid referral code');
 expect(APIService.applyReferral).toBeUndefined();
});
test('notification settings confirm each save inline and explain booking emails (QA C-09)', async () => {
 APIService.getNotificationPreferences.mockResolvedValue({data:{data:{availability:true,price:true,verification:true}}});
 APIService.updateNotificationPreferences.mockResolvedValue({});
 render(<NotificationSettings setPageTitle={vi.fn()} />);
 const [first] = await screen.findAllByRole('checkbox');
 expect(screen.getByText(/always sent/)).toBeInTheDocument();
 fireEvent.click(first);
 expect(await screen.findByText(/^Saved\./)).toBeInTheDocument();
});
