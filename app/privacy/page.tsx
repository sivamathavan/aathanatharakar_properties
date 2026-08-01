export const metadata = {
  title: "Privacy Policy | DK Promoters",
  description: "Privacy Policy for DK Promoters — Tamil Nadu's trusted property marketplace.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FDF8E8] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-navy-900 text-white rounded-2xl px-8 py-10 mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gold-500 mb-2">Privacy Policy</h1>
          <p className="text-gray-300 text-sm">Last updated: May 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E0D0] shadow-sm px-6 md:px-10 py-8 space-y-8 font-sans text-navy-800">

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">1. Who We Are</h2>
            <p className="text-sm leading-relaxed">
              DK Promoters (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a Tamil Nadu-based real estate marketplace operated by Tamilarasan, Vadavalli, Coimbatore — 641041. We connect property buyers, sellers, renters, agents, and allied service professionals across Tamil Nadu.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              Contact: <a href="mailto:dkpromotersproperty@gmail.com" className="text-gold-600 hover:underline">dkpromotersproperty@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">2. Information We Collect</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Account Information:</strong> Name, email address, phone number, and role (buyer, seller, agent, vendor) provided during registration.</li>
              <li><strong>Property Listings:</strong> Property details, photos, videos, location, and pricing information you submit for listings.</li>
              <li><strong>Enquiry Messages:</strong> Messages you send to property owners or service professionals through our platform.</li>
              <li><strong>Usage Data:</strong> Pages visited, search queries, filters applied, and time spent on the platform (collected via cookies and analytics).</li>
              <li><strong>Device Information:</strong> Browser type, IP address, operating system, and device identifiers for security and optimisation.</li>
              <li><strong>Google Sign-In:</strong> If you use Google OAuth, we receive your name, email, and profile picture from Google.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">3. How We Use Your Information</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>To create and manage your account securely.</li>
              <li>To display your property listings to prospective buyers and tenants.</li>
              <li>To send OTP verification codes and transactional emails (e.g., enquiry notifications, account status updates).</li>
              <li>To facilitate communication between buyers/renters and property listers.</li>
              <li>To improve platform features, fix bugs, and analyse usage patterns.</li>
              <li>To notify admins of new registrations and listings requiring review.</li>
              <li>We do <strong>not</strong> sell your personal data to any third party.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">4. Cookies & Analytics</h2>
            <p className="text-sm leading-relaxed">
              We use essential cookies to keep you logged in and remember your preferences. We may use analytics tools (such as Google Analytics) to understand how visitors use our platform. You can disable cookies in your browser settings, but some features may not work correctly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">5. Third-Party Services</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Cloudinary:</strong> We store all uploaded property photos and videos on Cloudinary servers.</li>
              <li><strong>Supabase / PostgreSQL:</strong> Your account and property data is stored in a secure PostgreSQL database hosted on Supabase.</li>
              <li><strong>Google OAuth:</strong> Used for optional social sign-in. Governed by Google's Privacy Policy.</li>
              <li><strong>SMTP / Gmail:</strong> We use Gmail SMTP to send transactional emails such as OTP codes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">6. Data Retention</h2>
            <p className="text-sm leading-relaxed">
              We retain your account information for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or compliance reasons. Property listings are kept visible for the duration specified by the lister or until removed by the admin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">7. Your Rights</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction of any inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p className="text-sm mt-3">To exercise these rights, email us at <a href="mailto:dkpromotersproperty@gmail.com" className="text-gold-600 hover:underline">dkpromotersproperty@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">8. Security</h2>
            <p className="text-sm leading-relaxed">
              We implement industry-standard security measures including encrypted database connections, secure JWT-based authentication, OTP verification for logins, and role-based access controls. However, no system is completely secure; please keep your OTP codes confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">9. Children's Privacy</h2>
            <p className="text-sm leading-relaxed">
              DK Promoters is intended for users 18 years of age and older. We do not knowingly collect personal information from minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-navy-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify registered users by email of significant changes. Your continued use of the platform after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <div className="pt-4 border-t border-[#E8E0D0] text-sm text-navy-600">
            <p>Questions? Contact us at <a href="mailto:dkpromotersproperty@gmail.com" className="text-gold-600 hover:underline">dkpromotersproperty@gmail.com</a> or call <a href="tel:+916381169124" className="text-gold-600 hover:underline">+91 63811 69124</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
