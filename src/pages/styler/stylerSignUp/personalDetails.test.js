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
it('refuses digits in a name and extra phone digits before requesting a code', async () => {
  APIService.stylerGenerateOtp.mockClear();
  renderStep(); fill('John123');
  fireEvent.change(document.querySelector('input[name="phoneNumber"]'), { target: { value: '58755512345' } });
  expect(document.querySelector('input[name="phoneNumber"]')).toHaveValue('58755512345');
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText(/First name can only contain letters/)).toBeInTheDocument();
  expect(screen.getByText(/Too many digits/)).toBeInTheDocument();
  expect(APIService.stylerGenerateOtp).not.toHaveBeenCalled();
});
it('accepts a two-letter name, trims it and marks required fields', async () => {
  APIService.stylerGenerateOtp.mockClear();
  APIService.stylerGenerateOtp.mockResolvedValue({ data: { statusCode: '400', message: 'nope' } });
  renderStep(); fill('  Li  ');
  expect(document.querySelector('input[name="firstname"]')).toHaveAttribute('aria-required', 'true');
  expect(document.querySelector('input[name="emailAddress"]')).toHaveAttribute('autocomplete', 'email');
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('alert');
  expect(APIService.stylerGenerateOtp).toHaveBeenCalledWith({ emailAddress: 'ada@example.com' });
});
