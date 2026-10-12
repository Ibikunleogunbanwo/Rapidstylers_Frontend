import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/button";

/**
 * The legacy /signOut page. It used to sign the person out the moment it
 * mounted, so any GET navigation (a stale bookmark, a prefetch, a link or image
 * on another site) could end someone's session. It now asks first and only signs
 * out on the button press. The header and sidebar sign-out buttons still sign
 * out at once: they are deliberate clicks on our own page.
 *
 * `onConfirm` is the shell's sign-out action; Cancel goes back to the dashboard.
 */
const LogOut = ({ onConfirm, onCancel, setPageTitle }) => {
    const navigate = useNavigate();

    useEffect(() => {
        setPageTitle?.("Sign out");
        document.title = "Sign out | RapidStylers";
    }, [setPageTitle]);

    return (
        <section aria-labelledby="sign-out-title" className="mx-auto mt-10 max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h1 id="sign-out-title" className="text-lg font-semibold text-onSurface">Sign out of RapidStylers?</h1>
            <p className="mt-2 text-sm leading-[1.6] text-black/60">
                You will need to sign in again to see your bookings and messages.
            </p>
            <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={onCancel || (() => navigate("/dashboard"))}>
                    Cancel
                </Button>
                <Button variant="primary" type="button" onClick={onConfirm}>
                    Sign out
                </Button>
            </div>
        </section>
    );
};

export default LogOut;
