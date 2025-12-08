import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './currency';

const LOGO_SVG = `<svg viewBox="0 0 59.8 45.9" xmlns="http://www.w3.org/2000/svg"><path d="M4.76369 -0.719727C2.13278 -0.719727 0 1.41305 0 4.04396V4.04396C0.00217239 3.70526 0.105853 3.37498 0.297665 3.09573C0.489477 2.81649 0.760619 2.60109 1.07611 2.47733C1.3916 2.35357 1.73695 2.32713 2.06762 2.40142C2.39829 2.47571 2.6991 2.64732 2.93124 2.89411L12.335 12.8644C13.2797 13.866 14.5956 14.4337 15.9724 14.4337H25.321C25.7157 14.4314 26.1025 14.5448 26.4334 14.7599C26.7644 14.975 27.0249 15.2823 27.1829 15.6438C27.3409 16.0054 27.3894 16.4053 27.3224 16.794C27.2553 17.1828 27.0757 17.5434 26.8058 17.8313L2.93398 43.2184C2.70202 43.4662 2.40099 43.6387 2.06985 43.7135C1.7387 43.7884 1.3927 43.7622 1.07662 43.6383C0.760551 43.5144 0.488961 43.2986 0.297012 43.0187C0.105064 42.7389 0.00159475 42.4079 0 42.0686V42.0686C0 44.6587 2.09968 46.7584 4.68977 46.7584H55.1698C57.9313 46.7584 60.1698 44.5198 60.1698 41.7584V4.28028C60.1698 1.51886 57.9313 -0.719727 55.1698 -0.719727H4.76369ZM18.297 1.59641C18.1396 1.42755 18.0354 1.2162 17.9972 0.988633C17.9591 0.761063 17.9887 0.527307 18.0824 0.316417C18.1761 0.105528 18.3297 -0.073197 18.5242 -0.197543C18.7187 -0.321889 18.9455 -0.386374 19.1763 -0.382983H40.9415C41.1711 -0.38424 41.3961 -0.318396 41.5888 -0.193551C41.7814 -0.0687055 41.9334 0.109697 42.026 0.319715C42.1185 0.529733 42.1476 0.762208 42.1097 0.988546C42.0718 1.21488 41.9686 1.42522 41.8126 1.59367L32.5669 11.5153C32.2486 11.8553 31.8638 12.1264 31.4364 12.3117C31.009 12.497 30.5481 12.5926 30.0822 12.5926C29.6163 12.5926 29.1553 12.497 28.7279 12.3117C28.3005 12.1264 27.9158 11.8553 27.5975 11.5153L18.297 1.59641ZM40.9196 46.501C40.9196 46.498 40.9171 46.4955 40.914 46.4955H19.1544C18.9243 46.4973 18.6986 46.4316 18.5054 46.3066C18.3122 46.1817 18.1598 46.0029 18.0671 45.7923C17.9745 45.5817 17.9455 45.3487 17.984 45.1219C18.0224 44.8951 18.1264 44.6845 18.2833 44.5161L27.5208 34.5973C27.8391 34.2572 28.2238 33.9862 28.6512 33.8008C29.0786 33.6155 29.5396 33.5199 30.0055 33.5199C30.4714 33.5199 30.9323 33.6155 31.3597 33.8008C31.7871 33.9862 32.1719 34.2572 32.4902 34.5973L41.788 44.5216C41.9465 44.6896 42.052 44.9004 42.0916 45.1279C42.1311 45.3553 42.1028 45.5894 42.0103 45.8009C41.9177 46.0125 41.765 46.1921 41.5711 46.3176C41.3786 46.442 41.1541 46.5077 40.925 46.5065C40.922 46.5065 40.9196 46.5041 40.9196 46.501V46.501ZM60.0959 42.0686C60.0937 42.4073 59.99 42.7376 59.7982 43.0168C59.6064 43.2961 59.3353 43.5115 59.0198 43.6352C58.7043 43.759 58.3589 43.7854 58.0283 43.7111C57.6976 43.6368 57.3968 43.4652 57.1646 43.2184L47.7636 33.2486C46.8189 32.2467 45.5029 31.6788 44.1259 31.6788H34.7776C34.3827 31.6809 33.9957 31.5673 33.6646 31.3521C33.3335 31.1369 33.0727 30.8294 32.9145 30.4678C32.7563 30.1061 32.7075 29.706 32.7743 29.3169C32.841 28.9279 33.0204 28.5669 33.2901 28.2785L57.1537 2.90506C57.3851 2.65704 57.6857 2.48423 58.0166 2.40904C58.3475 2.33386 58.6933 2.35977 59.0093 2.48342C59.3252 2.60707 59.5967 2.82274 59.7885 3.10247C59.9803 3.3822 60.0836 3.71307 60.0849 4.05217L60.0959 42.0686Z" fill="#000000"/></svg>`;

