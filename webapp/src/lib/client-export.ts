import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function getExportContext() {
  const inner = document.querySelector('.gantt-inner') as HTMLElement | null;
  const container = document.querySelector('.gantt-container') as HTMLElement | null;
  if (!inner || !container) return null;
  const headerSvg = inner.querySelector('.gantt-header-sticky svg') as SVGSVGElement | null;
  const bodySvg = inner.querySelector('svg.gantt-chart') as SVGSVGElement | null;
  if (!headerSvg || !bodySvg) return null;
  const width = bodySvg.width.baseVal.value;
  const height = headerSvg.height.baseVal.value + bodySvg.height.baseVal.value;
  return { inner, container, width, height };
}

export async function exportToPng(filename = 'schedule.png') {
  const ctx = getExportContext();
  if (!ctx) {
    alert('ガントチャートが見つかりません');
    return;
  }
  const { inner, container, width, height } = ctx;
  const savedScrollLeft = container.scrollLeft;
  const savedScrollTop = container.scrollTop;
  container.scrollLeft = 0;
  container.scrollTop = 0;
  try {
    const canvas = await html2canvas(inner, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    container.scrollLeft = savedScrollLeft;
    container.scrollTop = savedScrollTop;
  }
}

export async function exportToPdf(filename = 'schedule.pdf') {
  const ctx = getExportContext();
  if (!ctx) {
    alert('ガントチャートが見つかりません');
    return;
  }
  const { inner, container, width, height } = ctx;
  const savedScrollLeft = container.scrollLeft;
  const savedScrollTop = container.scrollTop;
  container.scrollLeft = 0;
  container.scrollTop = 0;
  try {
    const canvas = await html2canvas(inner, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width,
      height,
      windowWidth: width,
      windowHeight: height,
    });
    const imgData = canvas.toDataURL('image/png');
    const imgRatio = width / height;
    // Custom page size to match content aspect ratio (no whitespace)
    const pageW = 420; // mm (A3 width as base)
    const pageH = pageW / imgRatio;
    const pdf = new jsPDF({ unit: 'mm', format: [pageW, pageH] });
    pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
    pdf.save(filename);
  } finally {
    container.scrollLeft = savedScrollLeft;
    container.scrollTop = savedScrollTop;
  }
}
