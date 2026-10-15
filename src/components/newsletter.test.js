import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { vi,describe,it,expect,beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NewsletterSubscribe,NewsletterPreference } from './newsletter';
import { NewsletterConfirm,NewsletterUnsubscribe } from '../pages/generalPages/newsletterLinks';
import { contentNewsletterApi as api } from '../hooks/remote/contentNewsletterApi';
vi.mock('../hooks/remote/contentNewsletterApi',()=>({contentNewsletterApi:{get:vi.fn(),post:vi.fn(),subscribe:vi.fn()},requestMessage:e=>e.message}));
beforeEach(()=>vi.clearAllMocks());
describe('newsletter consent and link flows',()=>{
 it('requires explicit consent and shows double opt in',async()=>{api.subscribe.mockResolvedValue(null);render(<NewsletterSubscribe/>);fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'qa@example.com'}});fireEvent.click(screen.getByRole('button',{name:'Subscribe'}));expect(api.subscribe).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('agree');fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Subscribe'}));await screen.findByRole('status');expect(api.subscribe).toHaveBeenCalledWith({email:'qa@example.com',consent:true});});
 it('does not mutate confirmation on page load',async()=>{api.post.mockResolvedValue(null);render(<MemoryRouter initialEntries={['/newsletter/confirm?token=private-token']}><NewsletterConfirm/></MemoryRouter>);expect(api.post).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Confirm subscription'}));await screen.findByRole('status');expect(api.post).toHaveBeenCalledWith('/newsletter_confirm',{token:'private-token'});});
 it('shows missing unsubscribe token without a request',()=>{render(<MemoryRouter><NewsletterUnsubscribe/></MemoryRouter>);expect(screen.getByRole('alert')).toHaveTextContent('missing');expect(api.post).not.toHaveBeenCalled();});
 it('preserves link retry after server failure',async()=>{api.post.mockRejectedValueOnce(new Error('Expired link'));render(<MemoryRouter initialEntries={['/?token=abc']}><NewsletterConfirm/></MemoryRouter>);fireEvent.click(screen.getByRole('button',{name:'Confirm subscription'}));expect(await screen.findByRole('alert')).toHaveTextContent('Expired link');expect(screen.getByRole('button')).toBeEnabled();});
 it('does not show false preference when initial read fails',async()=>{api.get.mockRejectedValue(new Error('Unavailable'));render(<NewsletterPreference/>);await screen.findByRole('alert');expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Retry'})).toBeVisible();});
 it('saves signed in preference with consent switch',async()=>{api.get.mockResolvedValue({subscribed:false});api.post.mockResolvedValue({subscribed:true});render(<NewsletterPreference/>);fireEvent.click(await screen.findByRole('checkbox'));await waitFor(()=>expect(screen.getByRole('checkbox')).toBeChecked());expect(api.post).toHaveBeenCalledWith('/update_my_newsletter',{subscribed:true});});
});
