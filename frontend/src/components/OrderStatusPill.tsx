import { STATUS_LABEL, type OrderStatus } from '../utils/orders';

const STYLE: Record<OrderStatus, { text: string; dot: string }> = {
  pending: { text: 'text-amber-700', dot: 'bg-amber-500' },
  paid: { text: 'text-sky-700', dot: 'bg-sky-500' },
  shipped: { text: 'text-violet-700', dot: 'bg-violet-500' },
  completed: { text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { text: 'text-rose-700', dot: 'bg-rose-500' },
};

export default function OrderStatusPill({ status }: { status: OrderStatus }) {
  const s = STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.text}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}