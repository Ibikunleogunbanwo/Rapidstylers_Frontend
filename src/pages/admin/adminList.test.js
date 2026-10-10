import { render, screen, fireEvent } from '@testing-library/react';
import { useAdminList, AdminListControls } from './adminList';
const rows = Array.from({length:25}, (_,i)=>({name:`Record ${i+1}`}));
function Probe(){ const list=useAdminList(rows,r=>r.name); return <><AdminListControls list={list}/>{list.visibleItems.map(r=><p key={r.name}>{r.name}</p>)}</> }
it('pages records and resets the page when searching',()=>{render(<Probe/>);expect(screen.getByText('Record 10')).toBeInTheDocument();expect(screen.queryByText('Record 11')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Next page'}));expect(screen.getByText('Record 11')).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Search records'),{target:{value:'Record 25'}});expect(screen.getByText('Record 25')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Previous page'})).toBeDisabled();});
