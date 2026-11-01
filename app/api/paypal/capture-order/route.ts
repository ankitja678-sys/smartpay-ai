
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
    throw new Error("PayPal authentication failed.");
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = body.orderId;

    if (
      typeof orderId !== "string" ||
      !/^[A-Z0-9-]+$/i.test(orderId)
    ) {
      return NextResponse.json(
        { error: "Invalid PayPal order ID." },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "PayPal payment capture failed." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      captureId:
        result.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null,
    });
  } catch (error) {
    console.error("PayPal capture-order error:", error);

    return NextResponse.json(
      { error: "Unable to capture PayPal payment." },
      { status: 500 }
    );
  }
}
