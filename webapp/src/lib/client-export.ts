import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function getGanttInner(): HTMLElement | null {
  return document.querySelector('.gantt-inner') as HTMLElement | null;
}

export async function exportToPng(filename = 'schedule.png') {
  const el = getGanttInner();
  if (!el) {
    alert('ガントチャートが見つかりません');
    return;
  }
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export async function exportToPdf(filename = 'schedule.pdf') {
  const el = getGanttInner();
  if (!el) {
    alert('ガントチャートが見つかりません');
    return;
  }
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });
  const imgData = canvas.toDataURL('image/png');
  // A3 landscape: 420 x 297 mm
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgRatio = canvas.width / canvas.height;
  let w = pageW;
  let h = pageW / imgRatio;
  if (h > pageH) {
    h = pageH;
    w = pageH * imgRatio;
  }
  pdf.addImage(imgData, 'PNG', 0, 0, w, h);
  pdf.save(filename);
}
