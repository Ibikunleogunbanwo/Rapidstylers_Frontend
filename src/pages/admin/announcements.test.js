import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Announcements from './announcements';
import { APIService } from '../../hooks/remote/apiService';
import { AdminAPI } from '../../hooks/remote/adminApi';
vi.mock('../../hooks/remote/apiService', () => ({ APIService: { adminSendAnnouncement: vi.fn() } }));
vi.mock('../../hooks/remote/adminApi', () => ({ AdminAPI: { announcements: vi.fn(), announcementAudienceCount: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); sessionStorage.setItem('rapidstylers_auth_token','jwt'); sessionStorage.setItem('rapidstylers_admin_role','admin'); AdminAPI.announcements.mockResolvedValue([]); AdminAPI.announcementAudienceCount.mockResolvedValue({ count: 1204 }); });
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });
const fill = () => {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Holiday hours' } });
  fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: 'Closed Monday.' } });
};
it('asks before sending to everyone with the recipient count, then reports how many it reached', async () => {
  APIService.adminSendAnnouncement.mockResolvedValue({ data: { statusCode: '200', data: { sent: 12 } } });
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  await waitFor(() => expect(confirm).toHaveBeenCalledWith('Send this to 1,204 active customers? It cannot be recalled.'));
  expect(APIService.adminSendAnnouncement).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Send announcement' })).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Sent to 12 customers.');
  expect(APIService.adminSendAnnouncement).toHaveBeenCalledWith({ title: 'Holiday hours', message: 'Closed Monday.', recipientEmail: '' });
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(AdminAPI.announcements).toHaveBeenCalledTimes(2);
});
it('still asks, without a number, when the audience count is unavailable', async () => {
  AdminAPI.announcementAudienceCount.mockRejectedValue(new Error('404'));
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  await waitFor(() => expect(confirm).toHaveBeenCalledWith('Send this to every active customer? It cannot be recalled.'));
  expect(APIService.adminSendAnnouncement).not.toHaveBeenCalled();
});
it('sends to one customer by email without the everyone prompt, and shows backend errors', async () => {
  APIService.adminSendAnnouncement.mockResolvedValue({ data: { statusCode: '400', message: 'No customer with that email' } });
  const confirm = vi.spyOn(window, 'confirm');
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  fireEvent.click(screen.getByLabelText('One customer'));
  fireEvent.change(screen.getByLabelText('Customer email'), { target: { value: 'a@b.com' } });
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('No customer with that email');
  expect(APIService.adminSendAnnouncement).toHaveBeenCalledWith({ title: 'Holiday hours', message: 'Closed Monday.', recipientEmail: 'a@b.com' });
  expect(confirm).not.toHaveBeenCalled();
});
it('keeps Send disabled until there is a title and a message', () => {
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Send announcement' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: '   ' } });
  fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: 'Closed Monday.' } });
  expect(screen.getByRole('button', { name: 'Send announcement' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Hours' } });
  expect(screen.getByRole('button', { name: 'Send announcement' })).not.toBeDisabled();
  expect(APIService.adminSendAnnouncement).not.toHaveBeenCalled();
});
it('lists sent announcements, newest first as the backend returns them', async () => {
  AdminAPI.announcements.mockResolvedValue([{ title: 'Holiday hours', message: 'Closed Monday.', recipientCount: 1204, recipientEmail: null, sentAt: '2026-10-12 15:00:00', sentBy: 'ops@rapidstylers.ca' }, { title: 'Your refund', message: 'Done', recipientCount: 1, recipientEmail: 'a@b.com', sentAt: '2026-10-11 15:00:00', sentBy: null }]);
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  expect(await screen.findByText('Holiday hours')).toBeInTheDocument();
  expect(screen.getByText(/12 Oct 2026, 9:00 AM MDT · All customers · 1,204 recipients · by ops@rapidstylers.ca/)).toBeInTheDocument();
  expect(screen.getByText(/To a@b.com · 1 recipient$/)).toBeInTheDocument();
});
