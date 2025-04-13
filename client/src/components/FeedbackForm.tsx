import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";

// Define the form schema using Zod
const feedbackSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  feedbackType: z.enum(["suggestion", "bug", "question", "praise", "other"], {
    required_error: "Please select a feedback type",
  }),
  rating: z.number().min(1).max(5),
  message: z.string().min(10, { message: "Feedback must be at least 10 characters long" }).max(2000),
});

// Infer the type from the schema
type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const FeedbackForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  
  // Initialize the form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: "",
      email: "",
      feedbackType: "suggestion",
      rating: 0,
      message: "",
    },
  });

  // Submit handler
  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the data to match the API's expectations
      // Add name and email information to the message since the API doesn't have fields for them
      const enhancedMessage = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
      
      const feedbackData = {
        message: enhancedMessage,
        rating: data.rating,
        category: data.feedbackType, // Map feedbackType to category field
        source: 'website'
      };
      
      const response = await apiRequest("POST", "/api/feedback", feedbackData);
      
      if (response.ok) {
        toast({
          title: t('feedback_success_title', 'Feedback Submitted'),
          description: t('feedback_success_message', 'Thank you for your feedback! We appreciate your input.'),
        });
        
        // Reset the form
        reset();
        setSelectedRating(0);
      } else {
        const errorData = await response.json();
        
        toast({
          title: t('feedback_error_title', 'Submission Failed'),
          description: errorData.error || t('feedback_error_message', 'There was an error submitting your feedback. Please try again.'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('feedback_error_title', 'Submission Failed'),
        description: t('feedback_error_message', 'There was an error submitting your feedback. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle star rating selection
  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    setValue("rating", rating);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('feedback_form_title', 'Share Your Feedback')}
          <BrainCircuit className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription>
          {t('feedback_form_subtitle', 'Your feedback will be analyzed by our AI to improve our services')}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('feedback_name_label', 'Your Name')}</Label>
              <Input 
                id="name" 
                {...register("name")} 
                placeholder={t('feedback_name_placeholder', 'Enter your name')}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('feedback_email_label', 'Email Address')}</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                placeholder={t('feedback_email_placeholder', 'Enter your email')}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feedback Type */}
            <div className="space-y-2">
              <Label htmlFor="feedbackType">{t('feedback_type_label', 'Feedback Type')}</Label>
              <Select 
                defaultValue="suggestion" 
                onValueChange={(value) => setValue("feedbackType", value as any)}
              >
                <SelectTrigger className={errors.feedbackType ? "border-destructive" : ""}>
                  <SelectValue placeholder={t('feedback_type_placeholder', 'Select a type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">{t('feedback_type_suggestion', 'Suggestion')}</SelectItem>
                  <SelectItem value="bug">{t('feedback_type_bug', 'Bug Report')}</SelectItem>
                  <SelectItem value="question">{t('feedback_type_question', 'Question')}</SelectItem>
                  <SelectItem value="praise">{t('feedback_type_praise', 'Praise')}</SelectItem>
                  <SelectItem value="other">{t('feedback_type_other', 'Other')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.feedbackType && (
                <p className="text-sm text-destructive">{errors.feedbackType.message}</p>
              )}
            </div>
            
            {/* Rating */}
            <div className="space-y-2">
              <Label>{t('feedback_rating_label', 'Your Rating')}</Label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingSelect(rating)}
                    className={`text-2xl px-1 focus:outline-none ${
                      selectedRating >= rating ? "text-amber-400" : "text-gray-300"
                    }`}
                    aria-label={`Rate ${rating} stars`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {selectedRating > 0 
                    ? t('feedback_rating_selected', '{{rating}} out of 5', { rating: selectedRating })
                    : t('feedback_rating_none', 'No rating selected')}
                </span>
              </div>
              {errors.rating && (
                <p className="text-sm text-destructive">{t('feedback_rating_error', 'Please select a rating')}</p>
              )}
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t('feedback_message_label', 'Your Feedback')}</Label>
            <Textarea 
              id="message" 
              {...register("message")} 
              placeholder={t('feedback_message_placeholder', 'Tell us your thoughts, suggestions, or report an issue...')}
              className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              reset();
              setSelectedRating(0);
            }}
            disabled={isSubmitting}
          >
            {t('feedback_clear_button', 'Clear Form')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? t('feedback_submitting_button', 'Submitting...') 
              : t('feedback_submit_button', 'Submit Feedback')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FeedbackForm;