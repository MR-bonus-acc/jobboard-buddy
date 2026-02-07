import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateCustomer() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Creating users requires server-side Supabase Admin API (service role).
    // Wire this form to an Edge Function or backend that calls
    // supabase.auth.admin.inviteUserByEmail() or createUser().
    toast.info('User creation requires a backend with Supabase Admin API. Connect an Edge Function or API route.');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create Customer</h2>
        <p className="text-muted-foreground">Invite a new customer to the platform. Only admins can access this page.</p>
      </div>

      <Card className="border-border/50 max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Customer
          </CardTitle>
          <CardDescription>
            Enter the customer&apos;s email and name. They will receive an invite to sign up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending…' : 'Send Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
