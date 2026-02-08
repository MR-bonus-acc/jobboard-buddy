import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Mail, Phone, GripVertical, Linkedin, FileText } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  stage: string;
  notes: string | null;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string | null;
  status: string;
}

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'screening', label: 'Screening', color: 'bg-blue-50 dark:bg-blue-900/30' },
  { id: 'interview', label: 'Interview', color: 'bg-amber-50 dark:bg-amber-900/30' },
  { id: 'offer', label: 'Offer', color: 'bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'hired', label: 'Hired', color: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-50 dark:bg-red-900/30' },
];

export default function JobKanban() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    linkedin_url: '', 
    resume_url: '', 
    notes: '' 
  });
  
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  const fetchData = async () => {
    if (!user || !jobId) return;

    let jobQuery = supabase.from('jobs').select('*').eq('id', jobId);
    if (!isAdmin) {
      jobQuery = jobQuery.eq('user_id', user.id);
    }

    const [jobRes, candidatesRes] = await Promise.all([
      jobQuery.single(),
      supabase.from('candidates').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
    ]);

    if (jobRes.error) {
      toast.error('Job not found');
      navigate('/dashboard/jobs');
      return;
    }

    setJob(jobRes.data);
    setCandidates(candidatesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, jobId]);

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setFormData({ name: '', email: '', phone: '', linkedin_url: '', resume_url: '', notes: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      linkedin_url: candidate.linkedin_url || '',
      resume_url: candidate.resume_url || '',
      notes: candidate.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jobId || !formData.name.trim() || !formData.email.trim()) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      linkedin_url: formData.linkedin_url || null,
      resume_url: formData.resume_url || null,
      notes: formData.notes || null,
    };

    if (editingCandidate) {
      const { error } = await supabase
        .from('candidates')
        .update(payload)
        .eq('id', editingCandidate.id);

      if (error) {
        toast.error('Failed to update candidate');
        return;
      }
      toast.success('Candidate updated');
    } else {
      const { error } = await supabase.from('candidates').insert({
        ...payload,
        job_id: jobId,
        user_id: user.id,
        stage: 'applied',
      });

      if (error) {
        toast.error('Failed to add candidate');
        return;
      }
      toast.success('Candidate added');
    }

    setDialogOpen(false);
    fetchData();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedCandidate) return;

    const { error } = await supabase
      .from('candidates')
      .update({ stage: stageId })
      .eq('id', draggedCandidate);

    if (error) {
      toast.error('Failed to update stage');
      return;
    }

    setCandidates(candidates.map(c => 
      c.id === draggedCandidate ? { ...c, stage: stageId } : c
    ));
    setDraggedCandidate(null);
  };

  const getCandidatesByStage = (stageId: string) => 
    candidates.filter(c => c.stage === stageId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/jobs')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{job?.title}</h2>
          <p className="text-muted-foreground">{job?.department} • {job?.location}</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+46 70..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume">Resume URL (Link)</Label>
                <Input
                  id="resume"
                  value={formData.resume_url}
                  onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Experience with React..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCandidate ? 'Save Changes' : 'Add Candidate'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className={`rounded-xl border border-border/60 shadow-sm ${stage.color}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stage.label}
                  <Badge variant="secondary" className="ml-2 rounded-md">
                    {getCandidatesByStage(stage.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[400px]">
                {getCandidatesByStage(stage.id).map((candidate) => (
                  <Card
                    key={candidate.id}
                    draggable
                    onDragStart={() => setDraggedCandidate(candidate.id)}
                    onClick={() => handleOpenEdit(candidate)}
                    className="kanban-card cursor-pointer hover:border-primary/50 transition-colors border-border/60"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground truncate">{candidate.name}</p>
                            <div className="flex gap-1">
                              {candidate.linkedin_url && (
                                <Linkedin className="w-3 h-3 text-blue-600" />
                              )}
                              {candidate.resume_url && (
                                <FileText className="w-3 h-3 text-slate-600" />
                              )}
                            </div>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" />
                              {candidate.email}
                            </p>
                            {candidate.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {candidate.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}