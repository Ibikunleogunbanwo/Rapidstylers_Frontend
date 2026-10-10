import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Announcements from './announcements';
import { APIService } from '../../hooks/remote/apiService';
vi.mock('../../hooks/remote/apiService', () => ({ APIService: { adminSendAnnouncement: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); sessionStorage.setItem('rapidstylers_auth_token','jwt'); sessionStorage.setItem('rapidstylers_admin_role','admin'); });
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });
const fill = () => {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Holiday hours' } });
  fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: 'Closed Monday.' } });
};
it('asks before sending to everyone, then reports how many it reached', async () => {
  APIService.adminSendAnnouncement.mockResolvedValue({ data: { statusCode: '200', data: { sent: 12 } } });
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  expect(APIService.adminSendAnnouncement).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Sent to 12 customers.');
  expect(APIService.adminSendAnnouncement).toHaveBeenCalledWith({ title: 'Holiday hours', message: 'Closed Monday.', recipientEmail: '' });
  expect(confirm).toHaveBeenCalledTimes(2);
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
it('needs a title and a message', () => {
  render(<MemoryRouter><Announcements /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Send announcement' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Add a title and a message.');
  expect(APIService.adminSendAnnouncement).not.toHaveBeenCalled();
});
