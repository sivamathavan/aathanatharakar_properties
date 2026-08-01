# DK Promoters — டிகே புரமோட்டர்ஸ்

**Tamil Nadu's Trusted Property Broker**

A modern real estate marketplace built with Next.js 14, Firebase, and Tailwind CSS. DK Promoters connects property buyers, sellers, renters, agents, and allied service professionals across Tamil Nadu.

## Tech Stack

- **Framework**: Next.js 14 (App Router, SSR, API Routes)
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth (Email/Password, Google)
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting
- **Styling**: Tailwind CSS v3 (Navy + Gold + Cream palette)
- **Email**: Nodemailer (Gmail SMTP)
- **Analytics**: Firebase Analytics

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Firebase project credentials
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/          → Next.js pages and API routes
components/   → Reusable UI components
lib/          → Firebase SDK, Firestore helpers, utilities
public/       → Static assets, PWA icons, manifest
```

## Key Features

- 🏠 Property listings with search, filters, and pagination
- 👤 Role-based access (Admin, Agent, Vendor, Property Lister)
- 📱 PWA-ready with mobile-optimized layout
- 🔐 Secure admin panel with Firebase Auth
- 💬 WhatsApp and call integration for broker contact
- 📝 Blog with static and dynamic content
- 📊 Firebase Analytics for user behavior tracking

## Deployment

```bash
firebase deploy
```

## Contact

- **Email**: dkpromotersproperty@gmail.com
- **WhatsApp**: +91 63811 69124
- **Location**: Vadavalli, Coimbatore, Tamil Nadu

---

Developed by [Rturox](https://rturox.com/)
