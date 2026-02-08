import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
// Notera: Importerar Link som LinkIcon här
import { Plus, Briefcase, MapPin, Building, Users, Pencil, Link as LinkIcon } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  status: string;
  created_at: string;
  candidate_count?: number;
}

export default function Jobs() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', department: '', location: '' });

  const isAdmin = role === 'admin';

  const fetchJobs = async () => {
    if (!user) return;

    let jobsQuery = supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!isAdmin) {
      jobsQuery = jobsQuery.eq('user_id', user.id);
    }

    const { data: jobsData, error } = await jobsQuery;

    if (error) {
      toast.error('Failed to load jobs');
      return;
    }

    const jobsWithCounts = await Promise.all(
      (jobsData || []).map(async (job) => {
        const { count } = await supabase
          .from('candidates')
          .select('id', { count: 'exact', head: true })
          .eq('job_id', job.id);
        return { ...job, candidate_count: count || 0 };
      })
    );

    setJobs(jobsWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [user, isAdmin]);

  const copyApplyLink = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // Förhindra att kortets onClick (navigering) körs
    const url = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(url);
    toast.success("Ansökningslänk kopierad! Skicka denna till kandidaten.");
  };

  const handleOpenAdd = () => {
    setEditingJob(null);
    setFormData({ title: '', description: '', department: '', location: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description || '',
      department: job.department || '',
      location: job.location || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    const payload = {
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      department: formData.department || null,
      location: formData.location || null,
    };

    if (editingJob) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', editingJob.id);
      if (error) {
        toast.error('Failed to update job');
        return;
      }
      toast.success('Job updated successfully');
    } else {
      const { error } = await supabase.from('jobs').insert({ ...payload, status: 'open' });
      if (error) {
        toast.error('Failed to create job');
        return;
      }
      toast.success('Job created successfully');
    }

    setDialogOpen(false);
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Jobs</h2>
          <p className="text-muted-foreground">Manage your open positions</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingJob ? 'Edit Job' : 'Create New Job'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Remote, Stockholm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Job description..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingJob ? 'Save Changes' : 'Create Job'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card 
              key={job.id} 
              className="border-border/50 cursor-pointer hover:border-primary/50 transition-all group relative"
              onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {job.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                    
                    {/* HÄR ÄR DIN SHARE-KNAPP */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Kopiera ansökningslänk"
                      onClick={(e) => copyApplyLink(e, job.id)}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Redigera jobb"
                      onClick={(e) => handleOpenEdit(e, job)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {job.description && (
                  <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.candidate_count} candidates
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}