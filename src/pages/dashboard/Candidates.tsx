import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Mail, Phone, Briefcase } from 'lucide-react';

interface CandidateWithJob {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  stage: string;
  created_at: string;
  jobs: {
    title: string;
  } | null;
}

const stageColors: Record<string, string> = {
  applied: 'bg-muted text-muted-foreground',
  screening: 'bg-info/20 text-info',
  interview: 'bg-warning/20 text-warning',
  offer: 'bg-success/20 text-success',
  hired: 'bg-primary/20 text-primary',
  rejected: 'bg-destructive/20 text-destructive',
};

export default function Candidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('candidates')
        .select('id, name, email, phone, stage, created_at, jobs(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setCandidates(data || []);
      }
      setLoading(false);
    };

    fetchCandidates();
  }, [user]);

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
        <p className="text-muted-foreground">View all candidates across all jobs</p>
      </div>

      {candidates.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No candidates yet</h3>
            <p className="text-muted-foreground">Add candidates to your job postings to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {candidate.email}
                        </span>
                        {candidate.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {candidate.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      {candidate.jobs?.title || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={stageColors[candidate.stage] || ''}>
                      {candidate.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
