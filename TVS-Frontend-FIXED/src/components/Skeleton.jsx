export function SkeletonCards({ count = 4 }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>;
}
export function SkeletonChart() { return <div className="skeleton h-80 rounded-2xl mt-6" />; }
export function SkeletonTable() { return <div className="space-y-2 mt-6"><div className="skeleton h-12 rounded-xl" />{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>; }
