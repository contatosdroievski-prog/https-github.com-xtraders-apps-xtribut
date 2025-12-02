import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface TourStep {
  element: string;
  title: string;
  intro: string;
  tab?: 'cambial' | 'ir' | 'wrapped';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  { 
    element: '[data-tour="tabs"]', 
    title: 'Navegação Principal', 
    intro: 'Alterne entre os dashboards para suas análises. Comece sempre pela aba "Envios e Retiradas" para registrar suas movimentações de capital.',
    tab: 'cambial',
    position: 'bottom'
  },
  { 
    element: '[data-tour="add-transaction"]', 
    title: 'Adicionar Transações', 
    intro: 'Preencha os dados de suas movimentações de capital (envios e retiradas). A primeira transação deve ser obrigatoriamente um ENVIO.',
    tab: 'cambial',
    position: 'bottom'
  },
  { 
    element: '[data-tour="process-cambial"]', 
    title: 'Processar Análise', 
    intro: 'Clique aqui para executar os cálculos após preencher os dados acima. Você verá o resumo com lucro/prejuízo e impostos.',
    tab: 'cambial',
    position: 'top'
  },
  { 
    element: '[data-tour="tab-ir"]', 
    title: 'Análise de IR', 
    intro: 'Mude para este dashboard para analisar o imposto sobre suas operações de trade. Importe seu relatório da corretora para cálculos detalhados.',
    tab: 'cambial',
    position: 'bottom'
  },
  { 
    element: '#upload-csv-area', 
    title: 'Relatório de Operações', 
    intro: 'Importe seu relatório da corretora (.csv) para o cálculo do IR. Suportamos relatórios da Tradelocker, MetaTrader e outras plataformas.',
    tab: 'ir',
    position: 'bottom'
  }
];

interface TourProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeTab?: (tab: 'cambial' | 'ir' | 'wrapped') => void;
}

