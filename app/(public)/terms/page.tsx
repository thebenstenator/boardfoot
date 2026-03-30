import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — BoardFoot",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 prose prose-sm">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: March 29, 2026</p>

      <p>
        These Terms of Service ("Terms") govern your use of BoardFoot
        ("Service"), operated by Benjamin Allie Anderson doing business as
        BoardFoot ("we," "us," or "our"). By accessing or using the Service you
        agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Description of Service</h2>
      <p>
        BoardFoot is a web-based bill of materials and cost estimator for
        woodworking projects. Users can track lumber, hardware, and consumables,
        generate cut lists, and export project reports. The Service is intended
        for both personal and internal business use.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You must create an account to use the Service. You are responsible for
        maintaining the confidentiality of your credentials and for all activity
        under your account. You must provide accurate information and keep it
        up to date. Accounts are personal and non-transferable — you may not
        sell or otherwise transfer your account to another person.
      </p>
      <p>
        To request account deletion, contact us at{" "}
        <a href="mailto:boardfootfeedback@gmail.com">
          boardfootfeedback@gmail.com
        </a>
        .
      </p>

      <h2>3. Free and Paid Plans</h2>
      <p>
        BoardFoot offers a permanent free tier with feature limits (including a
        maximum of 3 saved projects) and a Pro subscription at $9/month with
        additional features. The free tier is not a time-limited trial.
      </p>
      <p>
        Pro subscriptions are billed monthly through Stripe. We accept Visa,
        Mastercard, American Express, and Discover. You may cancel your
        subscription at any time through your account settings. Cancellation
        takes effect at the end of the current billing period.{" "}
        <strong>All payments are non-refundable.</strong>
      </p>

      <h2>4. User Content</h2>
      <p>
        You may upload content to the Service, including project data and
        photos. You retain ownership of your content. By uploading content, you
        grant us a limited license to store and display it solely to provide the
        Service to you.
      </p>
      <p>
        You are solely responsible for your content. You must not upload
        content that is unlawful, infringing, or otherwise objectionable.
      </p>

      <h2>5. Prohibited Activities</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service to advertise or offer to sell goods or services.</li>
        <li>Sell or otherwise transfer your account or profile.</li>
        <li>
          Systematically scrape, extract, or harvest data from the Service.
        </li>
        <li>
          Use the Service in any way that violates applicable law or these
          Terms.
        </li>
        <li>
          Attempt to gain unauthorized access to any part of the Service or its
          infrastructure.
        </li>
      </ul>

      <h2>6. Third-Party Links and Services</h2>
      <p>
        The Service may contain links to third-party websites or services
        (including the Stripe customer portal). We are not responsible for the
        content, policies, or practices of any third-party sites. Visiting them
        is at your own risk.
      </p>
      <p>
        We use third-party service providers including Supabase, Stripe, Vercel,
        Resend, and Anthropic to deliver the Service. Your use of the Service is
        also subject to their respective terms.
      </p>

      <h2>7. AI-Generated Content</h2>
      <p>
        BoardFoot offers an AI-powered bill of materials generator. AI-generated
        content is provided as a starting point only and may be inaccurate or
        incomplete. You are responsible for reviewing and verifying any
        AI-generated output before relying on it for purchasing decisions or
        project planning.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        The Service and its original content (excluding user content) are and
        remain the exclusive property of Benjamin Allie Anderson DBA BoardFoot.
        You may not copy, modify, distribute, or create derivative works from
        any part of the Service without our express written permission.
      </p>

      <h2>9. Copyright Infringement (DMCA)</h2>
      <p>
        If you believe that content on the Service infringes your copyright,
        please notify us at{" "}
        <a href="mailto:boardfootfeedback@gmail.com">
          boardfootfeedback@gmail.com
        </a>{" "}
        with a description of the copyrighted work, the location of the
        infringing material, your contact information, and a statement of good
        faith belief that the use is not authorized.
      </p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>
        The Service is provided "as is" and "as available" without warranties of
        any kind, express or implied. We do not warrant that the Service will be
        uninterrupted, error-free, or that cost estimates generated by the
        Service will be accurate. You use the Service at your own risk.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, our total liability to you for
        any claims arising out of or relating to the Service is limited to the
        amount you paid us in the twelve months preceding the claim. We are not
        liable for any indirect, incidental, special, consequential, or punitive
        damages.
      </p>

      <h2>12. Dispute Resolution</h2>
      <p>
        We encourage you to contact us first at{" "}
        <a href="mailto:boardfootfeedback@gmail.com">
          boardfootfeedback@gmail.com
        </a>{" "}
        to resolve any dispute informally. If a dispute cannot be resolved
        informally within 30 days, it shall be settled by binding arbitration in
        Utah, United States. We will pay arbitration fees if they are deemed
        excessive. Any court proceedings, if necessary, shall take place in
        Utah.
      </p>
      <p>
        Any claim arising out of or relating to these Terms must be brought
        within one (1) year of the date the claim arose.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Utah, without
        regard to its conflict of law provisions.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. When we do, we will notify
        you by email and update the "Last updated" date at the top of this page.
        Continued use of the Service after changes take effect constitutes
        acceptance of the updated Terms.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href="mailto:boardfootfeedback@gmail.com">
          boardfootfeedback@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
