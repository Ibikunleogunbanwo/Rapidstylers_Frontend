import {render,screen} from '@testing-library/react';
import Input from './input';
import SelectInput from './selectInput';
it('associates shared input label and validation error',()=>{render(<Input label="Full name" name="name" type="text" onError="Name is required"/>);expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid','true');expect(screen.getByLabelText('Full name')).toHaveAccessibleDescription('Name is required');});
it('associates shared select label and error',()=>{render(<SelectInput labelName="Category" selectName="category" selectOptions={[]} selectError="Choose a category"/>);expect(screen.getByLabelText('Category:')).toHaveAccessibleDescription('Choose a category');});