async function convertSvgToPngDataUri(svgString: string, width: number, height: number): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 3;
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const pngDataUri = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(pngDataUri);
          } else {
            console.warn('Could not get canvas context for logo');
            URL.revokeObjectURL(url);
            resolve(null);
          }
        } catch (e) {
          console.warn('Error drawing logo to canvas:', e);
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = (err) => {
        console.warn('Error loading logo SVG:', err);
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch (e) {
      console.warn('Error creating logo blob:', e);
      resolve(null);
    }
  });
}

function addPdfHeaderFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('XTributation - Relatório de Apuração', 15, pageHeight - 10);
    doc.text(`${i} de ${pageCount}`, pageWidth - 40, pageHeight - 10);
  }
}

function drawKpiBoxes(doc: jsPDF, startY: number, kpiData: any) {
  const boxWidth = 95;
  const boxHeight = 35;
  const gap = 10;
  const numBoxes = 4;

  const totalWidth = (numBoxes * boxWidth) + ((numBoxes - 1) * gap);
  const pageWidth = doc.internal.pageSize.getWidth();
  let startX = (pageWidth - totalWidth) / 2;

  const kpiCards = [
    { title: 'RESULTADO BRUTO (BRL)', value: formatCurrency(kpiData.totalBRL) },
    { title: 'RESULTADO BRUTO (USD)', value: formatCurrency(kpiData.totalUSD, 'USD') },
    { title: 'IMPOSTO DEVIDO (15%)', value: formatCurrency(kpiData.impostoAnual) },
    { title: 'RESULTADO LÍQUIDO', value: formatCurrency(kpiData.resultadoAposDarf) }
  ];

  kpiCards.forEach(item => {
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(startX, startY, boxWidth, boxHeight, 5, 5, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(item.title, startX + boxWidth / 2, startY + 12, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(item.value, startX + boxWidth / 2, startY + 28, { align: 'center' });

    startX += boxWidth + gap;
  });

  return startY + boxHeight;
}

function sanitizeFilename(email: string, prefix: string): string {
  const safeName = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${prefix}_${safeName}.pdf`;
}

export async function generateIrPdf(
  userEmail: string,
  monthlyData: any[],
  allTrades: any[],
  kpiData: any,
  options: { summary: boolean; monthly: boolean; details: boolean }
) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'px',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const pngDataUri = await convertSvgToPngDataUri(LOGO_SVG, 30, 25);
    if (pngDataUri) {
      doc.addImage(pngDataUri, 'PNG', (pageWidth / 2) - 15, 40, 30, 25);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Apuração Anual de Resultados', pageWidth / 2, 95, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Contribuinte: ${userEmail}`, pageWidth / 2, 110, { align: 'center' });
    doc.setDrawColor(220, 220, 220);
    doc.line(30, 125, pageWidth - 30, 125);
    let finalY = 140;

    if (options.summary) {
      finalY = drawKpiBoxes(doc, finalY, kpiData) + 20;
    }

    if (options.monthly) {
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const head = [['Mês', 'Resultado (USD)', 'Resultado (BRL)']];
      const body = monthlyData.map(row => [
        `${monthNames[parseInt(row.mes.split('-')[1]) - 1]}/${row.mes.split('-')[0]}`,
        formatCurrency(row.resultado_liquido_usd, 'USD'),
        formatCurrency(row.resultado_liquido_brl)
      ]);

      autoTable(doc, {
        head,
        body,
        startY: finalY,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          lineWidth: 0,
          cellPadding: { top: 6, right: 10, bottom: 6, left: 10 }
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          textColor: [50, 50, 50],
          halign: 'center'
        }
      });
      finalY = (doc as any).lastAutoTable.finalY + 20;
    }

    if (options.details) {
      if (finalY > 400) doc.addPage();

      const head = [['Data', 'Ativo', 'Resultado (USD)', 'Resultado (BRL)']];
      const body = allTrades.map(t => [
        new Date(t.data_iso + 'T00:00:00Z').toLocaleDateString('pt-BR'),
        t.ativo,
        formatCurrency(t.resultado_liquido_usd, 'USD'),
        formatCurrency(t.resultado_liquido_brl)
      ]);

      autoTable(doc, {
        head,
        body,
        startY: finalY > 400 ? 40 : finalY,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { textColor: [50, 50, 50] }
      });
    }

    addPdfHeaderFooter(doc);
    doc.save(sanitizeFilename(userEmail, 'Relatorio_IR'));
  } catch (error) {
    console.error("Erro ao gerar o PDF:", error);
    throw error;
  }
}

