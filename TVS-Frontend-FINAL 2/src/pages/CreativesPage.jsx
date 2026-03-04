import { useApi } from '../hooks/useApi';
import { fmt } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { Image } from 'lucide-react';

export default function CreativesPage() {
  const { data, loading } = useApi('/marketing/creatives');
  return (
    <div>
      <PageHeader title="Creatives" subtitle="Visual ad creative performance" />
      {loading ? <SkeletonTable /> : !data?.length ? (
        <EmptyState icon={Image} title="No creatives yet" description="Connect ad platforms in Settings to see creative performance." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {data.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-cardHover transition-all">
              {c.image_url ? <img src={c.image_url} className="w-full h-48 object-cover" alt="" /> : <div className="w-full h-48 bg-surface-100 flex items-center justify-center"><Image size={32} className="text-surface-300" /></div>}
              <div className="p-5">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-100 text-surface-600 mb-2">{c.platform}</span>
                <h4 className="font-medium text-surface-800 text-sm truncate mt-1">{c.headline || c.campaign_name || 'Untitled'}</h4>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-surface-100">
                  <div><div className="text-[10px] text-surface-400 uppercase">Spend</div><div className="text-sm font-semibold">{fmt.compact(c.total_spend)}</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">ROAS</div><div className={`text-sm font-semibold ${+(c.roas)>=2?'text-emerald-600':'text-amber-600'}`}>{(+(c.roas)||0).toFixed(1)}x</div></div>
                  <div><div className="text-[10px] text-surface-400 uppercase">CTR</div><div className="text-sm font-semibold">{(+(c.ctr)||0).toFixed(2)}%</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
