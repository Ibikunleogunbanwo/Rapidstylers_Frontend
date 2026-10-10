import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreatePassword from './createPassword';
import { APIService } from '../../../hooks/remote/apiService';
vi.mock('../../../context/StylerSignupContext', () => ({ useStylerSignup: () => { const [creationUncertain, setUncertain] = useState(false); return { formData: {}, imageFiles: { profileImageFile: {}, identificationImageFile: {} }, forgetSignupDraft: vi.fn(), creationUncertain, markCreationUncertain: () => setUncertain(true) }; } }));
vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { createStyler: vi.fn() } }));
vi.mock('../../../utils/cloudinaryUpload', () => ({ uploadToCloudinary: async (_, folder) => ({ url: folder, publicId: folder }), deleteCloudinaryImage: vi.fn() }));
vi.mock('../../../utils/constant', () => ({ showSuccessToastMessage: vi.fn() }));
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
