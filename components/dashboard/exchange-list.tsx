import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Exchange, Partner } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

interface ExchangeWithRelations extends Exchange {
  partner: Partner;
}

interface ExchangeListProps {
  exchanges: ExchangeWithRelations[];
}

export default function ExchangeList({ exchanges }: ExchangeListProps) {
  if (!exchanges.length) {
    return <p className="text-muted-foreground">No exchanges yet. Start a new one from the API.</p>;
  }

  return (
    <ul className="space-y-4">
      {exchanges.map((exchange) => (
        <li key={exchange.id} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{exchange.title}</h3>
              <p className="text-sm text-muted-foreground">with {exchange.partner.name}</p>
            </div>
            <Badge variant={exchange.status === 'COMPLETED' ? 'success' : 'secondary'}>{exchange.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{exchange.summary}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated {formatDistanceToNow(exchange.updatedAt, { addSuffix: true })}</span>
            <Link className="font-medium text-brand" href={`/api/exchange/${exchange.id}`}>
              API details
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
