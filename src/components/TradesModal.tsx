import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { formatCurrency } from '../lib/utils/currency';

interface TradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthName: string;
  trades: any[];
}

export function TradesModal({ isOpen, onClose, monthName, trades }: TradesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-accent/40 max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Operações de {monthName}</DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-full">
            <thead className="border-b border-border sticky top-50 bg-background">
              <tr>
                <th className="text-center py-3 px-4">Data</th>
                <th className="text-center py-3 px-4">Ativo</th>
                <th className="text-center py-3 px-4">Resultado (USD)</th>
                <th className="text-center py-3 px-4">Resultado (BRL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trades.map((trade, index) => {
                const resultClass = trade.resultado_liquido_usd >= 0 ? 'text-positive' : 'text-negative';
                return (
                  <tr key={index}>
                    <td className="py-3 px-4 text-center text-sm text-muted">
                      {new Date(trade.data_iso + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-foreground">
                      {trade.ativo}
                    </td>
                    <td className={`py-3 px-4 text-center text-sm ${resultClass}`}>
                      {formatCurrency(trade.resultado_liquido_usd, 'USD')}
                    </td>
                    <td className={`py-3 px-4 text-center text-sm ${resultClass}`}>
                      {formatCurrency(trade.resultado_liquido_brl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
