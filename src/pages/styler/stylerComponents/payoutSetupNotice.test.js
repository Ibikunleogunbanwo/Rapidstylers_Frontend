import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PayoutSetupNotice from './payoutSetupNotice';
import { APIService } from '../../../hooks/remote/apiService';

vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { getStylerConnectStatus: vi.fn() } }));

const flush = () => act(async () => { await Promise.resolve(); });
const mount = async (route = '/styler-dashboard', payload) => {
  APIService.getStylerConnectStatus.mockResolvedValue({ data: { data: payload } });
  render(<MemoryRouter initialEntries={[route]}><PayoutSetupNotice /></MemoryRouter>);
  await flush();
};

beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { cleanup(); });

it('stays silent once payout setup is complete', async () => {
  await mount('/styler-dashboard', { status: 'COMPLETE', payoutsWaiting: 0 });
  expect(screen.queryByText(/payout setup/i)).not.toBeInTheDocument();
});

it('stays silent when the status cannot be read', async () => {
  APIService.getStylerConnectStatus.mockRejectedValue(new Error('offline'));
  render(<MemoryRouter initialEntries={['/styler-dashboard']}><PayoutSetupNotice /></MemoryRouter>);
  await flush();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('prompts a stylist who has not started, with the money waiting for them', async () => {
  await mount('/styler-dashboard', { status: 'NOT_STARTED', payoutsWaiting: 2, payoutsWaitingAmount: '$80.00' });
  expect(screen.getByText('Finish your payout setup to get paid')).toBeInTheDocument();
  expect(screen.getByText(/\$80\.00 is waiting for you across 2 completed appointments/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Go to Payouts' })).toHaveAttribute('href', '/styler-dashboard/payouts');
});

it('tells a stylist whose account Stripe rejected to reconnect', async () => {
  await mount('/styler-dashboard/appointments', { status: 'REJECTED', payoutsWaiting: 0 });
  expect(screen.getByText('Your payout setup needs attention')).toBeInTheDocument();
  expect(screen.queryByText(/is waiting for you/)).not.toBeInTheDocument();
});

it('does not show over the Payouts page, which already carries the setup card', async () => {
  await mount('/styler-dashboard/payouts', { status: 'PENDING', payoutsWaiting: 1, payoutsWaitingAmount: '$10.00' });
  expect(screen.queryByText(/payout setup/i)).not.toBeInTheDocument();
});
