import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FreeMockupForm() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    industry: '',
    businessType: '', 
    desiredFeatures: [] as string[],
    hasExistingWebsite: '',
    existingWebsiteURL: '',
    message: '',
    termsAccepted: false 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const industryOptions = [
    "Retail", "Food & Beverage", "Professional Services", "Healthcare", 
    "Education", "Technology", "Construction", "Real Estate", 
    "Hospitality", "Manufacturing", "Transportation", "Other"
  ];

  const featureOptions = [
    { id: "company-website", label: "Company Website" },
    { id: "admin-dashboard", label: "Admin Dashboard" },
    { id: "online-booking", label: "Online Booking System" },
    { id: "online-purchases", label: "Online Store/E-Commerce" },
    { id: "analytics-dashboard", label: "Website Analytics Dashboard" },
    { id: "employee-management", label: "Employee Management Portal" },
    { id: "payroll-management", label: "Payroll Management System" },
    { id: "inventory-management", label: "Inventory Management" },
    { id: "customer-portal", label: "Customer Portal" },
    { id: "appointment-scheduling", label: "Appointment Scheduling" }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({ 
      ...formData, 
      [name]: value 
    });
  };

  const handleFeatureToggle = (id: string, checked: boolean) => {
    const updatedFeatures = checked 
      ? [...formData.desiredFeatures, id]
      : formData.desiredFeatures.filter(feature => feature !== id);
    
    setFormData({
      ...formData,
      desiredFeatures: updatedFeatures
    });
  };

  const handleExistingWebsiteChange = (value: string) => {
    setFormData({
      ...formData,
      hasExistingWebsite: value,
      // Reset URL if they select "No"
      existingWebsiteURL: value === 'no' ? '' : formData.existingWebsiteURL
    });
  };

  const handleTermsChange = (checked: boolean) => {
    setFormData({
      ...formData,
      termsAccepted: checked
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await apiRequest('POST', '/api/contact', formData);
      
      setSubmitted(true);
      toast({
        title: "Request Received!",
        description: "We'll create your free mockup and reach out within 24 hours."
      });
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  return (
    <section 
      id="free-mockup" 
      className="py-20 px-4 bg-light-gray"
      aria-labelledby="free-mockup-heading"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeInUp} custom={0}>
            <span className="inline-block mb-3 px-3 py-1 bg-electric-cyan/10 text-electric-cyan rounded-full border border-electric-cyan/20 text-sm font-medium tracking-wider uppercase font-inter">
              Free, No-Obligation
            </span>
          </motion.div>
          
          <motion.h2 
            id="free-mockup-heading"
            className="text-4xl font-bold font-poppins text-slate-blue mb-4"
            variants={fadeInUp}
            custom={1}
          >
            See What Elevion Can Do for You
          </motion.h2>
          
          <motion.p 
            className="text-lg font-lato text-slate-blue/80 max-w-3xl mx-auto"
            variants={fadeInUp}
            custom={2}
          >
            Request a free, no-obligation mockup of your new website, platform, or app. Our team will create a custom design tailored to your business at no cost. We're so confident you'll love it that there's no payment required until the job is complete to your exact specifications.
          </motion.p>
        </motion.div>
        
        {!submitted ? (
          <motion.form 
            onSubmit={handleSubmit} 
            className="max-w-lg mx-auto space-y-4 bg-white p-8 rounded-lg shadow-md border border-electric-cyan/10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeInUp} custom={3}>
              <label htmlFor="name" className="block text-sm font-medium text-slate-blue mb-1 font-inter">Your Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Smith"
                className="w-full p-3 border border-gray-300 rounded-lg font-lato text-slate-blue focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent"
                required
              />
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={4}>
              <label htmlFor="email" className="block text-sm font-medium text-slate-blue mb-1 font-inter">Your Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full p-3 border border-gray-300 rounded-lg font-lato text-slate-blue focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent"
                required
              />
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={5} className="space-y-2">
              <label className="block text-sm font-medium text-slate-blue mb-1 font-inter">Industry</label>
              <Select
                onValueChange={(value) => handleSelectChange(value, 'industry')}
                value={formData.industry}
              >
                <SelectTrigger className="w-full border-gray-300 font-lato text-slate-blue focus:ring-2 focus:ring-electric-cyan focus:border-transparent">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={6}>
              <label htmlFor="businessType" className="block text-sm font-medium text-slate-blue mb-1 font-inter">Business Type</label>
              <input
                id="businessType"
                type="text"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                placeholder="e.g., Bakery, Retail, Consulting"
                className="w-full p-3 border border-gray-300 rounded-lg font-lato text-slate-blue focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent"
                required
              />
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={7} className="space-y-2">
              <label className="block text-sm font-medium text-slate-blue font-inter">What features are you interested in?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {featureOptions.map((feature) => (
                  <div key={feature.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={feature.id} 
                      checked={formData.desiredFeatures.includes(feature.id)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
                      className="mt-0.5 data-[state=checked]:bg-electric-cyan data-[state=checked]:border-electric-cyan"
                    />
                    <Label htmlFor={feature.id} className="font-lato text-slate-blue/90 text-sm cursor-pointer">{feature.label}</Label>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={8} className="space-y-2">
              <label className="block text-sm font-medium text-slate-blue mb-1 font-inter">Do you have an existing website?</label>
              <RadioGroup 
                value={formData.hasExistingWebsite} 
                onValueChange={handleExistingWebsiteChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="yes" 
                    id="website-yes" 
                    className="data-[state=checked]:border-electric-cyan data-[state=checked]:text-electric-cyan" 
                  />
                  <Label htmlFor="website-yes" className="font-lato text-slate-blue/90">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="no" 
                    id="website-no" 
                    className="data-[state=checked]:border-electric-cyan data-[state=checked]:text-electric-cyan" 
                  />
                  <Label htmlFor="website-no" className="font-lato text-slate-blue/90">No</Label>
                </div>
              </RadioGroup>
            </motion.div>
            
            {formData.hasExistingWebsite === 'yes' && (
              <motion.div variants={fadeInUp} custom={9}>
                <label htmlFor="existingWebsiteURL" className="block text-sm font-medium text-slate-blue mb-1 font-inter">
                  Your Current Website URL
                </label>
                <input
                  id="existingWebsiteURL"
                  type="url"
                  name="existingWebsiteURL"
                  value={formData.existingWebsiteURL}
                  onChange={handleChange}
                  placeholder="https://yourbusiness.com"
                  className="w-full p-3 border border-gray-300 rounded-lg font-lato text-slate-blue focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent"
                />
              </motion.div>
            )}
            
            <motion.div variants={fadeInUp} custom={10}>
              <label htmlFor="message" className="block text-sm font-medium text-slate-blue mb-1 font-inter">Additional Requirements</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Any additional details about your business needs or specific requirements..."
                className="w-full p-3 border border-gray-300 rounded-lg font-lato text-slate-blue focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent h-24 resize-none"
              />
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={11} className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => handleTermsChange(checked as boolean)}
                className="mt-1 data-[state=checked]:bg-electric-cyan data-[state=checked]:border-electric-cyan"
              />
              <Label htmlFor="terms" className="font-lato text-slate-blue/80 text-sm">
                I agree to allow Elevion to use my business information and any provided images to create my free mockup. 
                I understand that mockups will be based on the information provided and any images submitted may be used in the 
                design process. No payment will be required until I approve the final design.
              </Label>
            </motion.div>
            
            <motion.div variants={fadeInUp} custom={12}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-electric-cyan hover:bg-sunset-orange text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 font-inter flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Request Free Mockup'}
              </button>
            </motion.div>
            
            <motion.p 
              className="text-xs text-center text-slate-blue/60 pt-2 italic font-lato"
              variants={fadeInUp}
              custom={13}
            >
              No credit card required. No obligation to proceed after receiving your mockup.
            </motion.p>
          </motion.form>
        ) : (
          <motion.div 
            className="max-w-lg mx-auto text-center bg-white p-8 rounded-lg shadow-md border border-electric-cyan/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-light-gray rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-electric-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-blue mb-4 font-poppins">Thank You!</h3>
            <p className="text-lg text-slate-blue/80 font-lato">
              We've received your request and will create your free mockup within 24 hours. We'll reach out to discuss your project and show you what we can build for you.
            </p>
          </motion.div>
        )}
        
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md border border-electric-cyan/10 text-center"
            variants={fadeInUp}
            custom={9}
          >
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-electric-cyan/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-electric-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-slate-blue font-poppins">No Risk</h3>
            <p className="text-slate-blue/70 font-lato">Pay nothing until you're 100% satisfied with the final product.</p>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md border border-electric-cyan/10 text-center"
            variants={fadeInUp}
            custom={10}
          >
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-electric-cyan/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-electric-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-slate-blue font-poppins">Fast Turnaround</h3>
            <p className="text-slate-blue/70 font-lato">Receive your custom mockup within 24 hours of your request.</p>
          </motion.div>
          
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md border border-electric-cyan/10 text-center"
            variants={fadeInUp}
            custom={11}
          >
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-electric-cyan/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-electric-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2 text-slate-blue font-poppins">Custom Design</h3>
            <p className="text-slate-blue/70 font-lato">Each mockup is uniquely created for your specific business needs.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}