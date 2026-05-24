// Patch for jsPDF UMD build compatibility
if (!window.jsPDF && window.jspdf && window.jspdf.jsPDF) {
    window.jsPDF = window.jspdf.jsPDF;
}

class pdfExport {

    static getTextNodes(stage) {
        if (!stage || typeof stage.find !== 'function') {
            return [];
        }
        try {
            const nodes = stage.find('Text') || [];
            return nodes.filter(node => {
                if (!node || typeof node.isVisible !== 'function') return false;
                if (!node.isVisible()) return false;
                if (typeof node.opacity === 'function' && node.opacity() <= 0) return false;
                const text = typeof node.text === 'function' ? node.text() : '';
                return !!(text && text.trim());
            });
        } catch (_error) {
            return [];
        }
    }

    static parseColorToRgb(colorValue) {
        if (!colorValue || typeof colorValue !== 'string') {
            return [17, 17, 17];
        }

        const color = colorValue.trim().toLowerCase();
        if (/^#([0-9a-f]{3})$/.test(color)) {
            const hex = color.slice(1);
            return [
                parseInt(hex[0] + hex[0], 16),
                parseInt(hex[1] + hex[1], 16),
                parseInt(hex[2] + hex[2], 16)
            ];
        }

        if (/^#([0-9a-f]{6})$/.test(color)) {
            const hex = color.slice(1);
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16)
            ];
        }
        // 8-digit hex: #RRGGBBAA — extract RGB, ignore alpha (PDF text is opaque)
        if (/^#([0-9a-f]{8})$/.test(color)) {
            const hex = color.slice(1);
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16)
                 // hex.slice(6, 8) is the alpha channel — ignored for PDF text
            ];
         }
        const rgbMatch = color.match(/^rgba?\(([^)]+)\)$/);
        if (rgbMatch) {
            const parts = rgbMatch[1].split(',').map(part => Number(part.trim()));
            if (parts.length >= 3 && parts.every(Number.isFinite)) {
                return [
                    Math.max(0, Math.min(255, Math.round(parts[0]))),
                    Math.max(0, Math.min(255, Math.round(parts[1]))),
                    Math.max(0, Math.min(255, Math.round(parts[2])))
                ];
            }
        }

        return [17, 17, 17];
    }

    static getJsPdfFontStyle(konvaFontStyle) {
        const value = (konvaFontStyle || '').toLowerCase();
        const isBold = value.includes('bold');
        const isItalic = value.includes('italic');
        if (isBold && isItalic) return 'bolditalic';
        if (isBold) return 'bold';
        if (isItalic) return 'italic';
        return 'normal';
    }

    static drawSearchableTextLayer(pdf, stage) {
        const textNodes = this.getTextNodes(stage);
        textNodes.forEach(node => {
            try {
                const absolutePosition = typeof node.getAbsolutePosition === 'function'
                    ? node.getAbsolutePosition()
                    : { x: node.x(), y: node.y() };
                const absoluteScale = typeof node.getAbsoluteScale === 'function'
                    ? node.getAbsoluteScale()
                    : { x: 1, y: 1 };
                const absoluteRotation = typeof node.getAbsoluteRotation === 'function'
                    ? node.getAbsoluteRotation()
                    : 0;

                const fontSize = Math.max(6, (node.fontSize() || 12) * (absoluteScale.y || 1));
                const lineHeight = Math.max(1, Number(node.lineHeight() || 1));
                const textAlign = (typeof node.align === 'function' ? node.align() : 'left') || 'left';
                const nodeWidth = typeof node.width === 'function' ? node.width() * (absoluteScale.x || 1) : 0;
                const fontStyle = this.getJsPdfFontStyle(typeof node.fontStyle === 'function' ? node.fontStyle() : 'normal');
                const [red, green, blue] = this.parseColorToRgb(typeof node.fill === 'function' ? node.fill() : '#111111');

                pdf.setFont('helvetica', fontStyle);
                pdf.setFontSize(fontSize);
                pdf.setTextColor(red, green, blue);

                const lines = (Array.isArray(node.textArr) && node.textArr.length > 0)
                    ? node.textArr.map(item => item?.text || '').filter(Boolean)
                    : String(node.text() || '').split('\n');

                let drawX = absolutePosition.x;
                if (textAlign === 'center' && nodeWidth > 0) {
                    drawX = absolutePosition.x + nodeWidth / 2;
                } else if (textAlign === 'right' && nodeWidth > 0) {
                    drawX = absolutePosition.x + nodeWidth;
                }

                const drawY = absolutePosition.y;
                pdf.text(lines, drawX, drawY, {
                    baseline: 'top',
                    align: textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'right' : 'left'),
                    angle: absoluteRotation,
                    lineHeightFactor: lineHeight
                });
            } catch (error) {
                console.warn('[pdfExport] Could not draw searchable text node:', error);
            }
        });
    }

    static async stageToImageData(stage, pageWidth, pageHeight, logicalW, options) {
        const container = stage.container && stage.container();
        if (!container) {
            return null;
        }
        const canvas = container.querySelector && container.querySelector('canvas');
        if (!canvas) {
            return null;
        }

        let canvasPixelRatio = 1;
        try {
            if (canvas.width && logicalW) {
                canvasPixelRatio = canvas.width / logicalW;
            }
        } catch (_e) {
            canvasPixelRatio = options.pixelRatio || 1;
        }

        let imgData = null;
        const shouldExcludeTextFromRaster = options.includeSearchableText !== false;
        const hiddenTextNodes = [];

        if (shouldExcludeTextFromRaster && typeof stage.find === 'function') {
            try {
                const textNodes = stage.find('Text') || [];
                textNodes.forEach(node => {
                    if (!node || typeof node.visible !== 'function') {
                        return;
                    }
                    hiddenTextNodes.push({ node, wasVisible: node.visible() });
                    node.visible(false);
                });
                if (hiddenTextNodes.length > 0 && typeof stage.draw === 'function') {
                    stage.draw();
                }
            } catch (err) {
                console.warn('[pdfExport] Failed to temporarily hide text nodes before raster export', err);
            }
        }

        try {
            if (typeof stage.toDataURL === 'function') {
                try {
                    const pr = options.pixelRatio || canvasPixelRatio || 1;
                    imgData = stage.toDataURL({ mimeType: 'image/png', quality: 1, pixelRatio: pr });
                } catch (err) {
                    console.warn('[pdfExport] stage.toDataURL failed, falling back to canvas.toDataURL', err);
                    imgData = null;
                }
            }

            if (!imgData) {
                imgData = canvas.toDataURL('image/png');
            }
        } finally {
            if (hiddenTextNodes.length > 0) {
                hiddenTextNodes.forEach(({ node, wasVisible }) => {
                    try {
                        node.visible(wasVisible);
                    } catch (_restoreErr) {
                        // Ignore restoration errors for individual nodes
                    }
                });
                if (typeof stage.draw === 'function') {
                    stage.draw();
                }
            }
        }

        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load slide image')); 
            img.src = imgData;
        });

        const off = document.createElement('canvas');
        off.width = pageWidth;
        off.height = pageHeight;
        const ctx = off.getContext('2d');
        ctx.fillStyle = options.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, off.width, off.height);

        try {
            ctx.drawImage(image, 0, 0, pageWidth, pageHeight);
        } catch (err) {
            console.warn('[pdfExport] drawImage failed, attempting fallback draw', err);
            const iw = image.width || canvas.width || pageWidth;
            const ih = image.height || canvas.height || pageHeight;
            const scale = Math.min(pageWidth / iw, pageHeight / ih);
            const drawW = Math.round(iw * scale);
            const drawH = Math.round(ih * scale);
            const dx = Math.round((pageWidth - drawW) / 2);
            const dy = Math.round((pageHeight - drawH) / 2);
            ctx.drawImage(image, dx, dy, drawW, drawH);
        }

        return off.toDataURL('image/png');
    }

    static async exportSlideForgePDF(stages, options = {}) {
       //console.log('[pdfExport] Called exportSlideForgePDF', { stages, options, jsPDF: !!window.jsPDF });
        if (!window.jsPDF) {
            console.error('[pdfExport] jsPDF is not loaded:', window.jsPDF);
            alert(window.Lang ? Lang.get('pdfExportJsPDFNotLoaded') : 'PDF export failed: jsPDF is not loaded.');
            return;
        }
        if (!Array.isArray(stages)) {
            console.error('[pdfExport] stages is not an array:', stages);
            alert(window.Lang ? Lang.get('pdfExportStagesNotArray') : 'PDF export failed: stages is not an array.');
            return;
        }
        if (stages.length === 0) {
            console.error('[pdfExport] stages array is empty:', stages);
            alert(window.Lang ? Lang.get('pdfExportNoSlides') : 'PDF export failed: no slides to export.');
            return;
        }
        const pdfName = options.pdfName || 'presentation.pdf';

        // Derive page logical size from the first available stage so export matches preview 1:1
        const firstStage = stages.find(s => s);
        const logicalW = (firstStage && typeof firstStage.width === 'function') ? firstStage.width() : (options.pageWidth || 1280);
        const logicalH = (firstStage && typeof firstStage.height === 'function') ? firstStage.height() : (options.pageHeight || 720);

        const pageWidth = options.pageWidth || logicalW; // px (logical pixels)
        const pageHeight = options.pageHeight || logicalH; // px (logical pixels)

        // Choose orientation to match stage aspect
        const orientation = pageWidth >= pageHeight ? 'landscape' : 'portrait';

        // Use 'px' units so we can map canvas logical pixels 1:1 to PDF pixels
        const pdf = new window.jsPDF({ orientation, unit: 'px', format: [pageWidth, pageHeight] });

        try {
            for (let idx = 0; idx < stages.length; idx += 1) {
                const stage = stages[idx];
                if (!stage) {
                    console.warn(`[pdfExport] Stage at index ${idx} is missing or null`, stage);
                    continue;
                }

                const pageImg = await this.stageToImageData(stage, pageWidth, pageHeight, logicalW, options);
                if (!pageImg) {
                    console.warn(`[pdfExport] Could not create image for stage ${idx}`);
                    continue;
                }

                if (idx > 0) {
                    pdf.addPage([pageWidth, pageHeight], orientation);
                }

                pdf.addImage(pageImg, 'PNG', 0, 0, pageWidth, pageHeight);

                if (options.includeSearchableText !== false) {
                    this.drawSearchableTextLayer(pdf, stage);
                }
            }

            pdf.save(pdfName);
        } catch (error) {
            console.error('[pdfExport] Export failed:', error);
            alert(window.Lang ? Lang.get('pdfExportFailed', 'PDF export failed.') : 'PDF export failed.');
        }
    }
}

// Make the class available globally
window.pdfExport = pdfExport;