export function Tour({ isOpen, onClose, onChangeTab }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isVisible, setIsVisible] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const tabChangeTimeoutRef = useRef<NodeJS.Timeout>();

  const updatePositions = useCallback((shouldScroll: boolean = true) => {
    const step = tourSteps[currentStep];
    const targetElement = document.querySelector(step.element) as HTMLElement;

    if (!targetElement) {
      console.warn('Elemento do tour não encontrado:', step.element);
      updateTimeoutRef.current = setTimeout(() => {
        updatePositions(shouldScroll);
      }, 500);
      return;
    }

    // Verifica se o elemento está visível e renderizado
    const rect = targetElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('Elemento ainda não está visível, aguardando...', step.element);
      updateTimeoutRef.current = setTimeout(() => {
        updatePositions(shouldScroll);
      }, 300);
      return;
    }

    // Remove z-index elevado de elementos anteriores
    document.querySelectorAll('[data-tour-active]').forEach((el) => {
      (el as HTMLElement).style.removeProperty('z-index');
      (el as HTMLElement).style.removeProperty('position');
      el.removeAttribute('data-tour-active');
    });

    // Adiciona z-index elevado ao elemento atual
    const originalPosition = window.getComputedStyle(targetElement).position;
    if (originalPosition === 'static') {
      targetElement.style.position = 'relative';
    }
    targetElement.style.zIndex = '9996';
    targetElement.setAttribute('data-tour-active', 'true');

    // Função que atualiza as posições do destaque e tooltip
    const calculateAndSetPositions = () => {
      const finalRect = targetElement.getBoundingClientRect();
      const highlightPadding = 12;

      // Calcula o border radius do elemento
      const computedStyle = window.getComputedStyle(targetElement);
      const borderRadius = computedStyle.borderRadius || '8px';

      // Posiciona o destaque (position: fixed usa coordenadas do viewport, não precisa de scrollY)
      setHighlightStyle({
        width: `${finalRect.width + (highlightPadding * 2)}px`,
        height: `${finalRect.height + (highlightPadding * 2)}px`,
        top: `${finalRect.top - highlightPadding}px`,
        left: `${finalRect.left - highlightPadding}px`,
        borderRadius: borderRadius,
        opacity: 1,
      });

      // Calcula posição do tooltip
      setTimeout(() => {
        const tooltipElement = document.querySelector('.tour-tooltip') as HTMLElement;
        if (!tooltipElement) return;

        const tooltipHeight = tooltipElement.offsetHeight;
        const tooltipWidth = tooltipElement.offsetWidth;
        
        let tooltipTop: number;
        let tooltipLeft: number;

        const preferredPosition = step.position || 'bottom';
        const margin = 20;
        const minGap = 24; // Espaço mínimo entre o tooltip e o elemento destacado

        // Calcula centralização horizontal primeiro
        tooltipLeft = finalRect.left + (finalRect.width / 2) - (tooltipWidth / 2);
        
        // Ajusta para não sair da tela horizontalmente
        if (tooltipLeft < margin) {
          tooltipLeft = margin;
        }
        if (tooltipLeft + tooltipWidth > window.innerWidth - margin) {
          tooltipLeft = window.innerWidth - tooltipWidth - margin;
        }

        // Calcula posição vertical com lógica aprimorada
        const spaceAbove = finalRect.top;
        const spaceBelow = window.innerHeight - finalRect.bottom;
        const needsSpaceAbove = tooltipHeight + minGap;
        const needsSpaceBelow = tooltipHeight + minGap;

        if (preferredPosition === 'bottom' || preferredPosition === 'top') {
          // Tenta posicionar embaixo primeiro
          if (spaceBelow >= needsSpaceBelow) {
            tooltipTop = finalRect.bottom + minGap;
          } 
          // Se não couber embaixo, tenta em cima
          else if (spaceAbove >= needsSpaceAbove) {
            tooltipTop = finalRect.top - tooltipHeight - minGap;
          }
          // Se não couber em nenhum, posiciona no topo ou na base da viewport
          else {
            if (spaceBelow > spaceAbove) {
              tooltipTop = finalRect.bottom + minGap;
            } else {
              tooltipTop = margin;
            }
          }
        } else {
          // Para outras posições, usa a mesma lógica
          tooltipTop = finalRect.bottom + minGap;
          if (tooltipTop + tooltipHeight > window.innerHeight - margin) {
            tooltipTop = finalRect.top - tooltipHeight - minGap;
          }
        }

        // Garante que o tooltip esteja sempre dentro da viewport
        tooltipTop = Math.max(margin, Math.min(tooltipTop, window.innerHeight - tooltipHeight - margin));

        // Verifica se há sobreposição com o elemento destacado
        const tooltipRight = tooltipLeft + tooltipWidth;
        const tooltipBottom = tooltipTop + tooltipHeight;
        const elementRight = finalRect.left + finalRect.width;
        const elementBottom = finalRect.top + finalRect.height;

        // Se houver sobreposição horizontal e vertical, ajusta
        const hasHorizontalOverlap = !(tooltipRight < finalRect.left || tooltipLeft > elementRight);
        const hasVerticalOverlap = !(tooltipBottom < finalRect.top || tooltipTop > elementBottom);

        if (hasHorizontalOverlap && hasVerticalOverlap) {
          // Move para o lado se possível
          const spaceLeft = finalRect.left;
          const spaceRight = window.innerWidth - elementRight;
          
          if (spaceRight >= tooltipWidth + minGap) {
            tooltipLeft = elementRight + minGap;
          } else if (spaceLeft >= tooltipWidth + minGap) {
            tooltipLeft = finalRect.left - tooltipWidth - minGap;
          }
        }

        setTooltipStyle({
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          opacity: 1,
        });

        setIsVisible(true);
      }, 50);
    };

    // Se deve fazer scroll, aguarda elemento renderizar, faz scroll e depois atualiza posições
    if (shouldScroll) {
      setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;
        const desiredTopMargin = 100;
        
        let scrollTarget = elementTop - desiredTopMargin;
        
        // Para o último step (upload CSV), fixa no topo para dar espaço ao card
        if (currentStep === tourSteps.length - 1) {
          scrollTarget = 0;
        } 
        // Para outros steps, centraliza se o elemento couber na tela
        else if (elementHeight + desiredTopMargin + 100 < viewportHeight) {
          scrollTarget = elementTop - (viewportHeight / 2) + (elementHeight / 2);
        }
        
        // Temporariamente permite scroll para posicionar
        document.body.style.overflow = 'auto';
        
        window.scrollTo({ 
          top: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });

        // Aguarda o scroll terminar, calcula posições e bloqueia o scroll novamente
        setTimeout(() => {
          calculateAndSetPositions();
          document.body.style.overflow = 'hidden';
        }, 600);
      }, 100);
    } else {
      // Se não deve fazer scroll, atualiza posições imediatamente
      calculateAndSetPositions();
    }
  }, [currentStep]);

  // Efeito principal: gerencia mudanças de step e tab
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    const step = tourSteps[currentStep];
    
    // Limpa timeouts anteriores
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current);
    }

    // Esconde elementos temporariamente durante transição
    setIsVisible(false);
    setHighlightStyle(prev => ({ ...prev, opacity: 0 }));
    setTooltipStyle(prev => ({ ...prev, opacity: 0 }));

    // Muda para a aba correta se necessário
    if (step.tab && onChangeTab) {
      onChangeTab(step.tab);
      
      // Aguarda a mudança de aba e renderização
      tabChangeTimeoutRef.current = setTimeout(() => {
        updatePositions(true);
      }, 800);
    } else {
      // Se não precisa mudar de aba, atualiza posições
      updateTimeoutRef.current = setTimeout(() => {
        updatePositions(true);
      }, 100);
    }

    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (tabChangeTimeoutRef.current) clearTimeout(tabChangeTimeoutRef.current);
    };
  }, [isOpen, currentStep, onChangeTab, updatePositions]);

  // Efeito para bloquear scroll e gerenciar resize
  useEffect(() => {
    if (!isOpen) return;

    // Bloqueia o scroll do body quando o tour está aberto
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleResize = () => {
      if (isVisible) {
        updatePositions(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      // Restaura o scroll quando o tour fecha
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, isVisible, updatePositions]);

  // Efeito para keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Remove z-index elevado de elementos
    document.querySelectorAll('[data-tour-active]').forEach((el) => {
      (el as HTMLElement).style.removeProperty('z-index');
      (el as HTMLElement).style.removeProperty('position');
      el.removeAttribute('data-tour-active');
    });

    localStorage.setItem('xtributationTutorialSeen', 'true');
    setIsVisible(false);
    setCurrentStep(0);
    
    // Delay para permitir animação de saída
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay escuro com recorte para spotlight - Layer 1 */}
      <div 
        className="fixed inset-0 transition-opacity duration-500"
        style={{ 
          opacity: isVisible ? 1 : 0,
          zIndex: 9996,
          pointerEvents: 'none',
        }}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0,
          }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white"/>
              {isVisible && highlightStyle.width && (
                <rect
                  x={parseFloat(String(highlightStyle.left)) || 0}
                  y={parseFloat(String(highlightStyle.top)) || 0}
                  width={parseFloat(String(highlightStyle.width)) || 0}
                  height={parseFloat(String(highlightStyle.height)) || 0}
                  rx={parseFloat(String(highlightStyle.borderRadius)) || 8}
                  fill="black"
                  style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              )}
            </mask>
          </defs>
          <rect 
            x="0" 
            y="0" 
            width="100%" 
            height="100%" 
            fill="rgba(0, 0, 0, 0.92)" 
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Borda dourada e glow do elemento destacado - Layer 2 */}
      <div
        className="tour-highlight fixed pointer-events-none transition-all duration-500 ease-out"
        style={{
          ...highlightStyle,
          border: '3px solid rgba(212, 175, 55, 0.9)',
          boxShadow: '0 0 30px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.2)',
          zIndex: 9997,
        }}
      />

      {/* Overlay iluminado sobre o elemento destacado - Layer 3 */}
      {isVisible && highlightStyle.width && (
        <div
          className="fixed pointer-events-none transition-all duration-500 ease-out"
          style={{
            ...highlightStyle,
            background: 'rgba(255, 255, 255, 0.03)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Tooltip Card - Layer 4 (Top) */}
      <div
        className="tour-tooltip fixed glass-card transition-all duration-500 ease-out"
        style={{
          ...tooltipStyle,
          padding: '24px',
          maxWidth: '420px',
          minWidth: '320px',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
          zIndex: 9999,
        }}
      >
        <div className="mb-5">
          {/* Progress indicators */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5 flex-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: index === currentStep ? '32px' : '8px',
                    backgroundColor: index === currentStep 
                      ? '#D4AF37'
                      : index < currentStep 
                      ? 'rgba(212, 175, 55, 0.5)'
                      : 'rgba(255, 255, 255, 0.2)',
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted font-medium tabular-nums">
              {currentStep + 1} / {tourSteps.length}
            </span>
          </div>

          {/* Title and description */}
          <h3 className="text-accent mb-3" style={{ fontSize: '18px' }}>
            {step.title}
          </h3>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {step.intro}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-xs text-muted hover:text-foreground transition-colors duration-200"
            style={{ fontSize: '13px' }}
          >
            Pular tutorial
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="border-accent/40 text-accent hover:bg-accent/10 hover:border-accent transition-all"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              size="sm"
              className="bg-gradient-to-r from-[#D4AF37] via-[#FFEE99] to-[#D4AF37] bg-[length:200%_auto] text-[#0D0D0D] hover:bg-[length:300%_auto] transition-all duration-500 shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  Finalizar
                  <X className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useTour() {
  const [isOpen, setIsOpen] = useState(false);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem('xtributationTutorialSeen');
    console.log('✅ Tutorial resetado. Recarregue a página para ver o tour novamente.');
  }, []);

  useEffect(() => {
    // Verifica se o tutorial já foi visto
    const tutorialSeen = localStorage.getItem('xtributationTutorialSeen');
    
    if (!tutorialSeen) {
      // Aguarda o DOM estar completamente carregado e as tabs renderizadas
      const timer = setTimeout(() => {
        // Verifica múltiplos elementos para garantir que tudo está pronto
        const tabsElement = document.querySelector('[data-tour="tabs"]');
        const addTransactionElement = document.querySelector('[data-tour="add-transaction"]');
        
        if (tabsElement && addTransactionElement) {
          // Tudo pronto, inicia o tour
          setTimeout(() => {
            startTour();
          }, 500);
        } else {
          console.warn('⚠️ Elementos do tour não encontrados, aguardando mais tempo...');
          // Tenta novamente após mais tempo
          setTimeout(() => {
            const retry = document.querySelector('[data-tour="tabs"]');
            if (retry) {
              startTour();
            } else {
              console.error('❌ Elementos do tour não encontrados após retry');
            }
          }, 1500);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return { isOpen, startTour, closeTour, resetTutorial };
}
