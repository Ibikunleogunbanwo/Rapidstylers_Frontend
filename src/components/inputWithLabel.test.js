import { render, screen, fireEvent } from '@testing-library/react';
import InputWithLabel from './inputWithLabel';
it('reveals each password independently without submitting or changing its value', () => {
 const submit=vi.fn(e=>e.preventDefault());
 render(<form onSubmit={submit}><InputWithLabel labelName="Set password" inputType="password" inputValue="StrongPass1!" inputOnChange={()=>{}} /><InputWithLabel labelName="Confirm password" inputType="password" inputValue="StrongPass1!" inputOnChange={()=>{}} /></form>);
 const password=screen.getByLabelText('Set password:');
 fireEvent.click(screen.getByRole('button',{name:'Show Set password'}));
 expect(password).toHaveAttribute('type','text');expect(password).toHaveValue('StrongPass1!');
 expect(screen.getByLabelText('Confirm password:')).toHaveAttribute('type','password');
 expect(submit).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Hide Set password'}));expect(password).toHaveAttribute('type','password');
});
