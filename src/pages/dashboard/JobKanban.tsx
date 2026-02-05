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
import { ArrowLeft, Plus, Mail, Phone, GripVertical, User } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
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
  { id: 'applied', label: 'Applied', color: 'bg-muted' },
  { id: 'screening', label: 'Screening', color: 'bg-info/20' },
  { id: 'interview', label: 'Interview', color: 'bg-warning/20' },
  { id: 'offer', label: 'Offer', color: 'bg-success/20' },
  { id: 'hired', label: 'Hired', color: 'bg-primary/20' },
  { id: 'rejected', label: 'Rejected', color: 'bg-destructive/20' },
];

export default function JobKanban() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', notes: '' });
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user || !jobId) return;

    const [jobRes, candidatesRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).eq('user_id', user.id).single(),
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

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jobId || !newCandidate.name.trim() || !newCandidate.email.trim()) return;

    const { error } = await supabase.from('candidates').insert({
      job_id: jobId,
      user_id: user.id,
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone || null,
      notes: newCandidate.notes || null,
      stage: 'applied',
    });

    if (error) {
      toast.error('Failed to add candidate');
      return;
    }

    toast.success('Candidate added');
    setNewCandidate({ name: '', email: '', phone: '', notes: '' });
    setDialogOpen(false);
    fetchData();
  };

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidate(candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedCandidate) return;

    const { error } = await supabase
      .from('candidates')
      .update({ stage: stageId })
      .eq('id', draggedCandidate);

    if (error) {
      toast.error('Failed to update candidate');
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
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newCandidate.notes}
                  onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                  placeholder="Initial notes about the candidate..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">Add Candidate</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className={`border-border/50 ${stage.color}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stage.label}
                  <Badge variant="secondary" className="ml-2">
                    {getCandidatesByStage(stage.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[200px]">
                {getCandidatesByStage(stage.id).map((candidate) => (
                  <Card
                    key={candidate.id}
                    draggable
                    onDragStart={() => handleDragStart(candidate.id)}
                    className="cursor-grab active:cursor-grabbing bg-card border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{candidate.name}</p>
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
