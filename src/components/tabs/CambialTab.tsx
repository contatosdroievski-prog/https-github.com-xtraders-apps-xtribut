import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CompactCalendar } from '../CompactCalendar';
import { Edit2, Trash2, AlertCircle, Download, CalendarIcon } from 'lucide-react';
import { Transaction } from '../../lib/types';
import { fetchBcbRateForDate, getRateForDate } from '../../lib/api/bcb';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../../lib/utils/currency';
import { generateCambialPdf } from '../../lib/utils/pdf-export';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns@4.1.0';
import { ptBR } from 'date-fns@4.1.0/locale';
import { ExportModal } from '../ExportModal';
import { auth } from '../../lib/firebase';

interface ProcessedRow {
  date: Date;
  type: string;
  valueUSD: number;
  cotacao: number;
  valueBRL: number;
  lucroPrejuizo: number;
  saldoFinal: number;
}

interface CambialKpi {
  saldoUSD: number;
  custoSaldoBRL: number;
  totalEnviosUSD: number;
  totalRetiradoUSD: number;
  totalEnviosBRL: number;
  totalRetiradoBRL: number;
  lucroPrejuizoTotal: number;
  lucroTributavel: number;
  impostoDevido: number;
  valorNaoRetiradaBRL: number | null;
  mostrarAlocarCard: boolean;
  saldoFinalParaExibir: number;
}

