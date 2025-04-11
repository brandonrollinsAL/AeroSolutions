import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  return (
    <div className="container mx-auto max-w-5xl py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-blue-900 mb-8">Terms of Service</h1>
      
      <div className="prose prose-blue max-w-none">
        <p className="text-lg text-gray-700 mb-8">
          Welcome to Aero Solutions. These Terms of Service ("Terms") govern your use of our website, products, and services. By accessing or using our services, you agree to be bound by these Terms.
        </p>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">1. Use of Services</h2>
          <p className="mb-4">
            You may use our services only as permitted by these Terms and any applicable laws. You may not misuse our services, interfere with their operation, or attempt to access them using any method other than the interface and instructions we provide.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">2. Privacy</h2>
          <p className="mb-4">
            Our Privacy Policy explains how we treat your personal data and protect your privacy when you use our services. By using our services, you agree that we can use such data in accordance with our privacy policies.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">3. Intellectual Property</h2>
          <p className="mb-4">
            The content, organization, graphics, design, compilation, and other matters related to our website and services are protected under applicable copyrights, trademarks, and other proprietary rights. Copying, redistribution, use, or publication of any such content or any part of our services is prohibited without express permission.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">4. Software in Our Services</h2>
          <p className="mb-4">
            Some of our services include software that you can download. We give you permission to use this software as part of the services, but this permission is non-exclusive, non-transferable, and subject to these Terms.
          </p>
          <p className="mb-4">
            You may not copy, modify, distribute, sell, or lease any part of our services or included software, nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit those restrictions or you have our written permission.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">5. Modifying and Terminating Our Services</h2>
          <p className="mb-4">
            We are constantly changing and improving our services. We may add or remove functionalities or features, and we may suspend or stop a service altogether.
          </p>
          <p className="mb-4">
            You can stop using our services at any time. We may also stop providing services to you, or add or create new limits to our services at any time.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">6. Warranties and Disclaimers</h2>
          <p className="mb-4">
            We provide our services using reasonable skill and care. Beyond that, we don't make any specific promises about our services.
          </p>
          <p className="mb-4">
            OTHER THAN AS EXPRESSLY SET OUT IN THESE TERMS OR ADDITIONAL TERMS, NEITHER AERO SOLUTIONS NOR ITS SUPPLIERS OR DISTRIBUTORS MAKE ANY SPECIFIC PROMISES ABOUT THE SERVICES. FOR EXAMPLE, WE DON'T MAKE ANY COMMITMENTS ABOUT THE CONTENT WITHIN THE SERVICES, THE SPECIFIC FUNCTIONS OF THE SERVICES, OR THEIR RELIABILITY, AVAILABILITY, OR ABILITY TO MEET YOUR NEEDS. WE PROVIDE THE SERVICES "AS IS".
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">7. Limitation of Liability</h2>
          <p className="mb-4">
            IN ALL CASES, AERO SOLUTIONS, AND ITS SUPPLIERS AND DISTRIBUTORS, WILL NOT BE LIABLE FOR ANY LOSS OR DAMAGE THAT IS NOT REASONABLY FORESEEABLE.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">8. Business Uses of Our Services</h2>
          <p className="mb-4">
            If you are using our services on behalf of a business, that business accepts these terms. It will hold harmless and indemnify Aero Solutions and its affiliates, officers, agents, and employees from any claim, lawsuit, or action arising from or related to the use of the services or violation of these terms, including any liability or expense arising from claims, losses, damages, lawsuits, judgments, litigation costs, and attorneys' fees.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">9. About These Terms</h2>
          <p className="mb-4">
            We may modify these terms or any additional terms that apply to a service to, for example, reflect changes to the law or changes to our services. You should look at the terms regularly. We'll post notice of modifications to these terms on this page.
          </p>
          <p className="mb-4">
            Changes will not apply retroactively and will become effective no sooner than fourteen days after they are posted. However, changes addressing new functions for a service or changes made for legal reasons will be effective immediately.
          </p>
          <p className="mb-4">
            If you do not agree to the modified terms for a service, you should discontinue your use of that service.
          </p>
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">By email: legal@aerosolutions.com</li>
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