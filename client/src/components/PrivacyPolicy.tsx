import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-5xl py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-blue-900 mb-8">Privacy Policy</h1>
      
      <div className="prose prose-blue max-w-none">
        <p className="text-lg text-gray-700 mb-8">
          At Aero Solutions, we prioritize your privacy and are committed to protecting your personal data.
          This Privacy Policy explains how we collect, use, protect, and share information when you use our services or visit our website.
        </p>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Information We Collect</h2>
          <p className="mb-4">We collect the following types of information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>Personal Information:</strong> Name, email address, phone number, and company information provided through our contact forms.</li>
            <li className="mb-2"><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited, time spent, and features used.</li>
            <li className="mb-2"><strong>Technical Data:</strong> IP address, browser type and version, device information, and operating system.</li>
            <li className="mb-2"><strong>Cookies and Similar Technologies:</strong> Information stored through cookies to enhance user experience and analyze website performance.</li>
          </ul>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use your information for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">To provide and maintain our services</li>
            <li className="mb-2">To notify you about changes to our services</li>
            <li className="mb-2">To allow you to participate in interactive features when you choose to do so</li>
            <li className="mb-2">To provide customer support and respond to inquiries</li>
            <li className="mb-2">To gather analysis to improve our services</li>
            <li className="mb-2">To monitor the usage of our services</li>
            <li className="mb-2">To detect, prevent, and address technical issues</li>
          </ul>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Encryption of sensitive data using industry-standard protocols</li>
            <li className="mb-2">Regular security assessments and penetration testing</li>
            <li className="mb-2">Access controls to limit data access to authorized personnel only</li>
            <li className="mb-2">Secure data storage with regular backups</li>
            <li className="mb-2">Employee training on data protection and security practices</li>
          </ul>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Your Data Protection Rights Under GDPR</h2>
          <p className="mb-4">
            If you are a resident of the European Economic Area (EEA), you have certain data protection rights. Aero Solutions aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
          </p>
          <p className="mb-4">You have the following data protection rights:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>The right to access</strong> – You have the right to request copies of your personal data.</li>
            <li className="mb-2"><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
            <li className="mb-2"><strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.</li>
            <li className="mb-2"><strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
            <li className="mb-2"><strong>The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.</li>
            <li className="mb-2"><strong>The right to data portability</strong> – You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
          </ul>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Cookies Policy</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
          </p>
          <p className="mb-4">We use the following types of cookies:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>Essential Cookies:</strong> Necessary for the basic functionality of the website.</li>
            <li className="mb-2"><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website.</li>
            <li className="mb-2"><strong>Functional Cookies:</strong> Enable personalized features and remember your preferences.</li>
            <li className="mb-2"><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements.</li>
          </ul>
          <p className="mb-4">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          <p className="mb-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">By email: privacy@aerosolutions.com</li>
            <li className="mb-2">By phone: +1 (555) 123-4567</li>
            <li className="mb-2">By mail: 123 Aviation Way, Suite 500, Skyport, CA 94000, USA</li>
          </ul>
        </section>
        
        <div className="text-right text-sm text-gray-500 mt-8">
          Last Updated: April 11, 2025
        </div>
      </div>
    </div>
  );
}