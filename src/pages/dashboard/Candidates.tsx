import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Mail, Phone, Briefcase, LayoutGrid, List, Search, GripVertical, Linkedin, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CandidateWithJob {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  stage: string;
  notes: string | null;
  created_at: string;
  jobs: {
    id: string;
    title: string;
  } | null;
}

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'screening', label: 'Screening', color: 'bg-blue-50 dark:bg-blue-900/30' },
  { id: 'interview', label: 'Interview', color: 'bg-amber-50 dark:bg-amber-900/30' },
  { id: 'offer', label: 'Offer', color: 'bg-emerald-50 dark:bg-emerald-900/30' },
  { id: 'hired', label: 'Hired', color: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-50 dark:bg-red-900/30' },
];

const stageBadgeClasses: Record<string, string> = {
  applied: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  screening: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800',
  interview: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-800',
  offer: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/60 dark:text-blue-200 dark:border-emerald-800',
  hired: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-800',
  rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/60 dark:text-red-200 dark:border-red-800',
};

export default function Candidates() {
  const { user, role } = useAuth();
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [allJobsForFilter, setAllJobsForFilter] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);

  // State for editing
  const [editingCandidate, setEditingCandidate] = useState<CandidateWithJob | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    resume_url: '',
    notes: ''
  });

  const isAdmin = role === 'admin';

  const fetchData = async () => {
    if (!user) return;

    let candidatesQuery = supabase
      .from('candidates')
      .select('id, job_id, name, email, phone, linkedin_url, resume_url, stage, notes, created_at, jobs(id, title)')
      .order('created_at', { ascending: false });
      
    if (!isAdmin) {
      candidatesQuery = candidatesQuery.eq('user_id', user.id);
    }

    const [candidatesRes, jobsRes] = await Promise.all([
      candidatesQuery,
      isAdmin ? supabase.from('jobs').select('id, title').order('title') : Promise.resolve({ data: null, error: null }),
    ]);

    if (!candidatesRes.error) {
      setCandidates((candidatesRes.data as CandidateWithJob[]) || []);
    }
    if (isAdmin && jobsRes.data) {
      setAllJobsForFilter(jobsRes.data as { id: string; title: string }[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  const handleOpenEdit = (candidate: CandidateWithJob) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      linkedin_url: candidate.linkedin_url || '',
      resume_url: candidate.resume_url || '',
      notes: candidate.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    const { error } = await supabase
      .from('candidates')
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        resume_url: formData.resume_url || null,
        notes: formData.notes || null,
      })
      .eq('id', editingCandidate.id);

    if (error) {
      toast.error('Failed to update candidate');
      return;
    }

    toast.success('Candidate updated successfully');
    setIsEditDialogOpen(false);
    fetchData();
  };

  const jobTitles = useMemo(() => {
    if (isAdmin && allJobsForFilter.length > 0) {
      return allJobsForFilter.map((j) => ({ id: j.id, title: j.title }));
    }
    const titles = new Map<string, string>();
    candidates.forEach((c) => {
      if (c.jobs?.id && c.jobs?.title) {
        titles.set(c.jobs.id, c.jobs.title);
      }
    });
    return Array.from(titles.entries()).map(([id, title]) => ({ id, title }));
  }, [candidates, isAdmin, allJobsForFilter]);

  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    if (jobTitleFilter !== 'all') {
      list = list.filter((c) => c.jobs?.id === jobTitleFilter);
    }
    return list;
  }, [candidates, searchName, jobTitleFilter]);

  const handleDrop = async (stageId: string) => {
    if (!draggedCandidate) return;

    const { error } = await supabase
      .from('candidates')
      .update({ stage: stageId })
      .eq('id', draggedCandidate);

    if (error) {
      toast.error('Failed to update candidate stage');
      return;
    }

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === draggedCandidate ? { ...c, stage: stageId } : c
      )
    );
    setDraggedCandidate(null);
  };

  const getCandidatesByStage = (stageId: string) =>
    filteredCandidates.filter((c) => c.stage === stageId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">All Candidates</h2>
        <p className="text-muted-foreground">View and manage all candidates across all jobs</p>
      </div>

      <div className="toolbar-unified flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="h-9 rounded-lg border-border bg-background pl-9"
          />
        </div>
        <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
          <SelectTrigger className="h-9 w-full min-w-[160px] max-w-[220px] rounded-lg border-border">
            <SelectValue placeholder="All job titles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All job titles</SelectItem>
            {jobTitles.map(({ id, title }) => (
              <SelectItem key={id} value={id}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="h-6 w-px bg-border shrink-0" aria-hidden />
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
          <TabsList className="h-9 rounded-lg bg-muted/60 p-1">
            <TabsTrigger value="kanban" className="gap-2 rounded-md px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2 rounded-md px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <List className="w-4 h-4" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Candidate Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCandidate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
              <Input
                id="edit-linkedin"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-resume">Resume URL (Link)</Label>
              <Input
                id="edit-resume"
                value={formData.resume_url}
                onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                placeholder="https://link-to-resume.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {filteredCandidates.length === 0 ? (
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No candidates match</h3>
            <p className="text-muted-foreground">
              {candidates.length === 0
                ? 'Add candidates to your job postings to see them here.'
                : 'Try adjusting your search or job title filter.'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="rounded-xl border-border/60 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {candidate.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Briefcase className="w-4 h-4" />
                      {candidate.jobs?.title || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={stageBadgeClasses[candidate.stage] || 'border-border'}>
                      {candidate.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {candidate.linkedin_url && (
                        <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {candidate.resume_url && (
                        <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-800">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(candidate)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              <Card className={`rounded-xl border border-border/60 shadow-sm h-full flex flex-col ${stage.color}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {stage.label}
                    <Badge variant="outline" className={stageBadgeClasses[stage.id] || ''}>
                      {getCandidatesByStage(stage.id).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[200px] flex-1 overflow-auto">
                  {getCandidatesByStage(stage.id).map((candidate) => (
                    <Card
                      key={candidate.id}
                      draggable
                      onDragStart={() => setDraggedCandidate(candidate.id)}
                      onClick={() => handleOpenEdit(candidate)}
                      className="kanban-card cursor-pointer hover:border-primary/50 transition-all border-border/60 shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                               <p className="font-bold text-foreground truncate">{candidate.name}</p>
                               <div className="flex gap-1.5 flex-shrink-0">
                                  {candidate.linkedin_url && <Linkedin className="w-3.5 h-3.5 text-blue-600" />}
                                  {candidate.resume_url && <FileText className="w-3.5 h-3.5 text-slate-600" />}
                               </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                {candidate.email}
                              </p>
                              {candidate.jobs?.title && (
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                  <Briefcase className="w-3 h-3" />
                                  {candidate.jobs.title}
                                </p>
                              )}
                            </div>
                            
                            {candidate.notes && (
                              <p className="text-[11px] text-muted-foreground mt-3 line-clamp-2 italic border-t border-slate-100 pt-2">
                                "{candidate.notes}"
                              </p>
                            )}
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
      )}
    </div>
  );
}