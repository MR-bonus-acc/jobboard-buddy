import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, UserCheck, TrendingUp } from 'lucide-react';

interface Stats {
  totalJobs: number;
  totalCandidates: number;
  hiredCandidates: number;
  activeJobs: number;
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalJobs: 0, totalCandidates: 0, hiredCandidates: 0, activeJobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const isAdmin = role === 'admin';
      const userIdFilter = isAdmin ? undefined : user.id;

      const [jobsRes, candidatesRes, hiredRes, activeRes] = await Promise.all([
        userIdFilter
          ? supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', userIdFilter)
          : supabase.from('jobs').select('id', { count: 'exact', head: true }),
        userIdFilter
          ? supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('user_id', userIdFilter)
          : supabase.from('candidates').select('id', { count: 'exact', head: true }),
        userIdFilter
          ? supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('stage', 'hired').eq('user_id', userIdFilter)
          : supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('stage', 'hired'),
        userIdFilter
          ? supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('user_id', userIdFilter)
          : supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);

      setStats({
        totalJobs: jobsRes.count ?? 0,
        totalCandidates: candidatesRes.count ?? 0,
        hiredCandidates: hiredRes.count ?? 0,
        activeJobs: activeRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, [user, role]);

  const statCards = [
    { title: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'text-primary' },
    { title: 'Active Positions', value: stats.activeJobs, icon: TrendingUp, color: 'text-success' },
    { title: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'text-info' },
    { title: 'Hired', value: stats.hiredCandidates, icon: UserCheck, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back!</h2>
        <p className="text-muted-foreground">Here's an overview of your recruitment activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {loading ? '-' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
