import { Handle, Position } from '@xyflow/react';
import { cn } from '../../lib/utils';

type Props = {
  data: {
    id: string;
    title: string;
    description?: string;
    aiSummary?: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'reference' | 'print';
    status: 'in_review' | 'approved' | 'rejected';
  };
  selected?: boolean;
};

const statusStyles: Record<Props['data']['status'], string> = {
  in_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export function ProofNode({ data, selected }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card shadow-sm px-4 py-3 min-w-[260px] max-w-[360px] cursor-grab active:cursor-grabbing transition',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
      )}
    >
      {/* Header: Título + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground truncate">
            {data.title || 'Untitled Block'}
          </div>
          <div
            className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full capitalize ${statusStyles[data.status]}`}
            title={
              data.status === 'in_review'
                ? 'This block is pending AI audit.'
                : data.status === 'approved'
                ? 'Approved by AI audit.'
                : 'Rejected by AI audit.'
            }
          >
            {data.status === 'in_review' ? 'In review' : data.status}
          </div>
        </div>

        {/* Affordance para abrir */}
        <button
          data-open-drawer
          className="shrink-0 text-primary text-xs font-medium underline decoration-dotted hover:opacity-80"
        >
          Open
        </button>
      </div>

      {/* Descrição do autor (curta) */}
      <div className="mt-2">
        {data.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Click to add a description</p>
        )}
      </div>

      {/* Resumo da IA (somente leitura, preview no card) */}
      <div className="mt-2">
        <p className="text-[11px] font-medium text-foreground/80">AI summary</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {data.aiSummary ?? 'Awaiting AI audit…'}
        </p>
      </div>

      {/* Portas de conexão */}
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
    </div>
  );
}
