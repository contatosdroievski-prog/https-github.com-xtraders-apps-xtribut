import html2canvas from 'html2canvas';

/**
 * Função auxiliar para atualizar o estado de um botão
 */
function updateButtonState(button: HTMLElement, text: string, disabled: boolean) {
  button.setAttribute('disabled', disabled ? 'true' : 'false');
  const textElement = button.querySelector('span') || button;
  textElement.textContent = text;
}

/**
 * Função para gerar imagem do elemento com máxima fidelidade
 * Usa a técnica do "clone invisível no viewport"
 */
async function generateImageBlobFromElement(
  elementId: string,
  renderChartFn?: (canvas: HTMLCanvasElement) => void
): Promise<Blob> {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    throw new Error(`Elemento com ID "${elementId}" não encontrado.`);
  }

  const clone = originalElement.cloneNode(true) as HTMLElement;
  
  // Define dimensões explícitas
  clone.style.width = originalElement.offsetWidth + 'px';
  clone.style.height = originalElement.offsetHeight + 'px';

  // Copia estilos computados
  const computedStyle = window.getComputedStyle(originalElement);
  for (const style of Array.from(computedStyle)) {
    clone.style.setProperty(style, computedStyle.getPropertyValue(style));
  }
  
  // Torna o clone invisível mas renderizado
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.zIndex = '-1';
  clone.style.opacity = '1';
  clone.style.pointerEvents = 'none';
  
  document.body.appendChild(clone);

  try {
    // Redesenha o gráfico no canvas do clone se necessário
    const clonedCanvas = clone.querySelector('canvas');
    if (clonedCanvas && renderChartFn) {
      renderChartFn(clonedCanvas);
    }

    // Aguarda fontes
    await document.fonts.ready;

    // Aguarda renderização completa
    const canvas = await new Promise<HTMLCanvasElement>((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          html2canvas(clone, {
            backgroundColor: 'transparent',
            useCORS: true,
            scale: 4,
          }).then(resolve);
        }, 200);
      });
    });

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png');
    });
  } finally {
    document.body.removeChild(clone);
  }
}

/**
 * Exporta o card de resumo como imagem
 */
export async function exportWrappedAsImage(
  buttonId: string = 'export-wrapped-btn',
  renderChartFn?: (canvas: HTMLCanvasElement) => void
) {
  const button = document.getElementById(buttonId);
  if (!button || button.getAttribute('disabled') === 'true') return;

  updateButtonState(button, 'Gerando...', true);

  try {
    const imageBlob = await generateImageBlobFromElement('final-slide-to-export', renderChartFn);
    
    const link = document.createElement('a');
    link.download = `meu_resumo_anual_xtraders.png`;
    link.href = URL.createObjectURL(imageBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Erro ao gerar imagem:", err);
    alert("Ocorreu um erro ao gerar a imagem.");
  } finally {
    updateButtonState(button, 'Exportar como Imagem', false);
  }
}

/**
 * Compartilha o card de resumo
 */
export async function shareWrapped(
  buttonId: string = 'share-wrapped-btn',
  renderChartFn?: (canvas: HTMLCanvasElement) => void
) {
  const button = document.getElementById(buttonId);
  if (!button || button.getAttribute('disabled') === 'true') return;
  
  if (!button.querySelector('span')) {
    button.innerHTML += '<span>Compartilhar</span>';
  }

  updateButtonState(button, 'Preparando...', true);

  try {
    const imageBlob = await generateImageBlobFromElement('final-slide-to-export', renderChartFn);
    const imageFile = new File([imageBlob], 'resumo_anual_xtraders.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      await navigator.share({
        files: [imageFile],
        title: 'Meu Resumo Anual 2024 - XTributation',
        text: 'Confira meu desempenho no mercado americano em 2024!',
      });
    } else if (navigator.share) {
      await navigator.share({
        title: 'Meu Resumo Anual 2024 - XTributation',
        text: 'Confira meu desempenho no mercado americano em 2024!',
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      updateButtonState(button, 'Link Copiado!', false);
      setTimeout(() => updateButtonState(button, 'Compartilhar', false), 2000);
      return;
    }
  } catch (err) {
    console.log('Erro ao compartilhar ou processo cancelado pelo usuário:', err);
  } finally {
    if (button.textContent !== 'Link Copiado!') {
      updateButtonState(button, 'Compartilhar', false);
    }
  }
}