export async function generateCambialPdf(
  userEmail: string,
  kpiData: any,
  exportData: { headers: string[]; data: any[] },
  options: { summary: boolean }
) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'px',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const pngDataUri = await convertSvgToPngDataUri(LOGO_SVG, 30, 25);
    if (pngDataUri) {
      doc.addImage(pngDataUri, 'PNG', (pageWidth / 2) - 15, 40, 30, 25);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório de Envios e Retiradas', pageWidth / 2, 95, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Contribuinte: ${userEmail}`, pageWidth / 2, 110, { align: 'center' });
    doc.setDrawColor(220, 220, 220);
    doc.line(30, 125, pageWidth - 30, 125);
    let finalY = 140;

    if (options.summary) {
      autoTable(doc, {
        body: [
          ['Variação Cambial Total:', formatCurrency(kpiData.lucroPrejuizoTotal)],
          ['Variação Cambial Não Isenta:', formatCurrency(kpiData.lucroTributavel)],
          ['Imposto Devido sobre Retiradas:', formatCurrency(kpiData.impostoDevido)],
          ['Total Enviado (USD):', formatCurrency(kpiData.totalEnviosUSD, 'USD')],
          ['Saldo Atual (USD):', formatCurrency(kpiData.saldoUSD, 'USD')],
          ['Saldo Atual (BRL):', formatCurrency(kpiData.custoSaldoBRL)],
          ['Total Enviado (BRL):', formatCurrency(kpiData.totalEnviosBRL)],
          ['Total Retirado (BRL):', formatCurrency(kpiData.totalRetiradoBRL)]
        ],
        startY: finalY,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          cellPadding: { top: 4, right: 5, bottom: 4, left: 5 }
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          1: { halign: 'center' }
        }
      });
      finalY = (doc as any).lastAutoTable.finalY + 20;
    }

    const head = [exportData.headers];
    const body = exportData.data.map(row => Object.values(row).map(val =>
      typeof val === 'number' ? val.toFixed(2) : val
    ));

    autoTable(doc, {
      head,
      body,
      startY: finalY,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        lineWidth: 0,
        cellPadding: { top: 6, right: 10, bottom: 6, left: 10 }
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [50, 50, 50],
        halign: 'center'
      }
    });

    addPdfHeaderFooter(doc);
    doc.save(sanitizeFilename(userEmail, 'Relatorio_Cambial'));
  } catch (error) {
    console.error("Erro ao gerar o PDF Cambial:", error);
    throw error;
  }
}
