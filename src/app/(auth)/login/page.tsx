import { LoginForm } from '@/components/auth/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  return (
    <Tabs defaultValue="publisher" className="w-full max-w-sm">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="publisher">Publisher</TabsTrigger>
        <TabsTrigger value="admin">Administrador</TabsTrigger>
      </TabsList>
      <TabsContent value="publisher">
        <Card className="shadow-2xl shadow-black/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Acceso Publisher</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="admin">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Acceso Administrador</CardTitle>
            <CardDescription>
              Ingresa tus credenciales de administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm isAdmin />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
