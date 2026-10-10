import { render, screen, fireEvent } from '@testing-library/react';
import ImageUpload from './ImageUpload';
vi.mock('../utils/cloudinaryUpload', () => ({ uploadToCloudinary: vi.fn() }));
it('labels each upload input separately and reports a selected file', () => {
  const onFileSelected = vi.fn();
  render(<><ImageUpload label="Profile photo" deferUpload onFileSelected={onFileSelected} /><ImageUpload label="ID photo" deferUpload /></>);
  const profile = screen.getByLabelText('Profile photo:');
  const identification = screen.getByLabelText('ID photo:');
  expect(profile.id).not.toBe(identification.id);
  const file = new File(['image'], 'profile.png', { type: 'image/png' });
  fireEvent.change(profile, { target: { files: [file] } });
  expect(onFileSelected).toHaveBeenCalledWith(file);
});
it('rejects non-image files immediately without keeping them in signup', () => {
 const onFileSelected=vi.fn();render(<ImageUpload label="Profile photo" deferUpload onFileSelected={onFileSelected} />);
 fireEvent.change(screen.getByLabelText('Profile photo:'),{target:{files:[new File(['text'],'notes.txt',{type:'text/plain'})]}});
 expect(onFileSelected).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG, PNG, WebP or GIF image');
});
