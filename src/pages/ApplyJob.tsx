import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Briefcase, MapPin, Building2, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ApplyJob() {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    resume_url: '',
    notes: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        toast.error('Kunde inte hitta tjänsten.');
      } else {
        setJob(data);
      }
      setLoading(false);
    };
    fetchJob();
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    // Vi skickar in ansökan. user_id sätts till jobbets ägare 
    // så att kunden ser ansökan i sin dashboard.
    const { error } = await supabase.from('candidates').insert({
      job_id: jobId,
      user_id: job.user_id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      linkedin_url: formData.linkedin_url || null,
      resume_url: formData.resume_url || null,
      notes: formData.notes || null,
      stage: 'applied'
    });

    if (error) {
      console.error(error);
      toast.error('Något gick fel vid inskickningen.');
    } else {
      setSubmitted(true);
      toast.success('Ansökan mottagen!');
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 shadow-lg border-none">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tack för din ansökan!</h1>
          <p className="text-muted-foreground mb-6">
            Vi har tagit emot din ansökan till tjänsten som <strong>{job?.title}</strong>. 
            Rekryteraren kommer att gå igenom din profil inom kort.
          </p>
          <Button asChild className="w-full">
            <Link to="/">Gå till TalentFlow</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold mb-4">Tjänsten hittades inte</h1>
        <Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 w-4 h-4" /> Tillbaka</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-2">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{job.title}</h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.department}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
          </div>
        </div>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle>Skicka din ansökan</CardTitle>
            <CardDescription>Fyll i formuläret nedan för att söka tjänsten.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Fullständigt namn *</Label>
                  <Input 
                    id="name" 
                    required 
                    placeholder="Erik Andersson"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="erik@exempel.se"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input 
                  id="phone" 
                  placeholder="070-000 00 00"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profil (URL)</Label>
                <Input 
                  id="linkedin" 
                  placeholder="https://linkedin.com/in/dittnamn"
                  value={formData.linkedin_url}
                  onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Länk till CV / Portfölj</Label>
                <Input 
                  id="resume" 
                  placeholder="https://drive.google.com/..."
                  value={formData.resume_url}
                  onChange={e => setFormData({...formData, resume_url: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Berätta kort om dig själv</Label>
                <Textarea 
                  id="notes" 
                  rows={4} 
                  placeholder="Varför passar du för den här tjänsten?"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full text-lg h-12 shadow-lg shadow-primary/20">
                Skicka ansökan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}