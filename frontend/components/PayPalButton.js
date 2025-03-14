"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function PayPalButton({ userId, onSuccess }) {
  const paypalButtonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (scriptLoaded && paypalButtonRef.current) {
      window.paypal
        .Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [{ amount: { value: "1.25", currency_code: "GBP" } }],
            });
          },
          onApprove: async (data, actions) => {
            try {
              const details = await actions.order.capture();
              console.log("Payment details:", details);
              onSuccess();
            } catch (err) {
              console.error("Error capturing payment:", err);
              alert("Payment failed. Try again.");
            }
          },
          onError: (err) => {
            console.error("PayPal Checkout Error", err);
            alert("Payment error. Try again.");
          },
        })
        .render(paypalButtonRef.current);
    }
  }, [scriptLoaded]);

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=GBP`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={paypalButtonRef} />
    </>
  );
}