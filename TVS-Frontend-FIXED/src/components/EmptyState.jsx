export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {Icon && <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4"><Icon size={28} className="text-surface-400" /></div>}
      <h3 className="font-display font-bold text-surface-700 text-lg">{title}</h3>
      {description && <p className="text-sm text-surface-400 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
