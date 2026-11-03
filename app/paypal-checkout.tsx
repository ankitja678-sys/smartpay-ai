
"use client";

import { useEffect, useRef, useState } from "react";
import { loadScript } from "@paypal/paypal-js";
import type { PayPalButtonsComponent } from "@paypal/paypal-js";
type Props = {
  amount: number;
  onSuccess: (details: {
    orderId: string;
    captureId: string | null;
  }) => void;
};

export default function PayPalCheckout({ amount, onSuccess }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let buttons: PayPalButtonsComponent | undefined;
    async function initializePayPal() {
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

        if (!clientId) {
          throw new Error("PayPal Client ID is missing.");
        }

        const paypal = await loadScript({
  clientId,
  currency: "USD",
  intent: "capture",
});
        if (cancelled) return;

        if (!paypal?.Buttons || !containerRef.current) {
          throw new Error("PayPal Checkout could not load.");
        }

        buttons = paypal.Buttons({
          createOrder: async () => {
            const response = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (!response.ok || !data.id) {
              throw new Error(data.error || "Could not create PayPal order.");
            }

            return data.id;
          },
           
          onApprove: async (data) => {
        console.log("PAYPAL APPROVED:", data);


            const response = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });

            const result = await response.json();

            if (!response.ok || result.status !== "COMPLETED") {
              throw new Error(result.error || "Payment capture failed.");
            }

            onSuccess({
              orderId: result.id,
              captureId: result.captureId,
            });
          },

          onError: (err) => {
            console.error("PayPal Checkout error:", err);
            setError("PayPal payment failed. Please try again.");
          },
        });

        await buttons.render(containerRef.current);

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "PayPal could not load."
          );
          setLoading(false);
        }
      }
    }

    initializePayPal();

    return () => {
      cancelled = true;
      buttons?.close().catch(() => {});
    };
  }, [amount, onSuccess]);

  return (
    <div className="mt-4">
      {loading && (
        <p className="mb-3 text-center text-sm text-slate-500">
          Loading PayPal Checkout...
        </p>
      )}

      <div ref={containerRef} />

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-3 text-center text-xs text-slate-500">
        Pay securely using PayPal Sandbox. Test payment only.
      </p>
    </div>
  );
}
