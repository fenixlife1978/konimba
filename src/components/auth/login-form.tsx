'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

interface LoginFormProps {
  isAdmin?: boolean;
}

const ADMIN_EMAIL = 'faubriciosanchez1@gmail.com';

export function LoginForm({ isAdmin = false }: LoginFormProps) {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: isAdmin ? ADMIN_EMAIL : '',
      password: isAdmin ? 'M110710.m' : '',
    },
  });

  React.useEffect(() => {
    form.reset({
      email: isAdmin ? ADMIN_EMAIL : '',
      password: isAdmin ? 'M110710.m' : '',
    });
  }, [isAdmin, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Error de Configuración',
        description: 'El servicio de autenticación no está disponible.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Role check before attempting sign-in
      if (isAdmin && values.email !== ADMIN_EMAIL) {
        throw new Error('Este no es un correo de administrador.');
      }
      if (!isAdmin && values.email === ADMIN_EMAIL) {
        throw new Error('La cuenta de administrador no puede iniciar sesión como Publisher.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      const userEmail = userCredential.user.email;
      const isUserAdmin = userEmail === ADMIN_EMAIL;

      // Post-login role validation
      if (isAdmin && !isUserAdmin) {
        await auth.signOut(); // Sign out the user
        throw new Error('Credenciales inválidas para el rol de Administrador.');
      }
      
      if (!isAdmin && isUserAdmin) {
         await auth.signOut(); // Sign out the user
        throw new Error('Credenciales de administrador no permitidas para el rol de Publisher.');
      }


      toast({
        title: 'Inicio de Sesión Exitoso',
        description: '¡Bienvenido de vuelta!',
      });
      
      // Redirect based on role
      if (isUserAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }

    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);
      let description = 'Email o contraseña inválidos. Por favor, inténtalo de nuevo.';
      if (error.message.includes('administrador') || error.message.includes('Publisher')) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Error de Inicio de Sesión',
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder={isAdmin ? ADMIN_EMAIL : "tu@email.com"} {...field} readOnly={isAdmin} />
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
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </Form>
  );
}
