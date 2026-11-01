# SmartPay AI

**AI-powered payment management and fraud risk analysis platform.**

SmartPay AI is a demo project built with Next.js and Google Gemini AI. It provides a dashboard to explore payment transactions, AI-powered assistance, analytics, and experimental fraud risk assessment.

## Features

- **Dashboard:** View and manage sample payment transactions.
- **AI Assistant:** Get AI-powered responses using Google Gemini.
- **Fraud Risk Analysis:** Generate AI-based risk scores and recommendations for demo transactions.
- **Analytics:** Explore transaction insights through the dashboard.
- **Demo Payment Flow:** Explore the payment interface using sample data.

## Tech Stack

- Next.js
- React
- TypeScript
- Google Gemini API
- CSS

## Getting Started

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
```

Never commit your API key or share it publicly.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Important Notes

- This is a demonstration project.
- Transactions and payment data are sample data.
- Fraud risk scores are AI-generated estimates, not confirmed fraud detections.
- The demo payment flow does not transfer real money.
- PayPal payment integration should only be considered complete once a working integration is implemented and tested.

## Project Structure

```text
smartpay-ai/
├── app/
│   ├── api/
│   │   ├── assistant/
│   │   └── fraud-analysis/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .gitignore
├── package.json
└── README.md
```

## License

This project is intended for educational and hackathon demonstration purposes. Add an open-source license before publishing the project as an officially licensed open-source repository.