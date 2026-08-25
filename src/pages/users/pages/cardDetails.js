import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import Back from "../../../components/goBack";
import Input from "../../../components/input";
import { useDispatch, useSelector } from "react-redux";
import Buttons from "../../../components/button";
import { getUserDetails, updateCardDetail } from "../../../hooks/local/userReducer";
import { showSuccessToastMessage, STRIPE_PUBLISHABLE_KEY } from "../../../utils/constant";
import Spinner from "../../../components/spinner";
import { APIService } from "../../../hooks/remote/apiService";

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

/**
 * Card-on-file via Stripe Elements. The card number/CVV/expiry are collected
 * inside Stripe's iframe and never touch this app — only a PaymentMethod id is
 * sent to the backend, which stores Stripe references + display metadata.
 */
const CardDetails = ({ setPageTitle }) => {
  useEffect(() => {
    setPageTitle("Account Settings");
    document.title = "Card details | RapidStylers";
  }, [setPageTitle]);

  const dispatch = useDispatch();
  // userDetailsData can be null (fresh reload with a persisted session, or a
  // failed fetch) — never assume another page has loaded it first.
  const userData = useSelector((state) => state.user.userDetailsData)?.userCardData || null;
  const [fetching, setFetching] = useState(!userData);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (userData) return;
    let cancelled = false;
    setFetching(true);
    setFetchFailed(false);
    // Identity comes from the Bearer token — no arg needed.
    dispatch(getUserDetails())
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasCard = Boolean(userData && userData.last4);

  return (
    <div className="bg-white rounded-lg border">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>{hasCard ? "Update" : "Add"} Card Details.</span>
      </div>
      {!userData && fetching && (
        <div className="p-10 text-center text-sm text-black/50">Loading your details...</div>
      )}
      {!userData && !fetching && fetchFailed && (
        <div className="p-10 text-center text-sm text-red-500">
          Could not load your card details.{" "}
          <button
            type="button"
            className="text-brand underline"
            onClick={() => { setFetching(true); setFetchFailed(false); dispatch(getUserDetails()).catch(() => setFetchFailed(true)).finally(() => setFetching(false)); }}
          >
            Retry
          </button>
        </div>
      )}
      {!STRIPE_PUBLISHABLE_KEY && (
        <div className="p-6 text-sm text-black/60">
          Payments are not configured yet. Add your Stripe publishable key to enable card-on-file payments.
        </div>
      )}
      {userData && STRIPE_PUBLISHABLE_KEY && !updating && hasCard && (
        <SavedCardSummary userData={userData} onUpdate={() => setUpdating(true)} />
      )}
      {userData && STRIPE_PUBLISHABLE_KEY && (updating || !hasCard) && stripePromise && (
        <Elements stripe={stripePromise}>
          <CardForm onSaved={() => setUpdating(false)} />
        </Elements>
      )}
    </div>
  );
};

const SavedCardSummary = ({ userData, onUpdate }) => {
  const brand = (userData.brand || "card").replace(/_/g, " ");
  const exp = userData.expMonth && userData.expYear
    ? `${String(userData.expMonth).padStart(2, "0")}/${String(userData.expYear).slice(-2)}`
    : null;
  return (
    <div className="p-6">
      <div className="rounded-lg border border-black/10 bg-[#fafafa] p-5 max-w-md">
        <p className="text-xs uppercase tracking-wide text-black/40">Card on file</p>
        <p className="mt-2 text-lg font-semibold capitalize">
          {brand} •••• {userData.last4}
        </p>
        {exp && <p className="mt-1 text-sm text-black/50">Expires {exp}</p>}
        <p className="mt-1 text-sm text-black/50">{userData.cardName}</p>
      </div>
      <p className="mt-4 max-w-md text-xs text-black/40">
        Your card number and CVV are stored securely with Stripe — RapidStylers never sees or stores them.
      </p>
      <div className="mt-5">
        <Buttons btnType={'light'} type="button" btnText="Update card" onClick={onUpdate} />
      </div>
    </div>
  );
};

const CardForm = ({ onSaved }) => {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const [cardName, setCardName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const saveCard = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    if (!cardName.trim()) { setErrorMsg("Cardholder name is required"); return; }
    if (!agreed) { setErrorMsg("Please accept the terms and conditions"); return; }
    setErrorMsg("");
    setSaving(true);
    try {
      const { data } = await APIService.getCardSetupIntent();
      const clientSecret = data?.data?.clientSecret;
      if (!clientSecret) throw new Error("Could not start card setup — please try again");
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: cardName.trim() },
        },
      });
      if (error) { setErrorMsg(error.message || "Could not verify your card"); setSaving(false); return; }
      const { payload } = await dispatch(updateCardDetail({
        cardName: cardName.trim(),
        paymentMethodId: setupIntent.payment_method,
      }));
      if (payload?.statusCode === "200") {
        dispatch(getUserDetails());
        showSuccessToastMessage("Card saved securely");
        onSaved();
      } else {
        setErrorMsg(payload?.message || "Could not save your card — please try again");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Could not save your card — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={saveCard}>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Cardholder name:"
          type="text"
          name="cardName"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
        />
        <div>
          <label className="text-sm font-medium text-black/60 mb-1 block">Card details:</label>
          <div className="rounded-lg border border-black/15 bg-white px-3 py-3">
            <CardElement
              options={{
                style: {
                  base: { fontSize: "15px", color: "#1d1d1d", "::placeholder": { color: "#a3a3a3" } },
                  invalid: { color: "#dc2626" },
                },
              }}
            />
          </div>
          <p className="mt-1 text-xs text-black/40">Secured by Stripe — your card number and CVV never touch RapidStylers.</p>
        </div>
        <div className="col-span-1 md:col-span-2">
          <p className="text-sm">
            By checking this box, you acknowledge that you have read and agree to the terms and conditions of our service. This includes understanding and consenting to our policies regarding the storage and usage of your provided data. Please take a moment to review our comprehensive terms and conditions, which outline the guidelines and expectations for the use of our platform. If you have any questions or concerns, feel free to contact our support team for clarification. Your use of this service is subject to compliance with these terms.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="mb-[2px] text-sm">I have read and agree to the terms and conditions.</span>
          </div>
        </div>
        {errorMsg && (
          <div className="col-span-1 md:col-span-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
            {errorMsg}
          </div>
        )}
        <div className="col-span-1 md:col-span-2 flex gap-x-3">
          <Buttons btnType={'light'} type="submit" btnText={saving ? "Saving..." : "Save card"} disabled={saving} />
        </div>
      </div>
    </form>
  );
};

export default CardDetails;
