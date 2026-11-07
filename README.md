# SmartPay AI

**AI-Powered Payment Management & Risk Analysis Platform**

SmartPay AI is a hackathon project built for the **PayPal AI Hackathon 2026**. It combines PayPal Sandbox payment integration with Google Gemini AI to help users explore payment activity, understand transaction risks, and gain actionable insights.

## Live Demo

https://smartpay-ai-hackathon.vercel.app/

## Demo Video

https://youtu.be/PuPB6uVBycA

## GitHub Repository

https://github.com/ankitja678-sys/smartpay-ai

## Key Features

- **Payment Dashboard:** Monitor payment transactions and their statuses.
- **PayPal Sandbox Integration:** Create and capture test payments using PayPal.
- **AI Risk Analysis:** Analyze transaction details and generate risk estimates and recommendations.
- **AI Assistant:** Ask questions about transactions and receive AI-generated insights.
- **Transaction Monitoring:** Explore completed, pending, and failed transactions.
- **Analytics Dashboard:** View transaction summaries and payment insights.

## AI Capabilities

SmartPay AI uses **Google Gemini 2.5 Flash** through the Google GenAI SDK.

Example prompts:
- Summarize my transactions.
- How can I spot risky payments?

The AI assistant provides transaction explanations, summaries, and risk-related recommendations.

## PayPal Integration

The application integrates PayPal Sandbox using:
- PayPal JavaScript SDK
- PayPal Orders API
- Order creation and payment capture

**Important:** All payment demonstrations use PayPal Sandbox. No real money is transferred.

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Google Gemini 2.5 Flash
- Google GenAI SDK
- PayPal JavaScript SDK
- PayPal Orders API
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

Create a `.env.local` file in the project root.

Add your own credentials:

```env
GEMINI_API_KEY=your_gemini_api_key
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

Use the exact variable names required by the application. Never commit real API keys or secrets.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Build for production

```bash
npm run build
```

## Important Notes & Limitations

- This is a hackathon demonstration project, not a production-ready payment platform.
- Some dashboard transactions are illustrative sample data.
- PayPal transactions shown in the demo use Sandbox.
- AI-generated risk scores are estimates, not confirmed fraud detections.
- AI recommendations should not be treated as definitive financial decisions.
- Production deployment would require additional security, compliance, monitoring, and testing.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
