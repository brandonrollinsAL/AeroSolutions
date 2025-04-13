import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactMarkdown from "react-markdown";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// Form validation schema
const formSchema = z.object({
  businessType: z.string()
    .min(3, "Business type must be at least 3 characters long")
    .max(100, "Business type must be less than 100 characters long")
});

type FormData = z.infer<typeof formSchema>;

interface MockupSuggestionFormProps {
  onComplete?: (suggestions: string) => void;
}

export default function MockupSuggestionForm({ onComplete }: MockupSuggestionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessType: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const response = await apiRequest("POST", "/api/suggest-mockup", values);
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.designIdeas);
        if (onComplete) {
          onComplete(data.designIdeas);
        }
      } else {
        setError(data.message || "Failed to generate suggestions");
      }
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">What type of business do you have?</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Italian Restaurant, Tech Startup, Fitness Studio"
                    className="text-lg p-6"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating suggestions...
              </>
            ) : (
              "Generate Design Suggestions"
            )}
          </Button>
        </form>
      </Form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {suggestions && (
        <Card className="mt-8 p-6 bg-white shadow-md">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{suggestions}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}