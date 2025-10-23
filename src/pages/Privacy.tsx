import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <Link 
          to="/" 
          className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Events
        </Link>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bebas text-foreground mb-4 tracking-wider">
            PRIVACY POLICY
          </h1>
          <p className="text-xl text-primary">How we protect and use your information</p>
        </header>

        {/* Privacy Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Boombastic Events Ltd ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or attend our events.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Information We Collect</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              <p>
                <strong className="text-foreground">Personal Information:</strong> When you book tickets through our third-party providers (such as Eventbrite), they may collect personal information including your name, email address, and payment information. We do not directly collect or store payment information.
              </p>
              <p>
                <strong className="text-foreground">Usage Data:</strong> We may collect information about how you access and use our website, including your IP address, browser type, pages visited, and time spent on pages.
              </p>
              <p>
                <strong className="text-foreground">Event Information:</strong> When you attend our events, we may collect information necessary for event management and safety purposes.
              </p>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">How We Use Your Information</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and manage your event bookings</li>
                <li>Send you event information and updates</li>
                <li>Improve our website and services</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Information Sharing</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Third-party Service Providers:</strong> Including ticketing platforms (Eventbrite), payment processors, and event management tools
                </li>
                <li>
                  <strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights
                </li>
                <li>
                  <strong className="text-foreground">Business Transfers:</strong> In connection with any merger, sale, or transfer of our business
                </li>
              </ul>
              <p className="mt-3">We do not sell your personal information to third parties.</p>
            </div>
          </section>

          {/* Cookies */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may use cookies and similar tracking technologies to enhance your experience. You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of our website.
            </p>
          </section>

          {/* Your Rights */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Your Rights</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              <p>Under data protection law, you have rights including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The right to access your personal information</li>
                <li>The right to rectification of incorrect data</li>
                <li>The right to erasure of your data</li>
                <li>The right to restrict processing</li>
                <li>The right to data portability</li>
                <li>The right to object to processing</li>
                <li>Rights related to automated decision-making</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:hello@boomevents.co.uk" className="text-primary hover:text-primary/80">
                  hello@boomevents.co.uk
                </a>
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites (such as Eventbrite and Facebook). We are not responsible for the privacy practices of these websites. Please review their privacy policies before providing any personal information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-muted-foreground mt-3">
              <strong className="text-foreground">Last Updated:</strong> January 2025
            </p>
          </section>

          {/* Contact */}
          <section className="privacy-section bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border hover:translate-x-1 transition-transform">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Contact Us</h2>
            <div className="text-muted-foreground leading-relaxed space-y-2">
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
              <p>
                <strong className="text-foreground">Email:</strong>{" "}
                <a href="mailto:hello@boomevents.co.uk" className="text-primary hover:text-primary/80">
                  hello@boomevents.co.uk
                </a>
              </p>
              <p>
                <strong className="text-foreground">Company:</strong> Boombastic Events Ltd
              </p>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bebas text-foreground mb-4">Ready to Party?</h2>
          <p className="text-muted-foreground mb-6">Check out our upcoming events and secure your tickets today!</p>
          <Link 
            to="/" 
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            View Upcoming Events
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
