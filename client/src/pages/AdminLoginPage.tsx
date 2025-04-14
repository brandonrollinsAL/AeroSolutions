import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useRoute } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole, Shield } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAdmin();
  const [, navigate] = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);
  
  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Admin Login | Elevion</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-2" />
          <h1 className="text-3xl font-bold">Elevion Admin</h1>
          <p className="text-muted-foreground">Admin dashboard login</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@elevion.dev" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>Protected area. Authorized personnel only.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;