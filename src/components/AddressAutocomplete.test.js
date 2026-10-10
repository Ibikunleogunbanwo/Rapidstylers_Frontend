import {render,screen} from '@testing-library/react';
import AddressAutocomplete from './AddressAutocomplete';
it('associates the address label with its input',()=>{render(<AddressAutocomplete onChange={()=>{}}/>);expect(screen.getByLabelText('Address:')).toHaveAttribute('type','text');});
