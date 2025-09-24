// Patch for jsPDF UMD build compatibility
if (!window.jsPDF && window.jspdf && window.jspdf.jsPDF) {
    window.jsPDF = window.jspdf.jsPDF;
}

class pdfExport {

    static exportSlideForgePDF(stages, options = {}) {
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

        const tasks = [];

        stages.forEach((stage, idx) => {
            tasks.push(new Promise(res => {
                if (!stage) {
                    console.warn(`[pdfExport] Stage at index ${idx} is missing or null`, stage);
                    return res();
                }
                const container = stage.container && stage.container();
                if (!container) {
                    console.warn(`[pdfExport] Stage at index ${idx} has no container`, stage);
                    return res();
                }
                const canvas = container.querySelector && container.querySelector('canvas');
                if (!canvas) {
                    console.warn(`[pdfExport] No canvas found in stage at index ${idx}`, container);
                    return res();
                }

                // Compute canvas backing pixel ratio relative to logical stage size
                let canvasPixelRatio = 1;
                try {
                    // canvas.width is backing store pixels, logicalW is logical pixels
                    if (canvas.width && logicalW) {
                        canvasPixelRatio = canvas.width / logicalW;
                    }
                } catch (e) {
                    canvasPixelRatio = options.pixelRatio || 1;
                }

                // For the cover slide prefer Konva's merged output so all layers are captured (respect pixelRatio)
                let imgData = null;
                if (idx === 0 && typeof stage.toDataURL === 'function') {
                    try {
                        const pr = options.pixelRatio || canvasPixelRatio || 1;
                        imgData = stage.toDataURL({ mimeType: 'image/png', quality: 1, pixelRatio: pr });
                    } catch (err) {
                        console.warn('[pdfExport] stage.toDataURL failed for cover, falling back to canvas.toDataURL', err);
                        imgData = null;
                    }
                }

                // Fallback: use the primary canvas data (existing behavior for content slides)
                if (!imgData) {
                    // Use canvas.toDataURL which reflects backing store resolution. We'll draw it into an offscreen canvas sized to logical page size below.
                    imgData = canvas.toDataURL('image/png');
                }

                const img = new Image();
                img.onload = () => {
                    // Create an offscreen canvas sized to the logical PDF page (px)
                    const off = document.createElement('canvas');
                    off.width = pageWidth;
                    off.height = pageHeight;
                    const ctx = off.getContext('2d');

                    // Optional: fill background white to avoid transparency artifacts
                    ctx.fillStyle = options.backgroundColor || '#ffffff';
                    ctx.fillRect(0, 0, off.width, off.height);

                    // Draw the source image into the offscreen canvas scaled to the logical page size
                    // This avoids cover-style cropping and ensures 1:1 logical mapping between preview and PDF.
                    try {
                        ctx.drawImage(img, 0, 0, pageWidth, pageHeight);
                    } catch (err) {
                        console.warn('[pdfExport] drawImage failed, attempting fallback draw', err);
                        // fallback: center and scale preserving aspect ratio
                        const iw = img.width || canvas.width || pageWidth;
                        const ih = img.height || canvas.height || pageHeight;
                        const scale = Math.min(pageWidth / iw, pageHeight / ih);
                        const drawW = Math.round(iw * scale);
                        const drawH = Math.round(ih * scale);
                        const dx = Math.round((pageWidth - drawW) / 2);
                        const dy = Math.round((pageHeight - drawH) / 2);
                        ctx.drawImage(img, dx, dy, drawW, drawH);
                    }

                    const pageImg = off.toDataURL('image/png');

                    // Add page to PDF. For the first image the document is already the right size.
                    if (idx > 0) {
                        pdf.addPage([pageWidth, pageHeight], orientation);
                    }

                    // Place the image to fill the whole page (0,0 -> full page)
                    pdf.addImage(pageImg, 'PNG', 0, 0, pageWidth, pageHeight);

                    res();
                };
                img.onerror = () => {
                    console.warn(`[pdfExport] Failed to load image for stage ${idx}`);
                    res();
                };
                img.src = imgData;
            }));
        });

        Promise.all(tasks).then(() => {
            //console.log('[pdfExport] Saving PDF as', pdfName);
            pdf.save(pdfName);
        });
    }
}

// Make the class available globally
window.pdfExport = pdfExport;
