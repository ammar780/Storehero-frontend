import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import PeriodPicker from '../components/PeriodPicker';
import DataTable from '../components/DataTable';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Image, TrendingUp, DollarSign, Eye } from 'lucide-react';

export default function CreativesPage() {
  const [period, setPeriod] = useState('30d');
  const { data, loading } = useApi('/marketing/detailed', { period }, [period]);
  const campaigns = data?.byPlatform || [];

  return (
    <div>
      <PageHeader title="Ad Creatives & Campaigns" subtitle="Performance by platform and campaign">
        <PeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      {loading ? <><SkeletonCards count={3}/><SkeletonTable/></> : (<>
        {campaigns.length > 0 ? (<>
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">ROAS by Platform</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={campaigns}>
                <XAxis dataKey="platform" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}}/>
                <Tooltip/><Bar dataKey="roas" fill="#f1c349" name="ROAS" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {campaigns.map((c,i) => (
              <div key={i} className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-5">
                <div className="font-semibold text-sm capitalize mb-3">{c.platform}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-[10px] text-surface-400 uppercase">Spend</div><div className="font-mono text-sm font-bold text-red-500">{fmt.currency(c.spend)}</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">ROAS</div><div className={`font-mono text-sm font-bold ${+c.roas>=3?'text-emerald-600':+c.roas>=1?'text-blue-600':'text-red-600'}`}>{(+c.roas).toFixed(1)}x</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">Clicks</div><div className="font-mono text-sm">{fmt.number(c.clicks)}</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">CTR</div><div className="font-mono text-sm">{c.ctr}%</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">CPC</div><div className="font-mono text-sm">{fmt.currency(c.cpc)}</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">Conversions</div><div className="font-mono text-sm font-bold">{fmt.number(c.conversions)}</div></div>
                </div>
              </div>
            ))}
          </div>
        </>) : (
          <div className="text-center py-16 text-surface-400">
            <Image size={48} className="mx-auto mb-4 opacity-30"/>
            <div className="text-lg font-display font-bold mb-2">No ad data yet</div>
            <p className="text-sm">Sync your ad platforms (Meta, Google, TikTok) from Settings to see creative performance.</p>
          </div>
        )}
      </>)}
    </div>
  );
}
