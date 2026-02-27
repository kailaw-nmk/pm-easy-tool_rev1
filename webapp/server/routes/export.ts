import { Router } from 'express';

export const exportRouter = Router();

exportRouter.post('/png', async (req, res) => {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true });
    const page = await browser.newPage();
    const pageId = req.body.pageId || 'p0';

    await page.setViewport({ width: 1600, height: 1200 });
    await page.goto(`http://localhost:5173?page=${pageId}&export=true`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for SVG to render
    await page.waitForSelector('svg.gantt-chart', { timeout: 10000 });

    const svgElement = await page.$('svg.gantt-chart');
    if (!svgElement) {
      await browser.close();
      return res.status(500).json({ error: 'SVG element not found' });
    }

    const pngBuffer = await svgElement.screenshot({ type: 'png', omitBackground: false });
    await browser.close();

    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="schedule_${pageId}.png"`);
    res.send(pngBuffer);
  } catch (err) {
    console.error('PNG export error:', err);
    res.status(500).json({ error: 'Failed to export PNG' });
  }
});

exportRouter.post('/pdf', async (req, res) => {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true });
    const page = await browser.newPage();
    const pageId = req.body.pageId || 'p0';

    await page.goto(`http://localhost:5173?page=${pageId}&export=true`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForSelector('svg.gantt-chart', { timeout: 10000 });

    const pdfBuffer = await page.pdf({
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    await browser.close();

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="schedule_${pageId}.pdf"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});
