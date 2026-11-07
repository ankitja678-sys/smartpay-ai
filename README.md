
# SmartPay AI

**AI-Powered Payment Management and Risk Analysis**

SmartPay AI is an AI-powered payment management demo built for the PayPal AI Hackathon 2026. It combines PayPal Sandbox checkout, AI-powered transaction risk assessment, payment analytics, and a conversational AI assistant in one dashboard.

## Live Demo

- **Website:** https://smartpay-ai-hackathon.vercel.app/
- **Demo Video:** https://www.youtube.com/watch?v=PuPB6uVBycA
- **GitHub:** https://github.com/ankitja678-sys/smartpay-ai

## Features

- **Payment Dashboard:** View transaction summaries and payment activity.
- **Transaction Monitoring:** Explore completed, pending, and failed transactions.
- **AI Risk Analysis:** Get AI-generated risk scores, evidence-based explanations, and recommendations.
- **AI Assistant:** Ask natural-language questions about transaction activity and payment risks.
- **Analytics:** Explore payment statistics and transaction insights.
- **PayPal Sandbox Integration:** Create PayPal orders, complete checkout, capture payments, and display completed test transactions.

## How AI Is Used

SmartPay AI uses Google's Gemini 2.5 Flash model through the Google GenAI SDK.

The AI powers two main capabilities:

1. **Conversational Assistant:** Summarizes transaction activity and answers questions about payment patterns.
2. **Risk Assessment:** Analyzes supplied transaction fields and returns risk scores, reasons, and recommendations.

Risk assessments are estimates based on the available demo data. They are not confirmed fraud detections.

## PayPal Integration

The project integrates with the PayPal Developer Platform using:

- PayPal JavaScript SDK for checkout.
- PayPal Orders API to create payment orders.
- PayPal Capture API to capture approved orders.
- PayPal Sandbox accounts for test transactions.

**Important:** This project uses PayPal Sandbox for demonstration. No real money is transferred.

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Google Gemini 2.5 Flash
- Google GenAI SDK
- PayPal JavaScript SDK
- PayPal REST APIs
- Vercel

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/ankitja678-sys/smartpay-ai.git
cd smartpay-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_secret
PAYPAL_ENVIRONMENT=sandbox
```

Use your own credentials from Google AI Studio and PayPal Developer Dashboard.

Never commit `.env.local`, API keys, or PayPal secrets to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Create a production build

```bash
npm run build
```

## Demo Data and Limitations

- The dashboard includes illustrative sample transactions.
- Sandbox payments are test transactions, not real payments.
- AI risk scores are estimates, not definitive fraud decisions.
- This is a hackathon demonstration, not a production-ready financial service.
- Transaction records displayed in the demo should not be treated as a persistent production ledger.

## Security

- Keep all private API credentials in environment variables.
- Never expose PayPal client secrets or Gemini API keys.
- Do not use real customer payment information in this demo.

## License

See the [LICENSE](./LICENSE) file for the project's open-source license.

---

**Built for the PayPal AI Hackathon 2026.**
