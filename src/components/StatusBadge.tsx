import { Badge } from './ui/Badge';
import { STATUS_CONFIG, PRIORITY_CONFIG, SEVERITY_CONFIG } from '../lib/constants';
import type { ComplaintStatus, Priority, Severity } from '../types';
import { cn } from '../lib/utils';

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={cn(config.bg, config.color, className)} dot dotColor={config.dot}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge className={cn(config.bg, config.color, 'border', config.border, className)}>
      {priority}
    </Badge>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <Badge className={cn(config.bg, config.color, className)}>
      {severity}
    </Badge>
  );
}
