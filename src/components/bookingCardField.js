import { useImperativeHandle, forwardRef, useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

/**
 * One-time card collection for a booking. Lives inside Stripe's <Elements>.
 * Exposes createPaymentMethod() (returns a pm_ id for the card, never stores the
 * card anywhere on our side). Rendered only when a publishable key is configured.
 */
const BookingCardField = forwardRef(function BookingCardField(_props, ref) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({
    createPaymentMethod: async () => {
      setError("");
      if (!stripe || !elements) {
        throw new Error("Payment is still loading — please try again.");
      }
      const cardElement = elements.getElement(CardElement);
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      if (pmError) {
        setError(pmError.message || "Your card could not be processed.");
        throw new Error(pmError.message || "Your card could not be processed.");
      }
      return paymentMethod.id;
    },
    ready: () => Boolean(stripe && elements),
  }));

  return (
    <div>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "14px",
              color: "#1a202c",
              "::placeholder": { color: "#a0aec0" },
            },
            invalid: { color: "#e53e3e" },
          },
        }}
        onChange={(e) => {
          if (e.error) setError(e.error.message);
          else setError("");
        }}
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default BookingCardField;