export function CambialTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState({
    date: '',
    type: 'Envio' as 'Envio' | 'Retirada' | 'Não Retirada',
    value: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [results, setResults] = useState<{
    processed: ProcessedRow[];
    kpi: CambialKpi;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sincronizar selectedDate com currentTransaction.date
  useEffect(() => {
    if (currentTransaction.date) {
      setSelectedDate(new Date(currentTransaction.date + 'T00:00:00'));
    } else {
      setSelectedDate(undefined);
    }
  }, [currentTransaction.date]);

  // Determina se "Não Retirada" deve estar habilitado (apenas em 31/12)
  const isNaoRetiradaEnabled = currentTransaction.date && 
    currentTransaction.date.substring(5) === '12-31';

  // Efeito para resetar o tipo se "Não Retirada" foi desabilitado
  useEffect(() => {
    if (!isNaoRetiradaEnabled && currentTransaction.type === 'Não Retirada') {
      setCurrentTransaction(prev => ({ ...prev, type: 'Envio' }));
    }
  }, [isNaoRetiradaEnabled, currentTransaction.type]);

  const handleAddTransaction = async () => {
    const dateValue = currentTransaction.date;

    if (!dateValue) {
      toast.error('Por favor, preencha a data.');
      return;
    }

    const validationDate = new Date(`${dateValue}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (validationDate > today) {
      toast.error('A data não pode ser futura.');
      return;
    }

    const numericValue = parseCurrencyInput(currentTransaction.value);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error('Por favor, preencha um valor positivo válido no formato 1.000,00.');
      return;
    }

    // Validação: primeira transação deve ser ENVIO
    if (transactions.length === 0 && (currentTransaction.type === 'Retirada' || currentTransaction.type === 'Não Retirada')) {
      toast.error('O primeiro lançamento deve ser obrigatoriamente um ENVIO.');
      return;
    }

    const transactionData: Transaction = {
      date: validationDate,
      type: currentTransaction.type,
      value: numericValue
    };

    try {
      // Buscar cotação do BCB
      await fetchBcbRateForDate(validationDate.toISOString().split('T')[0]);

      let updatedTransactions: Transaction[];
      if (editingIndex !== null) {
        updatedTransactions = [...transactions];
        updatedTransactions[editingIndex] = transactionData;
        toast.success('Transação atualizada com sucesso!');
      } else {
        updatedTransactions = [...transactions, transactionData];
        toast.success('Transação adicionada com sucesso!');
      }

      // Ordenar por data
      updatedTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      setTransactions(updatedTransactions);
      cancelEdit();
    } catch (error: any) {
      toast.error(`Não foi possível buscar a cotação do dólar. Verifique sua conexão. Erro: ${error.message}`);
    }
  };

  const editTransaction = (index: number) => {
    setEditingIndex(index);
    const trans = transactions[index];
    setCurrentTransaction({
      date: trans.date.toISOString().split('T')[0],
      type: trans.type,
      value: formatCurrencyInput(trans.value)
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setCurrentTransaction({ date: '', type: 'Envio', value: '' });
    setSelectedDate(undefined);
  };

  const removeTransaction = (index: number) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      setTransactions(transactions.filter((_, i) => i !== index));
      toast.success('Transação removida com sucesso!');
    }
  };

  const handleProcess = async () => {
    if (transactions.length === 0) {
      toast.error('Nenhum registro foi adicionado.');
      return;
    }

    setIsProcessing(true);
    try {
      // Garantir que todas as cotações foram buscadas
      const allDates = [...new Set(transactions.map(t => t.date.toISOString().split('T')[0]))];
      await Promise.all(allDates.map(date => fetchBcbRateForDate(date)));

      const result = processAndRenderCambial(transactions);
      setResults(result);
      toast.success('Dados processados com sucesso!');
    } catch (error: any) {
      toast.error(`Ocorreu um erro: ${error.message}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card className="glass-card p-6" data-tour="add-transaction">
        <h3 className="mb-4">Adicionar Transação de Capital</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Data</Label>
            <div className="relative">
              <Input
                placeholder="DD/MM/AAAA"
                value={selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleaned = value.replace(/[^\d/]/g, '');
                  
                  let formatted = cleaned;
                  if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
                    formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                  }
                  if (formatted.length >= 5 && formatted.charAt(5) !== '/') {
                    formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
                  }
                  formatted = formatted.slice(0, 10);
                  
                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split('/').map(Number);
                    if (day && month && year && month <= 12 && day <= 31) {
                      const parsedDate = new Date(year, month - 1, day);
                      if (!isNaN(parsedDate.getTime()) && parsedDate <= new Date()) {
                        setSelectedDate(parsedDate);
                        setCurrentTransaction({ 
                          ...currentTransaction, 
                          date: format(parsedDate, 'yyyy-MM-dd')
                        });
                      }
                    }
                  }
                }}
                className="bg-input-background border-border text-foreground pr-10"
              />
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-accent/10 transition-colors rounded-r-lg"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 border-0 shadow-none bg-transparent" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  avoidCollisions={true}
                  collisionPadding={10}
                >
                  <CompactCalendar
                    selected={selectedDate}
                    onSelect={(date) => {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      setCurrentTransaction({ ...currentTransaction, date: formattedDate });
                      setSelectedDate(date);
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="trans-type">Tipo</Label>
            <Select
              value={currentTransaction.type}
              onValueChange={(value: any) => setCurrentTransaction({ ...currentTransaction, type: value })}
            >
              <SelectTrigger className="bg-input-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Envio">Envio</SelectItem>
                <SelectItem value="Retirada">Retirada</SelectItem>
                <SelectItem value="Não Retirada" disabled={!isNaoRetiradaEnabled}>
                  Não Retirada
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="trans-value">Valor Líquido (USD)</Label>
            <Input
              id="trans-value"
              placeholder="1.000,00"
              value={currentTransaction.value}
              onChange={(e) => setCurrentTransaction({ ...currentTransaction, value: e.target.value })}
              className="bg-input-background border-border text-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddTransaction}
              variant="secondary"
              className="flex-1"
            >
              {editingIndex !== null ? 'Salvar Alterações' : 'Adicionar +'}
            </Button>
            {editingIndex !== null && (
              <Button
                onClick={cancelEdit}
                variant="outline"
                className="flex-1 border-[#D4AF37] text-[#D4AF37]"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-black/20 border-l-4 border-[#D4AF37]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#D4AF37]">MUITO IMPORTANTE:</p>
              <p className="mt-1 text-sm text-muted">
                NÃO CONSIDERAR OU INFORMAR RETIRADAS DE LUCRO COM OS SEUS TRADES NESTE CAMPO. 
                AQUI DEVE-SE INFORMAR SOMENTE O CAPITAL ORIGINALMENTE ENVIADO OU RETIRADO DO 
                EXTERIOR (MARGEM PARA OPERAR).
              </p>
            </div>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 border-t border-border pt-4">Registros a Processar:</h4>
            <div className="overflow-x-auto bg-background rounded-md border border-border">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-center py-3 px-4">Data</th>
                    <th className="text-center py-3 px-4">Tipo</th>
                    <th className="text-center py-3 px-4">Valor (USD)</th>
                    <th className="text-center py-3 px-4">Cotação (BRL)</th>
                    <th className="text-center py-3 px-4">Total (R$)</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((trans, index) => {
                    const cotacao = getRateForDate(trans.date, trans.type);
                    const totalBRL = cotacao ? trans.value * cotacao : null;
                    
                    return (
                      <tr key={index}>
                        <td className="py-3 px-4 text-center">
                          {trans.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="py-3 px-4 text-center">{trans.type}</td>
                        <td className="py-3 px-4 text-center">{formatCurrency(trans.value, 'USD')}</td>
                        <td className="py-3 px-4 text-center">
                          {cotacao ? formatCurrency(cotacao) : <span className="text-xs text-muted">Automático</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {totalBRL !== null ? formatCurrency(totalBRL) : <span className="text-xs text-muted">---</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => editTransaction(index)}
                              className="text-muted hover:text-accent transition-colors p-1"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeTransaction(index)}
                              className="text-muted hover:text-accent transition-colors p-1"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center" data-tour="process-cambial">
        <Button
          onClick={handleProcess}
          disabled={isProcessing || transactions.length === 0}
          className="bg-gradient-to-r from-[#D4AF37] via-[#FFEE99] to-[#D4AF37] bg-[length:150%_auto] text-[#0D0D0D] hover:bg-[length:250%_auto] transition-all duration-500"
        >
          {isProcessing ? 'Processando...' : 'Processar Dados'}
        </Button>
      </div>

      {results && (
        <CambialResultsWrapper 
          kpi={results.kpi} 
          processed={results.processed}
          isExportModalOpen={isExportModalOpen}
          setIsExportModalOpen={setIsExportModalOpen}
        />
      )}
    </div>
  );
}

function processAndRenderCambial(transactions: Transaction[]): { processed: ProcessedRow[], kpi: CambialKpi } {
  let saldoUSD = 0;
  let custoSaldoBRL = 0;
  let totalEnviosUSD = 0;
  let totalRetiradoUSD = 0;
  let lucroPrejuizoTotal = 0;
  let totalEnviosBRL = 0;
  let totalRetiradoBRL = 0;
  let lucroTributavel = 0;
  let valorNaoRetiradaBRL: number | null = null;
  let mostrarAlocarCard = false;

  const processed: ProcessedRow[] = [];

  for (const trans of transactions) {
    const cotacaoDia = getRateForDate(trans.date, trans.type);
    if (cotacaoDia === null) {
      throw new Error(`Cotação não encontrada para a data ${trans.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}. Verifique sua conexão e tente novamente.`);
    }

    const valorDeMercadoBRL = trans.value * cotacaoDia;
    const precoMedioAnterior = saldoUSD > 1e-6 ? custoSaldoBRL / saldoUSD : 0;
    let custoOperacaoBRL = 0;
    let lucroPrejuizoRow = 0;

    if (trans.type === 'Envio') {
      saldoUSD += trans.value;
      custoSaldoBRL += valorDeMercadoBRL;
      totalEnviosUSD += trans.value;
      totalEnviosBRL += valorDeMercadoBRL;
    } else {
      // Retirada ou Não Retirada
      if (trans.value > saldoUSD) {
        throw new Error(`Saque (${formatCurrency(trans.value, 'USD')}) maior que o saldo na data.`);
      }

      custoOperacaoBRL = trans.value * precoMedioAnterior;
      lucroPrejuizoRow = valorDeMercadoBRL - custoOperacaoBRL;
      lucroPrejuizoTotal += lucroPrejuizoRow;

      if (trans.type === 'Retirada' && lucroPrejuizoRow > 0) {
        lucroTributavel += lucroPrejuizoRow;
      }

      if (trans.type === 'Não Retirada') {
        custoSaldoBRL += (2 * lucroPrejuizoRow);
        valorNaoRetiradaBRL = valorDeMercadoBRL;
        if (trans.date.getUTCMonth() === 11 && trans.date.getUTCDate() === 31) {
          mostrarAlocarCard = true;
        }
      } else {
        // Retirada normal
        totalRetiradoUSD += trans.value;
        totalRetiradoBRL += valorDeMercadoBRL;
        saldoUSD -= trans.value;
        custoSaldoBRL -= custoOperacaoBRL;
      }
    }

    processed.push({
      date: trans.date,
      type: trans.type,
      valueUSD: trans.value,
      cotacao: cotacaoDia,
      valueBRL: valorDeMercadoBRL,
      lucroPrejuizo: lucroPrejuizoRow,
      saldoFinal: saldoUSD
    });
  }

  const impostoDevido = lucroTributavel * 0.15;
  const saldoBRLCalculado = custoSaldoBRL + lucroPrejuizoTotal;
  const saldoFinalParaExibir = valorNaoRetiradaBRL !== null ? valorNaoRetiradaBRL : (saldoUSD < 1e-6 ? 0 : saldoBRLCalculado);

  return {
    processed,
    kpi: {
      saldoUSD,
      custoSaldoBRL,
      totalEnviosUSD,
      totalRetiradoUSD,
      totalEnviosBRL,
      totalRetiradoBRL,
      lucroPrejuizoTotal,
      lucroTributavel,
      impostoDevido,
      valorNaoRetiradaBRL,
      mostrarAlocarCard,
      saldoFinalParaExibir
    }
  };
}

function CambialResults({ kpi, processed, onExportClick }: { kpi: CambialKpi, processed: ProcessedRow[], onExportClick: () => void }) {
  const kpiCards: { title: string; value: string; color: string; span?: 'full' }[] = [];

  // Se houver "Não Retirada" em 31/12, mostrar card de "Alocar para Próximo Ano"
  if (kpi.mostrarAlocarCard) {
    kpiCards.push({
      title: 'Alocar para Próximo Ano',
      value: formatCurrency(kpi.saldoFinalParaExibir),
      color: 'text-accent',
      span: 'full'
    });
  }

  const corNaoIsenta = kpi.lucroTributavel >= 0 ? 'text-positive' : 'text-negative';

  kpiCards.push(
    { title: 'Variação Cambial Total', value: formatCurrency(kpi.lucroPrejuizoTotal), color: kpi.lucroPrejuizoTotal >= 0 ? 'text-positive' : 'text-negative' },
    { title: 'Variação Cambial Não Isenta', value: formatCurrency(kpi.lucroTributavel), color: corNaoIsenta },
    { title: 'Imposto a Pagar (15%)', value: formatCurrency(kpi.impostoDevido), color: 'text-negative' },
    { title: 'Total Enviado (USD)', value: formatCurrency(kpi.totalEnviosUSD, 'USD'), color: 'text-foreground' },
    { title: 'Total Retirado (USD)', value: formatCurrency(kpi.totalRetiradoUSD, 'USD'), color: 'text-foreground' },
    { title: 'Saldo Atual (USD)', value: formatCurrency(kpi.saldoUSD, 'USD'), color: 'text-foreground' },
    { title: 'Total Enviado (BRL)', value: formatCurrency(kpi.totalEnviosBRL), color: 'text-foreground' },
    { title: 'Total Retirado (BRL)', value: formatCurrency(kpi.totalRetiradoBRL), color: 'text-foreground' },
    { title: 'Saldo Atual (BRL)', value: formatCurrency(kpi.saldoFinalParaExibir), color: 'text-accent' }
  );

  return (
    <div id="pdf-export-cambial" className="space-y-6 animate-fade-in-up">
      <h3 className="text-xl text-left">Resumo da Movimentação Cambial</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <div 
            key={index} 
            className={`glass-card p-6 text-center hover:shadow-lg transition-shadow ${kpi.span === 'full' ? 'md:col-span-3' : ''}`}
          >
            <p className="text-xs uppercase tracking-wider text-muted mb-2">{kpi.title}</p>
            <p className={`text-2xl ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <Card className="glass-card p-6">
        <h3 className="mb-4 text-left">Extrato Detalhado</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-center py-3 px-4">Data</th>
                <th className="text-center py-3 px-4">Tipo</th>
                <th className="text-center py-3 px-4">Valor (USD)</th>
                <th className="text-center py-3 px-4">Cotação (BRL)</th>
                <th className="text-center py-3 px-4">Valor (BRL)</th>
                <th className="text-center py-3 px-4">Lucro/Prejuízo Cambial (BRL)</th>
                <th className="text-center py-3 px-4">Saldo Final (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processed.map((row, index) => (
                <tr key={index}>
                  <td className="text-center py-4 px-4 whitespace-nowrap">
                    {row.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{row.type}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.valueUSD, 'USD')}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.cotacao)}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.valueBRL)}</td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">
                    <span className={row.lucroPrejuizo >= 0 ? 'text-positive font-semibold' : 'text-negative font-semibold'}>
                      {formatCurrency(row.lucroPrejuizo)}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4 whitespace-nowrap">{formatCurrency(row.saldoFinal, 'USD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-center mt-8">
        <Button
          variant="secondary"
          className="gap-2"
          onClick={onExportClick}
        >
          <Download className="w-5 h-5" />
          <span>Exportar Relatório</span>
        </Button>
      </div>
    </div>
  );
}

function CambialResultsWrapper({ 
  processed, 
  kpi,
  isExportModalOpen,
  setIsExportModalOpen
}: { 
  processed: ProcessedRow[];
  kpi: CambialKpi;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
}) {
  const handleExport = async (options: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast('Usuário não autenticado', { 
          description: 'Faça login para exportar relatórios',
          duration: 3000
        });
        return;
      }

      // Prepara os dados para exportação
      const exportData = {
        headers: ['Data', 'Tipo', 'Valor (USD)', 'Cotação (BRL)', 'Valor (BRL)', 'Lucro/Prejuízo Cambial (BRL)', 'Saldo Final (USD)'],
        data: processed.map(row => ({
          date: row.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          type: row.type,
          valueUSD: row.valueUSD,
          cotacao: row.cotacao,
          valueBRL: row.valueBRL,
          lucroPrejuizo: row.lucroPrejuizo,
          saldoFinal: row.saldoFinal
        }))
      };

      await generateCambialPdf(
        user.email || 'usuario',
        kpi,
        exportData,
        options
      );
      
      toast('PDF gerado com sucesso!', {
        description: 'O arquivo foi baixado',
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast('Erro ao gerar PDF', {
        description: 'Tente novamente',
        duration: 3000
      });
      throw error;
    }
  };

  return (
    <>
      <CambialResults 
        processed={processed} 
        kpi={kpi}
        onExportClick={() => setIsExportModalOpen(true)}
      />
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="cambial"
        onExport={handleExport}
      />
    </>
  );
}
