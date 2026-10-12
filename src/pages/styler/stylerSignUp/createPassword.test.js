import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreatePassword from './createPassword';
import { APIService } from '../../../hooks/remote/apiService';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import { saveSignupUploadPass, readSignupUploadPass } from '../../../utils/signupUploadPass';
const markEmailUnverified = vi.fn();
vi.mock('../../../context/StylerSignupContext', () => ({ useStylerSignup: () => { const [creationUncertain, setUncertain] = useState(false); return { formData: {}, imageFiles: { profileImageFile: {}, identificationImageFile: {} }, forgetSignupDraft: vi.fn(), creationUncertain, markCreationUncertain: () => setUncertain(true), markEmailUnverified }; } }));
vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { createStyler: vi.fn() } }));
vi.mock('../../../utils/cloudinaryUpload', () => ({ uploadToCloudinary: vi.fn(async (_, folder) => ({ url: folder, publicId: folder })), deleteCloudinaryImage: vi.fn() }));
vi.mock('../../../utils/constant', () => ({ showSuccessToastMessage: vi.fn(), showErrorToastMessage: vi.fn() }));
it('blocks another create attempt and offers sign in after an uncertain outcome', async () => {
  APIService.createStyler.mockRejectedValue(new Error('timeout'));
  render(<MemoryRouter><CreatePassword /></MemoryRouter>);
  for (const name of ['password', 'confirmPassword']) fireEvent.change(document.querySelector(`input[name="${name}"]`), { target: { value: 'StrongPass1!' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('could not confirm'));
  expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  fireEvent.submit(document.querySelector('form'));
  await waitFor(() => expect(APIService.createStyler).toHaveBeenCalledTimes(1));
});

it('finishes signup when the API returns a numeric success status', async () => {
  APIService.createStyler.mockResolvedValue({ data: { statusCode: 200 } });
  render(<MemoryRouter initialEntries={['/signup']}><Routes><Route path="/signup" element={<CreatePassword />} /><Route path="/login" element={<p>Login screen</p>} /></Routes></MemoryRouter>);
  for (const name of ['password', 'confirmPassword']) fireEvent.change(document.querySelector(`input[name="${name}"]`), { target: { value: 'StrongPass1!' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('Login screen')).toBeInTheDocument();
});
it('offers sign in when the email already has an account, keeping the server wording', async () => {
  const alreadyUsed = new Error('Email Address already exists, Kindly choose another email');
  alreadyUsed.response = { status: 400, data: { statusCode: '400', message: 'Email Address already exists, Kindly choose another email' } };
  APIService.createStyler.mockRejectedValue(alreadyUsed);
  render(<MemoryRouter><CreatePassword /></MemoryRouter>);
  for (const name of ['password', 'confirmPassword']) fireEvent.change(document.querySelector(`input[name="${name}"]`), { target: { value: 'StrongPass1!' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('already exists'));
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
});
it('shows password and confirmation errors while typing before blur or submission', async () => {
 render(<MemoryRouter><CreatePassword /></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Set password:'),{target:{value:'weak'}});
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('between 8 and 30'));
 fireEvent.change(screen.getByLabelText('Set password:'),{target:{value:'StrongPass1!'}});
 fireEvent.change(screen.getByLabelText('Confirm password:'),{target:{value:'different'}});
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match'));
});

it('sends the stylist back to verify their email when the photo upload pass has expired', async () => {
  saveSignupUploadPass('expired-pass');
  const expired = Object.assign(new Error('Signup upload pass expired'), { code: 'SIGNUP_PASS_EXPIRED' });
  uploadToCloudinary.mockRejectedValueOnce(expired).mockRejectedValueOnce(expired);
  APIService.createStyler.mockClear();
  render(<MemoryRouter initialEntries={['/styler-signup/secure-account']}><Routes><Route path="/styler-signup/secure-account" element={<CreatePassword />} /><Route path="/styler-signup/verify-email" element={<p>Verify email screen</p>} /></Routes></MemoryRouter>);
  for (const name of ['password', 'confirmPassword']) fireEvent.change(document.querySelector(`input[name="${name}"]`), { target: { value: 'StrongPass1!' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('Verify email screen')).toBeInTheDocument();
  expect(markEmailUnverified).toHaveBeenCalled();
  expect(readSignupUploadPass()).toBe('');
  expect(APIService.createStyler).not.toHaveBeenCalled();
});
