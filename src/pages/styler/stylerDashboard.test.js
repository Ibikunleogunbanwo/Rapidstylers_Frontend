import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import StylerDashboard from './stylerDashboard';
import { APIService } from '../../hooks/remote/apiService';
vi.mock('../../hooks/remote/apiService', () => ({ APIService: { stylerAppointments: vi.fn(), getStylerConnectStatus: vi.fn(), createStylerConnectAccount: vi.fn() } }));
vi.mock('../../components/goodToKnow', () => ({ default: () => null }));
beforeEach(() => { vi.clearAllMocks(); APIService.stylerAppointments.mockResolvedValue({data:{data:[]}}); APIService.getStylerConnectStatus.mockResolvedValue({data:{data:{status:'COMPLETE'}}}); });
const mount = () => render(<MemoryRouter><StylerDashboard /></MemoryRouter>);
it('shows real upcoming appointments and working navigation instead of sample slots', async () => {
 APIService.stylerAppointments.mockResolvedValue({data:{data:[{appointmentId:'a',statusCode:'3',appointmentDate:'2026-10-15',arrivalTime:'10:00',userData:{firstname:'Ada',lastname:'Lee'},subServiceData:{name:'Braids'}}]}});
 mount(); expect(await screen.findByText('Ada Lee')).toBeInTheDocument(); expect(screen.getByText('Braids')).toBeInTheDocument(); expect(screen.queryByText('6:00-7:00am')).not.toBeInTheDocument(); expect(screen.getByRole('link',{name:'Open calendar'})).toHaveAttribute('href','/styler-dashboard/calendar');
});
it('distinguishes failed appointment reads from an empty schedule and retries', async () => {
 APIService.stylerAppointments.mockRejectedValueOnce(new Error('offline')); mount(); expect(await screen.findByText('Could not load your appointments.')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Retry appointments'})); expect(await screen.findByText('No active appointments.')).toBeInTheDocument();
});
it('does not treat unavailable payout status as not connected', async () => {
 APIService.getStylerConnectStatus.mockRejectedValueOnce(new Error('offline')); mount(); expect(await screen.findByText('Could not load payout status.')).toBeInTheDocument(); expect(screen.queryByText('Not connected')).not.toBeInTheDocument(); expect(screen.queryByRole('button',{name:'Connect to get paid'})).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button',{name:'Retry payout status'})); await waitFor(() => expect(screen.getByText('Ready for payouts')).toBeInTheDocument());
});
