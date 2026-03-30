import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useUIStore } from '../hooks/useUIStore';

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 150);
      });
    });
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob from canvas'));
    }, 'image/png');
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

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

export async function exportAllPagesToPng(options: {
  pages: { id: string; name: string }[];
  setCurrentPage: (pageId: string) => void;
  currentPageId: string;
  onProgress?: (current: number, total: number, pageName: string) => void;
  signal?: AbortSignal;
}): Promise<{ success: number; skipped: string[] }> {
  const { pages, setCurrentPage, currentPageId, onProgress, signal } = options;
  const dateStamp = getDateStamp();
  const skipped: string[] = [];
  let success = 0;

  // Save current UI state
  const uiState = useUIStore.getState();
  const savedShowTooltips = uiState.showTooltips;
  const savedShowMemos = uiState.showMemos;
  const savedThemeMode = uiState.themeMode;

  // Hide memo/tip and force light theme for export
  useUIStore.setState({ showTooltips: false, showMemos: false });
  if (savedThemeMode !== 'light') {
    uiState.setThemeMode('light');
  }

  // Determine if File System Access API is available
  const hasDirectoryPicker = 'showDirectoryPicker' in window;

  let subDir: FileSystemDirectoryHandle | null = null;
  if (hasDirectoryPicker) {
    try {
      const rootDir = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const folderName = `Tosスケジュール_${dateStamp}`;
      subDir = await rootDir.getDirectoryHandle(folderName, { create: true });
    } catch (err: any) {
      // User cancelled the picker
      restoreState();
      if (err?.name === 'AbortError') {
        return { success: 0, skipped: [] };
      }
      throw err;
    }
  }

  // Build unique filename map for duplicate page names
  const filenameMap = buildFilenameMap(pages, dateStamp);

  try {
    for (let i = 0; i < pages.length; i++) {
      if (signal?.aborted) break;

      const page = pages[i];
      onProgress?.(i + 1, pages.length, page.name);

      // Switch to target page
      setCurrentPage(page.id);
      await waitForRender();

      const ctx = getExportContext();
      if (!ctx) {
        skipped.push(page.name);
        continue;
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

        const filename = filenameMap.get(page.id)!;

        if (subDir) {
          // Write to filesystem via File System Access API
          const blob = await canvasToBlob(canvas);
          const fileHandle = await subDir.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          // Fallback: individual downloads with prefixed filename
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `Tosスケジュール_${dateStamp}_${filename}`;
          a.click();
          // Brief delay between downloads to avoid browser blocking
          await new Promise((r) => setTimeout(r, 300));
        }

        success++;
      } catch {
        skipped.push(page.name);
      } finally {
        container.scrollLeft = savedScrollLeft;
        container.scrollTop = savedScrollTop;
      }
    }
  } finally {
    restoreState();
  }

  return { success, skipped };

  function restoreState() {
    setCurrentPage(currentPageId);
    useUIStore.setState({ showTooltips: savedShowTooltips, showMemos: savedShowMemos });
    if (savedThemeMode !== 'light') {
      useUIStore.getState().setThemeMode(savedThemeMode);
    }
  }
}

function buildFilenameMap(
  pages: { id: string; name: string }[],
  dateStamp: string,
): Map<string, string> {
  const map = new Map<string, string>();
  const nameCount = new Map<string, number>();

  for (const page of pages) {
    const baseName = sanitizeFilename(page.name);
    const count = nameCount.get(baseName) ?? 0;
    nameCount.set(baseName, count + 1);

    const suffix = count > 0 ? `_${count + 1}` : '';
    map.set(page.id, `${baseName}${suffix}_${dateStamp}.png`);
  }

  return map;
}
