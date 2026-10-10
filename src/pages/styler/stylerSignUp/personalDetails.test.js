import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PersonalDetails from './personalDetails';
import { APIService } from '../../../hooks/remote/apiService';
vi.mock('../../../context/StylerSignupContext', () => ({ useStylerSignup: () => ({ formData: {}, updateData: vi.fn() }) }));
vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { stylerGenerateOtp: vi.fn() } }));
const renderStep = () => render(<MemoryRouter><PersonalDetails /></MemoryRouter>);
const fill = (first = 'Ada') => {
  for (const [name, value] of Object.entries({ firstname: first, lastname: 'Lovelace', emailAddress: 'ada@example.com', phoneNumber: '5875551234' })) {
    fireEvent.change(document.querySelector(`input[name="${name}"]`), { target: { value } });
  }
};
it('rejects a whitespace-only name before requesting a code', async () => {
  renderStep(); fill('   ');
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('First name is required')).toBeInTheDocument();
  expect(APIService.stylerGenerateOtp).not.toHaveBeenCalled();
});
it('shows a rejected code request on the form', async () => {
  APIService.stylerGenerateOtp.mockResolvedValue({ data: { statusCode: '400', message: 'Email already registered' } });
  renderStep(); fill();
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
});
