import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FaKey, FaUser, FaSpinner } from 'react-icons/fa';
import MainLayout from '@/components/MainLayout';
import LanguageMetaTags from '@/components/LanguageMetaTags';

// Define form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  // Extract the 'redirect' query parameter if it exists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email: data.email,
        password: data.password,
      });
      
      // Special case for admin credentials (in a real app this would be handled server-side)
      if (data.email === 'brandonrollins@aerolink.community' && data.password === '*Rosie2010') {
        // Create a simple JWT-like token with admin role
        const fakeAdminToken = btoa(JSON.stringify({
          id: 1,
          username: 'Brandon Rollins',
          email: 'brandonrollins@aerolink.community',
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        }));
        
        // Store the token
        localStorage.setItem('token', fakeAdminToken);
        
        toast({
          title: 'Success',
          description: 'Welcome back, Administrator!',
        });
        
        // Redirect to admin dashboard or requested page
        if (redirectPath) {
          setLocation(redirectPath);
        } else {
          setLocation('/admin');
        }
        
        return;
      }
      
      if (response.success) {
        // Store the returned token
        localStorage.setItem('token', response.data.token);
        
        toast({
          title: 'Success',
          description: 'You have been successfully logged in!',
        });
        
        // Redirect to destination or home
        if (redirectPath) {
          setLocation(redirectPath);
        } else {
          setLocation('/account');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
      toast({
        title: 'Error',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <Helmet>
        <title>{t('login_page_title')} | Aero Solutions</title>
        <meta name="description" content={t('login_page_description')} />
        <html lang={t('language_code')} />
      </Helmet>
      <LanguageMetaTags />
      
      <div className="container max-w-screen-lg mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold">{t('login_title')}</CardTitle>
                <CardDescription>{t('login_subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                {loginError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-medium flex items-center">
                        <FaUser className="mr-2 h-4 w-4 text-muted-foreground" />
                        {t('email_address')}
                      </Label>
                      <Input
                        id="email"
                        type="email" 
                        placeholder="your.email@example.com"
                        autoComplete="email"
                        {...register('email')}
                        className={`${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-medium flex items-center">
                        <FaKey className="mr-2 h-4 w-4 text-muted-foreground" />
                        {t('password')}
                      </Label>
                      <Input 
                        id="password"
                        type="password"
                        placeholder="••••••••" 
                        autoComplete="current-password"
                        {...register('password')}
                        className={`${errors.password ? 'border-red-500' : ''}`}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                          {t('logging_in')}
                        </>
                      ) : (
                        t('login_button')
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <a 
                        href="/forgot-password" 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('forgot_password')}
                      </a>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col pt-2">
                <p className="text-center text-sm text-muted-foreground">
                  {t('no_account')} <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">{t('signup_now')}</a>
                </p>
                
                {/* Admin login hint */}
                <div className="mt-6 pt-4 border-t border-gray-200 w-full text-center">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Admin access</span>: brandonrollins@aerolink.community
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}