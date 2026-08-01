# Project Documentation: DK Promoters (டிகே புரமோட்டர்ஸ்)

Welcome to the end-to-end documentation for **DK Promoters**, Tamil Nadu's trusted property marketplace. This document details the system design, current architecture, data models, routes, access controls, and configuration requirements.

---

## 1. Project Overview

**DK Promoters** is a localized real estate platform tailored for property listings, real estate agents, and home service vendors across Tamil Nadu.

### Key Business Rules & Features:
*   **Broker-Only Lead Routing**: To control listing quality and commissions, all customer-facing contact buttons (WhatsApp, Call, Enquiry form) route directly to the principal broker (`NEXT_PUBLIC_WHATSAPP_NUMBER` and `ADMIN_EMAIL`). The owner/lister is notified when leads arrive but is not given direct access to the buyer's contact info.
*   **User Roles**: Supports 4 roles (`ADMIN`, `AGENT`, `VENDOR`, and `PROPERTY_LISTER`).
*   **PWA Optimized**: Custom layout structures configured for mobile notches, safe areas (`safe-bottom`, `safe-top`), and custom PWA install icons.

---

## 2. Tech Stack & Integration Architecture

The application is built using the following modern web technologies:

*   **Framework**: [Next.js 14.2.35](https://nextjs.org) (using App Router, server actions, route handlers, and middleware).
*   **Database**: Cloud Firestore (Firebase).
*   **Authentication**: Firebase Authentication with Email/Password and Google providers. Role-based access via Firestore user documents and custom claims.
*   **Styling**: Tailwind CSS v3 configured with customized theme palettes (Navy, Gold, and Cream).
*   **Image/Video Storage**: Firebase Storage for secure media uploads and delivery.
*   **Email Engine**: Nodemailer via Gmail SMTP for OTP generation and admin lead mirroring.
*   **Hosting**: Firebase Hosting with SSR support.
*   **Analytics**: Firebase Analytics for user behavior tracking.

---

## 3. Directory & File Structure

```
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication routes
│   │   ├── admin/              # Admin-specific authentication pages
│   │   ├── login/              # Main login route
│   │   └── register/           # Registration routes
│   ├── (dashboard)/            # Secure dashboard shells
│   │   ├── admin/              # Full Admin panel (leads, properties, users, commissions)
│   │   └── dashboard/          # Agent/Vendor dashboard
│   ├── about/                  # About page
│   ├── api/                    # API Route Handlers
│   │   ├── admin/              # Admin CRUD endpoints (users, properties, leads, vendors)
│   │   ├── auth/               # Auth endpoints
│   │   ├── properties/         # Properties listing and view pings
│   │   └── register/           # Role-based user creation APIs
│   ├── blog/                   # Blog page and details
│   ├── globals.css             # Main styling entry with custom layer designs
│   ├── layout.tsx              # Root HTML wrapper with fonts and providers
│   ├── page.tsx                # Homepage featuring home search, stats, types, and CTA banner
│   ├── privacy/                # Privacy policy page
│   ├── properties/             # Properties search filter and single property detail pages
│   └── terms/                  # Terms of service page
├── components/                 # Reusable UI component library
│   ├── ui/                     # Primitives (buttons, inputs, cards, etc.)
│   ├── home/                   # Homepage-specific components (search, stats, testimonials)
│   ├── property/               # Property cards, filters, and image carousels
│   └── brand/                  # Custom logos and branding assets
├── lib/                        # Shared libraries and utilities
│   ├── firebase.ts             # Firebase client SDK initialization
│   ├── firebase-admin.ts       # Firebase Admin SDK initialization
│   ├── firestore.ts            # Firestore collection helpers and CRUD functions
│   ├── auth.ts                 # Firebase Auth utilities and role management
│   ├── constants.ts            # Fixed Tamil Nadu cities, categories, and property types
│   └── static-blog.ts          # Static content source for blog posts
├── public/                     # Static assets (icons, images, manifest.json)
├── middleware.ts               # Global route interceptor & redirect manager
├── firebase.json               # Firebase Hosting, Firestore, Storage configuration
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── next.config.mjs             # Next.js config (including strict security headers)
└── tailwind.config.ts          # Tailwind theme configurations
```

---

## 4. Firestore Collections

| Collection | Key Fields | Notes |
|---|---|---|
| `users` | name, email, role, accountStatus, phone | Keyed by Firebase UID |
| `agentProfiles` | fullName, mobile, reraNumber, officeAddress | Keyed by userId |
| `vendorProfiles` | businessName, ownerName, category, serviceAreas | Keyed by userId |
| `properties` | title, type, listingType, price, city, status, postedById | Auto-ID |
| `propertyMedia` | propertyId, url, type, order | Subcollection or auto-ID |
| `leads` | propertyId, name, email, message, status | Auto-ID |
| `leadNotes` | leadId, note, createdAt | Auto-ID |
| `commissions` | propertyId, type, amount, status, createdBy | Auto-ID |
| `blogPosts` | title, slug, content, isPublished, authorId | Auto-ID |
| `rateLimits` | count, resetAt | Keyed by identifier |
| `settings` | siteConfig, featureFlags | Singleton |

---

## 5. Security & Access Control

Access rules are enforced via middleware.ts and Firestore Security Rules:

*   **Public Access**: All visitors can view property listings, search filters, static about pages, terms, and the blog.
*   **Private/Paused Modules**: `/register`, `/dashboard`, and `/services` routes redirect to home.
*   **Admin Panel**: `/admin/*` routes are fully protected. Non-admin sessions are redirected.
*   **Firestore Rules**: Least-privilege access — public read for published content, authenticated write for own data, admin-only for management operations.

---

## 6. Environment Configurations (`.env`)

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""

# SMTP Mail Server settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="dkpromotersproperty@gmail.com"
SMTP_PASSWORD="app-password"
ADMIN_EMAIL="dkpromotersproperty@gmail.com"

# Broker Messaging Rules
NEXT_PUBLIC_WHATSAPP_NUMBER="+91XXXXXXXXXX"

# PWA
NEXT_PUBLIC_APP_NAME="DK Promoters"
NEXT_PUBLIC_APP_SHORT_NAME="DKPromoters"
NEXT_PUBLIC_APP_DESCRIPTION="Tamil Nadu's trusted property marketplace"
NEXT_PUBLIC_THEME_COLOR="#0D1B2A"
```

---

## 7. Useful CLI Commands

*   **Launch Development Server**:
    ```bash
    npm run dev
    ```
*   **Run Build Command**:
    ```bash
    npm run build
    ```
*   **Run Linter**:
    ```bash
    npm run lint
    ```
*   **Deploy to Firebase**:
    ```bash
    firebase deploy
    ```
*   **Deploy Hosting only**:
    ```bash
    firebase deploy --only hosting
    ```
*   **Deploy Firestore rules**:
    ```bash
    firebase deploy --only firestore:rules
    ```
