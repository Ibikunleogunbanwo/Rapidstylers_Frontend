import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { APIService } from '../../../hooks/remote/apiService';
import ImagesStep from './imagesStep';
import { StylerSignupProvider } from '../../../context/StylerSignupContext';
vi.mock('../../../hooks/remote/apiService', () => ({ APIService: { listIdentificationTypes: vi.fn(async () => ({ data: { data: [{ id: 2, identificationName: 'Passport' }] } })) } }));
vi.mock('../../../components/ImageUpload', () => ({ default: ({ label, onFileSelected }) => <button type="button" onClick={() => onFileSelected(new File(['image'], 'photo.png', { type: 'image/png' }))}>{label}</button> }));
it('keeps a numeric ID selection when the second photo is picked', async () => {
  render(<MemoryRouter initialEntries={['/photos']}><StylerSignupProvider><Routes>
    <Route path="/photos" element={<ImagesStep />} />
    <Route path="/styler-signup/secure-account" element={<p>Password step</p>} />
  </Routes></StylerSignupProvider></MemoryRouter>);
  fireEvent.click(await screen.findByRole('radio', { name: 'Passport' }));
  fireEvent.click(screen.getByRole('button', { name: 'Profile photo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Upload ID photo' }));
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Passport' })).toBeChecked());
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Password step')).toBeInTheDocument();
});

it('offers retry when ID options are unavailable', async () => {
  APIService.listIdentificationTypes.mockRejectedValueOnce(new Error('offline'));
  render(<MemoryRouter><StylerSignupProvider><ImagesStep /></StylerSignupProvider></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry loading ID types' }));
  expect(await screen.findByRole('radio', { name: 'Passport' })).toBeInTheDocument();
});
