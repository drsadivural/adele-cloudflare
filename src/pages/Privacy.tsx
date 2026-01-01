import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ayonix Pty Ltd ("Company", "we", "us", or "our") operates ADELE (the "Service"). 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our Service. Please read this policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may collect personally identifiable information that you voluntarily provide, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.2 Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We automatically collect certain information when you use the Service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and features used</li>
              <li>Time and date of access</li>
              <li>Referring website addresses</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.3 Content Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We process the content you create and input into the Service, including prompts, 
              generated code, and project files. This data is used to provide and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the collected information for various purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and maintain the Service</li>
              <li>To process transactions and send related information</li>
              <li>To send administrative information, updates, and security alerts</li>
              <li>To respond to your comments, questions, and requests</li>
              <li>To improve and personalize the Service</li>
              <li>To monitor and analyze usage patterns and trends</li>
              <li>To detect, prevent, and address technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. AI Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service uses artificial intelligence to generate code and content. Your inputs may be processed 
              by AI models to provide responses. We do not use your personal content to train our AI models 
              without your explicit consent. However, aggregated and anonymized data may be used to improve 
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> With third-party vendors who assist in providing the Service (e.g., payment processors, hosting providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to respond to legal process</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> For any other purpose with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your information, 
              including encryption, secure servers, and access controls. However, no method of transmission over 
              the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide 
              the Service. We may retain certain information as required by law or for legitimate business purposes. 
              You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our Service and store certain 
              information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. 
              However, some features of the Service may not function properly without cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may contain links to third-party websites or integrate with third-party services. 
              We are not responsible for the privacy practices of these third parties. We encourage you to 
              review their privacy policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for individuals under the age of 16. We do not knowingly collect 
              personal information from children under 16. If we become aware that we have collected personal 
              information from a child under 16, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have different data protection laws. By using the Service, you consent to the 
              transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review 
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-zinc-900 rounded-xl">
              <p className="text-foreground font-medium">Ayonix Pty Ltd</p>
              <p className="text-muted-foreground">Email: privacy@ayonix.com</p>
              <p className="text-muted-foreground">Website: https://adele.ayonix.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
