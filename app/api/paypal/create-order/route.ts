
import { NextResponse } from "next/server";

const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured.");
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with PayPal.");
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
      }),
      cache: "no-store",
    });

    const order = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "PayPal could not create the order." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
    });
  } catch (error) {
    console.error("PayPal create-order error:", error);

    return NextResponse.json(
      { error: "Unable to create PayPal order." },
      { status: 500 }
    );
  }
}
