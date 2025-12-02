import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';

interface CompactCalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

export function CompactCalendar({ selected, onSelect, disabled }: CompactCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selected) return new Date(selected.getFullYear(), selected.getMonth(), 1);
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
  const currentYearRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const monthAbbr = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Dias do mês anterior
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Dias do próximo mês para completar as linhas
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIndex - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIndex + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    return date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonthIndex;
  };

  const isDisabled = (date: Date) => {
    if (disabled) return disabled(date);
    return false;
  };

  // Funções para o seletor de mês/ano
  const currentDate = new Date();
  const todayYear = currentDate.getFullYear();
  const todayMonth = currentDate.getMonth();

  const years = Array.from({ length: 11 }, (_, i) => todayYear - 5 + i);

  const handleMonthYearSelect = (year: number, month: number) => {
    setCurrentMonth(new Date(year, month, 1));
    setIsMonthYearPickerOpen(false);
  };

  const isMonthDisabled = (year: number, month: number) => {
    if (year > todayYear) return true;
    if (year === todayYear && month > todayMonth) return true;
    return false;
  };

  const isMonthSelected = (year: number, month: number) => {
    return currentYear === year && currentMonthIndex === month;
  };

  // Centraliza o ano atual quando o seletor abre
  useEffect(() => {
    if (isMonthYearPickerOpen) {
      // Aguarda o popover renderizar completamente
      const timer = setTimeout(() => {
        const scrollContainer = document.querySelector('#month-year-scroll [data-radix-scroll-area-viewport]');
        const yearElement = currentYearRef.current;
        
        if (scrollContainer && yearElement) {
          const containerHeight = scrollContainer.clientHeight;
          const yearTop = yearElement.offsetTop;
          const yearHeight = yearElement.clientHeight;
          
          // Calcula a posição para centralizar (ano no meio da viewport)
          const scrollTo = yearTop - (containerHeight / 2) + (yearHeight / 2);
          
          scrollContainer.scrollTop = Math.max(0, scrollTo);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMonthYearPickerOpen]);

  return (
    <div className="w-[220px] bg-card/95 backdrop-blur-xl rounded-lg shadow-2xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/50">
        <button
          onClick={goToPreviousMonth}
          className="p-0.5 hover:bg-accent/20 rounded transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <Popover open={isMonthYearPickerOpen} onOpenChange={setIsMonthYearPickerOpen}>
          <PopoverTrigger asChild>
            <button className="text-xs font-medium text-foreground hover:text-accent transition-colors px-2 py-1 rounded hover:bg-accent/10">
              {monthNames[currentMonthIndex]} {currentYear}
            </button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-[340px] p-0 bg-card/98 backdrop-blur-xl border-border shadow-2xl" 
            align="center"
            side="bottom"
            sideOffset={4}
          >
            {/* Header do seletor */}
            <div className="px-3 py-2.5 border-b border-border/50">
              <span className="text-xs text-muted-foreground">Selecione mês e ano</span>
            </div>

            {/* Lista de anos e meses */}
            <ScrollArea className="h-[280px]" id="month-year-scroll">
              <div className="p-2.5 space-y-2.5">
                {years.map(year => {
                  const hasAnyEnabledMonth = Array.from({ length: 12 }).some((_, month) => 
                    !isMonthDisabled(year, month)
                  );
                  
                  if (!hasAnyEnabledMonth) return null;

                  const isCurrentYear = year === currentYear;

                  return (
                    <div 
                      key={year} 
                      className="space-y-1.5"
                      ref={isCurrentYear ? currentYearRef : undefined}
                    >
                      {/* Ano */}
                      <div className="px-2 py-1 bg-muted/20 rounded text-xs font-medium text-foreground">
                        {year}
                      </div>
                      
                      {/* Grid de meses */}
                      <div className="grid grid-cols-4 gap-1">
                        {monthAbbr.map((abbr, monthIndex) => {
                          const isDisabledMonth = isMonthDisabled(year, monthIndex);
                          const isSelectedMonth = isMonthSelected(year, monthIndex);

                          return (
                            <button
                              key={monthIndex}
                              onClick={() => handleMonthYearSelect(year, monthIndex)}
                              disabled={isDisabledMonth}
                              className={`
                                px-2.5 py-1.5 rounded text-[0.65rem] font-medium transition-all
                                ${isSelectedMonth 
                                  ? 'bg-gradient-to-br from-accent to-accent/80 text-primary-foreground shadow-md shadow-accent/20' 
                                  : isDisabledMonth
                                    ? 'bg-muted/10 text-muted-foreground/30 cursor-not-allowed'
                                    : 'bg-muted/20 text-foreground hover:bg-accent/20 hover:text-accent cursor-pointer'
                                }
                              `}
                            >
                              {abbr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <button
          onClick={goToNextMonth}
          className="p-0.5 hover:bg-accent/20 rounded transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-2">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-[0.6rem] text-muted-foreground font-medium h-4 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, index) => {
            if (!day) return <div key={index} />;
            
            const isCurrent = isCurrentMonth(day);
            const isSelectedDay = isSelected(day);
            const isTodayDay = isToday(day);
            const isDisabledDay = isDisabled(day);

            return (
              <button
                key={index}
                onClick={() => !isDisabledDay && onSelect(day)}
                disabled={isDisabledDay}
                className={`
                  h-5 flex items-center justify-center text-[0.65rem] rounded transition-all
                  ${!isCurrent ? 'text-muted-foreground/40' : 'text-foreground'}
                  ${isSelectedDay 
                    ? 'bg-gradient-to-br from-accent to-accent/80 text-primary-foreground shadow-md shadow-accent/30' 
                    : 'hover:bg-accent/10'
                  }
                  ${isTodayDay && !isSelectedDay ? 'ring-1 ring-accent/50' : ''}
                  ${isDisabledDay ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
