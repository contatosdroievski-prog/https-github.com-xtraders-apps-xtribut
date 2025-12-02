import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ir' | 'cambial';
  onExport: (options: any) => Promise<void>;
}

export function ExportModal({ isOpen, onClose, type, onExport }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState({
    summary: true,
    monthly: true,
    details: false
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-accent/40">
        <DialogHeader>
          <DialogTitle>
            {type === 'ir' ? 'Exportar Relatório de IR' : 'Exportar Relatório Cambial'}
          </DialogTitle>
          <DialogDescription className="text-muted">
            Selecione o que deseja incluir no PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {type === 'ir' ? (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={options.summary}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, summary: checked as boolean })
                  }
                />
                <Label htmlFor="summary" className="cursor-pointer">
                  Incluir Resumo Anual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="monthly"
                  checked={options.monthly}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, monthly: checked as boolean })
                  }
                />
                <Label htmlFor="monthly" className="cursor-pointer">
                  Incluir Resumo Mensal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="details"
                  checked={options.details}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, details: checked as boolean })
                  }
                />
                <Label htmlFor="details" className="cursor-pointer">
                  Incluir Todas as Operações
                </Label>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="summary"
                checked={options.summary}
                onCheckedChange={(checked) => 
                  setOptions({ ...options, summary: checked as boolean })
                }
              />
              <Label htmlFor="summary" className="cursor-pointer">
                Incluir Resumo Geral
              </Label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="secondary"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar e Baixar PDF'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
