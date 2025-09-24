
class SlideStyles {

    // Apply a style by key. data = { parsedSlides, slideImagesResult }
    static async applyStyle(styleKey, stages, data) {
        if (!stages || !Array.isArray(stages) || stages.length === 0 || !data) return;
        switch (styleKey) {
            case 'corporate':
                return await SlideStyles.renderCorporate(stages, data.parsedSlides, data.slideImagesResult);
            case 'brutalist':
                return await SlideStyles.renderBrutalist(stages, data.parsedSlides, data.slideImagesResult);
            case 'purple-glass':
                return await SlideStyles.renderPurpleGlass(stages, data.parsedSlides, data.slideImagesResult);
            case 'wilderness':
                return await SlideStyles.renderWilderness(stages, data.parsedSlides, data.slideImagesResult);
            case 'enchanted':
                return await SlideStyles.renderEnchanted(stages, data.parsedSlides, data.slideImagesResult);
            case 'darkmode':
                return await SlideStyles.renderDarkMode(stages, data.parsedSlides, data.slideImagesResult);
            case 'product-showcase':
                return await SlideStyles.renderProductShowcase(stages, data.parsedSlides, data.slideImagesResult);
            case 'finance':
                return await SlideStyles.renderFinance(stages, data.parsedSlides, data.slideImagesResult);
            case 'data':
                return await SlideStyles.renderData(stages, data.parsedSlides, data.slideImagesResult);
            case 'hobby':
                return await SlideStyles.renderHobby(stages, data.parsedSlides, data.slideImagesResult);
            case 'pets':
                return await SlideStyles.renderPets(stages, data.parsedSlides, data.slideImagesResult);
            case 'diy':
                return await StyleDIY.renderDIY(stages, data.parsedSlides, data.slideImagesResult, data.customStyleCode);
            case 'classic':
            default:
                return await SlideStyles.renderClassic(stages, data.parsedSlides, data.slideImagesResult);
        }
    }

    static clearStages(stages) {
        stages.forEach(stage => {
            stage.destroyChildren();
            stage.draw();
        });
    }

    // Helper: compute pw_id for an image node using slideData or parsedSlides cover metadata
    static _getImagePwId(slideData, parsedSlides) {
        try {
            if (slideData && slideData._pw) {
                if (slideData._pw.imageId) return slideData._pw.imageId;
                if (slideData._pw.id) return slideData._pw.id;
            }
            if (parsedSlides && parsedSlides.cover && parsedSlides.cover._pw) {
                if (parsedSlides.cover._pw.imageId) return parsedSlides.cover._pw.imageId;
                if (parsedSlides.cover._pw.id) return parsedSlides.cover._pw.id;
            }
        } catch (e) { /* ignore */ }
        return undefined;
    }

    static async renderClassic(stages, parsedSlides, slideImagesResult) {
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];
            // Cover slide (stage index 0)
            const coverStage = stages[0];
            const coverLayer = new window.Konva.Layer();
            const sw = coverStage.width();
            const sh = coverStage.height();
            // Cover image as full background
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // Scale and center image to fill background without deforming
                    const imgRatio = imgObj.width / imgObj.height;
                    const stageRatio = sw / sh;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > stageRatio) {
                        drawH = sh;
                        drawW = imgObj.width * (sh / imgObj.height);
                        drawX = (sw - drawW) / 2;
                        drawY = 0;
                    } else {
                        drawW = sw;
                        drawH = imgObj.height * (sw / imgObj.width);
                        drawX = 0;
                        drawY = (sh - drawH) / 2;
                    }
                    const coverImg = new window.Konva.Image({
                        image: imgObj,
                        x: drawX,
                        y: drawY,
                        width: drawW,
                        height: drawH,
                        opacity: 0.92,
                        pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides)
                    });
                    coverLayer.add(coverImg);
                    // Overlay gradient for readability
                    const gradient = new window.Konva.Rect({
                        x: 0, y: 0, width: sw, height: sh,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: sw, y: sh },
                        fillLinearGradientColorStops: [0, 'rgba(30,58,138,0.7)', 1, 'rgba(37,99,235,0.7)']
                    });
                    coverLayer.add(gradient);
                    // Title and subtitle with gap
                    const titleText = new window.Konva.Text({
                        text: parsedSlides.cover?.title || '',
                        x: 80,
                        y: sh / 2 - 160, // moved up for bigger gap
                        width: sw - 160,
                        fontSize: 64,
                        fontStyle: 'bold',
                        align: 'center',
                        fill: '#ffffff',
                        shadowColor: '#000',
                        shadowBlur: 12,
                        shadowOpacity: 0.25,
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                    const subtitleText = new window.Konva.Text({
                        text: parsedSlides.cover?.subtitle || '',
                        x: 120,
                        y: sh / 2 + 50, // moved down for bigger gap
                        width: sw - 240,
                        fontSize: 36,
                        align: 'center',
                        fill: '#e0f2fe',
                        shadowColor: '#000',
                        shadowBlur: 8,
                        shadowOpacity: 0.18,
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                    coverLayer.add(titleText);
                    coverLayer.add(subtitleText);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.onerror = () => {
                    // Fallback: gradient only
                    const gradient = new window.Konva.Rect({
                        x: 0, y: 0, width: sw, height: sh,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: sw, y: sh },
                        fillLinearGradientColorStops: [0, '#1e3a8a', 1, '#2563eb']
                    });
                    coverLayer.add(gradient);
                    const titleText = new window.Konva.Text({
                        text: parsedSlides.cover?.title || '',
                        x: 80,
                        y: sh / 2 - 140, // moved up for bigger gap
                        width: sw - 160,
                        fontSize: 64,
                        fontStyle: 'bold',
                        align: 'center',
                        fill: '#ffffff',
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                    const subtitleText = new window.Konva.Text({
                        text: parsedSlides.cover?.subtitle || '',
                        x: 120,
                        y: sh / 2 + 50, // moved down for bigger gap
                        width: sw - 240,
                        fontSize: 36,
                        align: 'center',
                        fill: '#e0f2fe',
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                    coverLayer.add(titleText);
                    coverLayer.add(subtitleText);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                // Fallback: gradient only
                const gradient = new window.Konva.Rect({
                    x: 0, y: 0, width: sw, height: sh,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: sw, y: sh },
                    fillLinearGradientColorStops: [0, '#1e3a8a', 1, '#2563eb']
                });
                coverLayer.add(gradient);
                const titleText = new window.Konva.Text({
                    text: parsedSlides.cover?.title || '',
                    x: 80,
                    y: sh / 2 - 140, // moved up for bigger gap
                    width: sw - 160,
                    fontSize: 64,
                    fontStyle: 'bold',
                    align: 'center',
                    fill: '#ffffff',
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
                const subtitleText = new window.Konva.Text({
                    text: parsedSlides.cover?.subtitle || '',
                    x: 120,
                    y: sh / 2 + 50, // moved down for bigger gap
                    width: sw - 240,
                    fontSize: 36,
                    align: 'center',
                    fill: '#e0f2fe',
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
                coverLayer.add(titleText);
                coverLayer.add(subtitleText);
                coverStage.add(coverLayer);
                coverStage.draw();
            }


            // Content slides
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();
                // Background
                const bg = new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: '#ffffff' });
                layer.add(bg);
                // Title (fit in one line, never overflow)
                const slideData = parsedSlides.slides[i - 1];
                const titleY = margin;
                const titleText = slideData?.title || `Slide ${i + 1}`;
                const titleWidth = w - margin * 2;
                let titleFontSize = 42;
                let minTitleFontSize = 18;
                let titleObj = new window.Konva.Text({
                    text: titleText,
                    x: margin,
                    y: titleY,
                    width: titleWidth,
                    fontSize: titleFontSize,
                    fontStyle: 'bold',
                    fill: '#1e3a8a',
                    fontFamily: 'Arial',
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleObj = new window.Konva.Text({
                        text: titleText,
                        x: margin,
                        y: titleY,
                        width: titleWidth,
                        fontSize: titleFontSize,
                        fontStyle: 'bold',
                        fill: '#1e3a8a',
                        fontFamily: 'Arial',
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                    });
                }
                layer.add(titleObj);
                // Line under title
                const lineY = titleY + 70;
                const line = new window.Konva.Line({
                    points: [margin, lineY, w - margin, lineY],
                    stroke: '#2563eb',
                    strokeWidth: 4,
                    lineCap: 'round'
                });
                layer.add(line);
                // Define a gap below the line for the image
                const imageGap = 32;
                // Text content area (left) - dynamic layout for multiple text nodes
                const contentWidth = (w * 0.55) - margin * 1.0;
                const topGap = 18; // gap between line and first text node
                const betweenGap = 16; // gap between text nodes
                const bottomGap = 24; // gap at bottom
                const availableHeight = h - (lineY + imageGap + topGap + bottomGap);
                const textNodes = (slideData?.content || []);
                let fontSize = 24;
                let minFontSize = 14;
                let fits = false;
                let textHeights = [];
                // Overflowing fix for bullets
                while (fontSize >= minFontSize && !fits) {
                    textHeights = textNodes.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            width: contentWidth,
                            lineHeight: 1.25,
                            fontFamily: 'Arial',
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        });
                        return temp.height();
                    });
                    const totalHeight = textHeights.reduce((a, b) => a + b, 0) + (textNodes.length - 1) * betweenGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }
                // If still doesn't fit, use minFontSize and recalc
                if (!fits) {
                    fontSize = minFontSize;
                    textHeights = textNodes.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            width: contentWidth,
                            lineHeight: 1.25,
                            fontFamily: 'Arial',
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        });
                        return temp.height();
                    });
                }
                // Now render the text nodes with calculated font size and spacing
                let yCursor = lineY + imageGap + topGap;
                textNodes.forEach((txt, idx) => {
                    const textObj = new window.Konva.Text({
                        text: `   ${txt}`,
                        x: margin,
                        y: yCursor,
                        width: contentWidth,
                        fontSize: fontSize,
                        lineHeight: 1.25,
                        fill: '#334155',
                        fontFamily: 'Arial',
                        pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    });
                    layer.add(textObj);
                    yCursor += textHeights[idx] + betweenGap;
                });
                // Image (right)
                const imgIndex = i - 1;
                const base64 = slideImagesResult?.slideImages?.[imgIndex];
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Fit image in right column, below the line with a gap
                            const imgMaxW = w - (contentWidth + margin * 3);
                            // Place image below the line + gap
                            const imgTop = lineY + imageGap;
                            const imgMaxH = h - imgTop - margin;
                            let drawW = imgObj.width;
                            let drawH = imgObj.height;
                            const ratio = Math.min(imgMaxW / drawW, imgMaxH / drawH, 1);
                            drawW *= ratio; drawH *= ratio;
                            const konvaImg = new window.Konva.Image({
                                image: imgObj,
                                x: contentWidth + margin * 2,
                                y: imgTop,
                                width: drawW,
                                height: drawH,
                                shadowColor: '#000',
                                shadowBlur: 16,
                                shadowOpacity: 0.15,
                                cornerRadius: 12,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });
                            layer.add(konvaImg);
                            stage.add(layer);
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { stage.add(layer); stage.draw(); res(); };
                    }));
                    imgObj.src = base64;
                } else {
                    stage.add(layer);
                    stage.draw();
                }
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderSophie(stages, parsedSlides, slideImagesResult) {
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // Common SVG path definitions (hearts, stars, bows, sparkles, clouds, moons, ribbon)
            const svgPaths = {
                heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
                star: 'M12 2l2.5 6.9L22 10l-5.5 4.1L18 21l-6-3.4L6 21l1.5-6.9L2 10l7.5-1.1z',
                sparkle: 'M12 3l1.2 4.2L17 8.4l-3.8 1.2L12 14l-1.2-4.4L7 8.4l3.8-1.2z',
                bow: 'M12 12c2.2-4.5 5.5-6.8 9-7-2.2 2-2.8 4.2-2.3 6.4 2.1.6 3.5 1.6 5.3 4.6-4.7-2-7-1.4-9 1-2-2.4-4.3-3-9-1 1.8-3 3.2-4 5.3-4.6.5-2.2-.1-4.4-2.3-6.4 3.5.2 6.8 2.5 9 7z',
                cloud: 'M20 17H6.5a4.5 4.5 0 01-.9-8.9A6 6 0 0119 9.5h1a4.5 4.5 0 010 9.0z',
                moon: 'M12.5 2a7.5 7.5 0 107.3 9.2A6.5 6.5 0 0112.5 2z',
                ribbon: 'M2 6c4 0 6-4 10-4s6 4 10 4v2c-4 0-6-4-10-4S6 8 2 8V6zm0 6c4 0 6-4 10-4s6 4 10 4v2c-4 0-6-4-10-4s-6 4-10 4v-2z'
            };

            const kawaiiPalette = ['#ff9ad5', '#ff73c6', '#ffa8e8', '#ffd7f2', '#b06dff', '#9340ff'];
            const bgGradientStops = [0, '#1c0429', 0.4, '#2d0840', 0.7, '#451059', 1, '#5e1570'];

            // Helper: add random kawaii SVG decorations per layer
            function addDecorations(layer, w, h, seedIndex, isCover = false) {
                const count = isCover ? 8 : 5 + Math.floor(Math.random() * 3);
                const pathKeys = Object.keys(svgPaths);
                for (let i = 0; i < count; i++) {
                    const key = pathKeys[(i + seedIndex) % pathKeys.length];
                    const sizeBase = isCover ? 1.2 : 0.8;
                    const scale = sizeBase + Math.random() * 1.4;
                    const x = Math.random() * w;
                    const y = (isCover ? Math.random() * h : (Math.random() * (h - 200) + 100));
                    layer.add(new window.Konva.Path({
                        x, y,
                        data: svgPaths[key],
                        fill: ['heart', 'bow', 'sparkle'].includes(key) ? kawaiiPalette[(i + seedIndex) % kawaiiPalette.length] : 'rgba(255,255,255,0.18)',
                        stroke: Math.random() < 0.3 ? '#ffb3ec' : undefined,
                        strokeWidth: Math.random() < 0.3 ? 1.5 : 0,
                        scaleX: scale,
                        scaleY: scale,
                        rotation: Math.random() * 360,
                        opacity: key === 'cloud' ? 0.12 : key === 'moon' ? 0.15 : 0.55,
                        shadowColor: '#ff9ad5',
                        shadowBlur: key === 'sparkle' ? 12 : 6,
                        shadowOpacity: key === 'sparkle' ? 0.6 : 0.25
                    }));
                }
            }

            // COVER STAGE
            const coverStage = stages[0];
            const coverLayer = new window.Konva.Layer();
            const sw = coverStage.width();
            const sh = coverStage.height();

            // Background (base dark purple gradient)
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: bgGradientStops,
                opacity: 0.6
            }));

            // Soft radial glow center / bottom
            coverLayer.add(new window.Konva.Circle({
                x: sw * 0.4,
                y: sh * 0.65,
                radius: Math.max(sw, sh) * 0.5,
                fillRadialGradientStartPoint: { x: 0, y: 0 },
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 },
                fillRadialGradientEndRadius: Math.max(sw, sh) * 0.5,
                fillRadialGradientColorStops: [0, 'rgba(255,130,220,0.35)', 0.4, 'rgba(130,40,150,0.15)', 1, 'rgba(30,5,45,0.0)']
            }));

            // Glassy top bar
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: 90,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 0, y: 90 },
                fillLinearGradientColorStops: [0, 'rgba(255,170,240,0.25)', 1, 'rgba(255,170,240,0.08)'],
                shadowColor: 'rgba(0,0,0,0.4)', shadowBlur: 25, shadowOffset: { x: 0, y: 6 }, shadowOpacity: 1
            }));

            // Side ribbon
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 90, width: 10, height: sh - 180,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 0, y: sh - 180 },
                fillLinearGradientColorStops: [0, '#ff73c6', 0.5, '#9340ff', 1, '#ff9ad5']
            }));

            // Title / Subtitle - larger, left title and right subtitle, vertically centered
            const titleText = parsedSlides.cover?.title || (window.Lang ? Lang.get('kawaiiDefaultTitle') : 'Kawaii SlideForge');
            const leftX = 80;
            const gapBetween = 36; // horizontal gap between title and subtitle
            const leftWidth = Math.min(sw * 0.56, sw - 320); // wider left column for larger title
            const rightX = leftX + leftWidth + gapBetween;
            const rightWidth = Math.max(260, sw - rightX - 80); // enough room for a bigger subtitle

            // Bigger title base size (responsive) and minimum
            let titleFontSize = Math.min(110, Math.max(44, Math.floor(sw * 0.09)));
            const minTitleFont = 30;
            let titleObj = new window.Konva.Text({
                x: leftX,
                y: 0,
                text: titleText,
                fontSize: titleFontSize,
                fontFamily: '"Nunito", "Montserrat", Arial',
                fontStyle: 'bold',
                fill: '#ffd7f2',
                width: leftWidth,
                align: 'left',
                lineHeight: 1.08,
                shadowColor: 'rgba(0,0,0,0.45)',
                shadowBlur: 12,
                shadowOffset: { x: 0, y: 6 },
                shadowOpacity: 1
                ,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });

            // Reduce title if it would take too much vertical space
            while (titleObj.height() > sh * 0.4 && titleFontSize > minTitleFont) {
                titleFontSize -= 2;
                titleObj.fontSize(titleFontSize);
            }

            // Subtitle - larger as well and proportionate to title
            let subtitleObj = null;
            if (parsedSlides.cover?.subtitle) {
                let subtitleFont = Math.min(56, Math.max(20, Math.floor(titleFontSize * 0.55)));
                subtitleObj = new window.Konva.Text({
                    x: rightX,
                    y: 0,
                    text: parsedSlides.cover.subtitle,
                    fontSize: subtitleFont,
                    fontFamily: '"Nunito", Arial',
                    fill: '#ffb3ec',
                    width: rightWidth,
                    align: 'left',
                    lineHeight: 1.2,
                    shadowColor: 'rgba(0,0,0,0.35)',
                    shadowBlur: 8,
                    shadowOffset: { x: 0, y: 4 },
                    shadowOpacity: 1
                    ,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });

                // If subtitle too tall, reduce font
                const maxSubH = Math.max(sh * 0.28, titleObj.height());
                while (subtitleObj.height() > maxSubH && subtitleObj.fontSize() > 12) {
                    subtitleObj.fontSize(subtitleObj.fontSize() - 1);
                }
            }

            // Compute vertical centering for the title/subtitle block
            const blockHeight = Math.max(titleObj.height(), subtitleObj ? subtitleObj.height() : 0);
            const underlineHeight = 8;
            const paddingBetween = 18;
            const totalBlock = blockHeight + paddingBetween + underlineHeight;
            const startY = Math.round((sh - totalBlock) / 2);

            titleObj.y(startY);
            if (subtitleObj) subtitleObj.y(startY);

            coverLayer.add(titleObj);
            if (subtitleObj) coverLayer.add(subtitleObj);

            // Underline below the title (safe using measured height)
            const lineY = startY + titleObj.height() + paddingBetween;
            coverLayer.add(new window.Konva.Rect({
                x: leftX,
                y: lineY,
                width: Math.min(420, leftWidth),
                height: underlineHeight,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: Math.min(420, leftWidth), y: 0 },
                fillLinearGradientColorStops: [0, '#ff73c6', 0.5, '#b06dff', 1, '#ff9ad5'],
                cornerRadius: 4,
                shadowColor: '#ff9ad5',
                shadowBlur: 14,
                shadowOpacity: 0.95
            }));

            // Background image (behind decorations)
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    const imgRatio = imgObj.width / imgObj.height;
                    const stageRatio = sw / sh;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > stageRatio) { drawH = sh; drawW = imgObj.width * (sh / imgObj.height); drawX = (sw - drawW) / 2; drawY = 0; } else { drawW = sw; drawH = imgObj.height * (sw / imgObj.width); drawX = 0; drawY = (sh - drawH) / 2; }
                    const bgLayer = new window.Konva.Layer();
                    bgLayer.add(new window.Konva.Image({ image: imgObj, x: drawX, y: drawY, width: drawW, height: drawH, opacity: 0.35, pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides) }));
                    // Soft overlay to blend
                    bgLayer.add(new window.Konva.Rect({ x: 0, y: 0, width: sw, height: sh, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: sw, y: sh }, fillLinearGradientColorStops: [0, 'rgba(90,10,120,0.5)', 1, 'rgba(20,4,32,0.6)'] }));
                    coverStage.removeChildren();
                    coverStage.add(bgLayer);
                    addDecorations(coverLayer, sw, sh, 0, true);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                addDecorations(coverLayer, sw, sh, 0, true);
                coverStage.add(coverLayer); coverStage.draw();
            }

            // CONTENT SLIDES
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();

                // Background
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: h,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: w, y: h },
                    fillLinearGradientColorStops: bgGradientStops
                }));
                // Radial subtle glow
                layer.add(new window.Konva.Circle({
                    x: w * 0.65, y: h * 0.55, radius: Math.max(w, h) * 0.55,
                    fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0,
                    fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: Math.max(w, h) * 0.55,
                    fillRadialGradientColorStops: [0, 'rgba(255,120,230,0.28)', 0.5, 'rgba(120,40,150,0.15)', 1, 'rgba(30,5,45,0)']
                }));

                // Top bar
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: 80,
                    fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 80 },
                    fillLinearGradientColorStops: [0, 'rgba(255,170,240,0.25)', 1, 'rgba(255,170,240,0.08)'],
                    shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 18, shadowOffset: { x: 0, y: 4 }, shadowOpacity: 1
                }));
                // Side ribbon
                layer.add(new window.Konva.Rect({
                    x: 0, y: 80, width: 8, height: h - 160,
                    fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: h - 160 },
                    fillLinearGradientColorStops: [0, '#ff73c6', 0.5, '#9340ff', 1, '#ff9ad5']
                }));

                const slideData = parsedSlides.slides[i - 1];
                const titleY = 24;

                // Overflow protection: reduce title font size until it fits the nav bar area (keep one line)
                let titleFontSize = 40;
                const minTitleFont = 12;
                const maxTitleHeight = 52; // available vertical space for the title
                let titleObj = new window.Konva.Text({
                    x: 90,
                    y: titleY,
                    text: slideData.title || 'Slide',
                    fontSize: titleFontSize,
                    fontFamily: '"Nunito", "Montserrat", Arial',
                    fontStyle: 'bold',
                    fill: '#ffd7f2',
                    width: w - 180,
                    align: 'left',
                    shadowColor: 'rgba(0,0,0,0.45)',
                    shadowBlur: 10,
                    shadowOffset: { x: 0, y: 3 },
                    shadowOpacity: 1
                    ,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                });

                while (titleObj.height() > maxTitleHeight && titleFontSize > minTitleFont) {
                    titleFontSize -= 2;
                    titleObj.fontSize(titleFontSize);
                }

                layer.add(titleObj);

                // Underline positioned dynamically below the measured title
                layer.add(new window.Konva.Rect({
                    x: 90,
                    y: titleObj.y() + titleObj.height() + 8,
                    width: 230,
                    height: 5,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 230, y: 0 },
                    fillLinearGradientColorStops: [0, '#ff73c6', 0.5, '#b06dff', 1, '#ff9ad5'],
                    cornerRadius: 2,
                    shadowColor: '#ff9ad5',
                    shadowBlur: 8,
                    shadowOpacity: 0.8
                }));

                // Content blocks
                const content = Array.isArray(slideData.content) ? slideData.content : [];
                const blockWidth = w - 380;
                const blockGap = 14;
                const minBlockHeight = 60;
                if (content.length > 0) {
                    let fontSize = 22;
                    let finalBlockHeight = minBlockHeight;
                    let fits = false;
                    while (fontSize >= 14 && !fits) {
                        let maxH = 0;
                        content.forEach((txt, idx) => {
                            const temp = new window.Konva.Text({ text: txt, fontSize, fontFamily: '"Nunito", Arial', width: blockWidth - 120, lineHeight: 1.35, pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                            const tH = temp.height();
                            maxH = Math.max(maxH, Math.max(minBlockHeight, tH + 32));
                        });
                        const total = maxH * content.length + blockGap * (content.length - 1);
                        const avail = h - 120 - 140;
                        if (total <= avail) { fits = true; finalBlockHeight = maxH; } else { fontSize -= 2; }
                    }
                    if (!fits) {
                        const avail = h - 120 - 140;
                        finalBlockHeight = Math.max(minBlockHeight, Math.floor((avail - blockGap * (content.length - 1)) / content.length));
                        fontSize = 14;
                    }
                    const totalHeight = finalBlockHeight * content.length + blockGap * (content.length - 1);
                    let y = (h / 2) - totalHeight / 2 + 30;
                    content.forEach((txt, idx) => {
                        const color = kawaiiPalette[idx % kawaiiPalette.length];
                        // Card
                        layer.add(new window.Konva.Rect({
                            x: 90, y, width: blockWidth, height: finalBlockHeight,
                            fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: finalBlockHeight },
                            fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.12)', 1, 'rgba(255,255,255,0.05)'],
                            cornerRadius: 24,
                            shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 15, shadowOffset: { x: 0, y: 5 }, shadowOpacity: 1,
                            stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1
                        }));
                        // Accent bar
                        layer.add(new window.Konva.Rect({ x: 90, y, width: 8, height: finalBlockHeight, fill: color, cornerRadius: [24, 0, 0, 24] }));
                        // Icon bubble
                        layer.add(new window.Konva.Circle({ x: 130, y: y + finalBlockHeight / 2, radius: 22, fill: color, shadowColor: color, shadowBlur: 10, shadowOffset: { x: 0, y: 3 }, shadowOpacity: 0.5 }));
                        layer.add(new window.Konva.Text({ x: 110, y: y + finalBlockHeight / 2 - 12, text: (idx + 1).toString(), fontSize: 22, fontFamily: '"Nunito", Arial', fontStyle: 'bold', fill: '#fff', width: 40, align: 'center', pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined }));
                        // Text
                        const tempT = new window.Konva.Text({ text: txt, fontSize, fontFamily: '"Nunito", Arial', width: blockWidth - 140, lineHeight: 1.35, pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                        const tH = tempT.height();
                        layer.add(new window.Konva.Text({
                            x: 170, y: y + (finalBlockHeight - tH) / 2,
                            text: txt,
                            fontSize,
                            fontFamily: '"Nunito", Arial',
                            fill: '#ffe6f7',
                            width: blockWidth - 140,
                            align: 'left',
                            lineHeight: 1.35,
                            shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 4, shadowOffset: { x: 0, y: 2 }, shadowOpacity: 1,
                            pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        }));
                        y += finalBlockHeight + blockGap;
                    });
                }

                // Slide image (right side)
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                stage.add(layer); stage.draw();
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Use a clipped Group so the original image aspect ratio is preserved
                            // while the visible area is a rounded square (cover behavior).
                            const frameSize = 220;
                            const frameX = w - 300;
                            const frameY = Math.max(120, h / 2 - 110) - 30;
                            const clipRadius = 24;

                            // decorative frame background (un-clipped) placed beneath the clipped image
                            const framePadding = 14; // make the glass/frame slightly larger than the clipped image so shadow/stroke shows
                            layer.add(new window.Konva.Rect({
                                x: frameX - framePadding,
                                y: frameY - framePadding,
                                width: frameSize + framePadding * 2,
                                height: frameSize + framePadding * 2,
                                fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: frameSize + framePadding * 2, y: frameSize + framePadding * 2 },
                                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.18)', 1, 'rgba(255,255,255,0.06)'],
                                cornerRadius: Math.max(28 + framePadding / 2, 28),
                                shadowColor: 'rgba(0,0,0,0.38)', shadowBlur: 22, shadowOffset: { x: 0, y: 10 }, shadowOpacity: 1,
                                stroke: 'rgba(255,255,255,0.26)', strokeWidth: 2
                            }));

                            const imgGroup = new window.Konva.Group({
                                x: frameX,
                                y: frameY,
                                clipFunc: function (ctx) {
                                    const fs = frameSize, r = clipRadius;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(fs - r, 0);
                                    ctx.quadraticCurveTo(fs, 0, fs, r);
                                    ctx.lineTo(fs, fs - r);
                                    ctx.quadraticCurveTo(fs, fs, fs - r, fs);
                                    ctx.lineTo(r, fs);
                                    ctx.quadraticCurveTo(0, fs, 0, fs - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // compute cover scaling so image fills the frame and is centered
                            const scale = Math.max(frameSize / imgObj.width, frameSize / imgObj.height);
                            const drawW = Math.round(imgObj.width * scale);
                            const drawH = Math.round(imgObj.height * scale);
                            const imgX = Math.round((frameSize - drawW) / 2);
                            const imgY = Math.round((frameSize - drawH) / 2);

                            imgGroup.add(new window.Konva.Image({
                                image: imgObj,
                                x: imgX, y: imgY,
                                width: drawW, height: drawH,
                                opacity: 0.95,
                                shadowColor: 'rgba(0,0,0,0.35)', shadowBlur: 18, shadowOffset: { x: 0, y: 6 }, shadowOpacity: 1,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            }));

                            layer.add(imgGroup);
                            addDecorations(layer, w, h, i * 7 + 3, false); // Different decorations per slide using seed
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { addDecorations(layer, w, h, i * 7 + 3, false); stage.draw(); res(); };
                    }));
                    imgObj.src = base64;
                } else {
                    addDecorations(layer, w, h, i * 7 + 3, false);
                    stage.draw();
                }
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderPurpleGlass(stages, parsedSlides, slideImagesResult) {
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];
            // Cover/title slide (stage index 0)
            const coverStage = stages[0];
            const coverLayer = new window.Konva.Layer();
            const sw = coverStage.width();
            const sh = coverStage.height();
            // --- Ultra-modern multi-gradient background with overlays ---
            const primaryGradient = new window.Konva.Rect({
                x: 0, y: 0,
                width: sw,
                height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#667eea', 0.3, '#764ba2', 0.7, '#f093fb', 1, '#f5576c'],
                opacity: 0.4  // Reduced opacity so it acts as overlay instead of background
            });
            coverLayer.add(primaryGradient);
            // Geometric overlay patterns
            const patterns = [
                { x: sw * 0.1, y: sh * 0.1, size: 80, rotation: 45, opacity: 0.05 },
                { x: sw * 0.8, y: sh * 0.2, size: 60, rotation: -30, opacity: 0.08 },
                { x: sw * 0.9, y: sh * 0.8, size: 100, rotation: 15, opacity: 0.06 },
                { x: sw * 0.15, y: sh * 0.7, size: 45, rotation: 75, opacity: 0.07 }
            ];
            patterns.forEach(pattern => {
                coverLayer.add(new window.Konva.RegularPolygon({
                    x: pattern.x,
                    y: pattern.y,
                    sides: 6,
                    radius: pattern.size,
                    fill: '#ffffff',
                    opacity: pattern.opacity,
                    rotation: pattern.rotation,
                }));
            });
            // --- Dynamic top navigation bar with glass effect ---
            coverLayer.add(new window.Konva.Rect({
                x: 0,
                y: 0,
                width: sw,
                height: 80,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 0, y: 80 },
                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0.1)'],
                shadowColor: 'rgba(0,0,0,0.15)',
                shadowBlur: 20,
                shadowOffset: { x: 0, y: 4 },
                shadowOpacity: 1,
            }));
            // Side accent bar
            coverLayer.add(new window.Konva.Rect({
                x: 0,
                y: 80,
                width: 8,
                height: sh - 160,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 0, y: sh - 160 },
                fillLinearGradientColorStops: [0, '#ff6b6b', 0.5, '#4ecdc4', 1, '#45b7d1'],
            }));
            // Central focus circle with glow effect
            coverLayer.add(new window.Konva.Circle({
                x: sw * 0.75,
                y: sh * 0.4,
                radius: 120,
                fillRadialGradientStartPoint: { x: 0, y: 0 },
                fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 },
                fillRadialGradientEndRadius: 120,
                fillRadialGradientColorStops: [0, 'rgba(255,255,255,0.3)', 0.7, 'rgba(255,255,255,0.1)', 1, 'rgba(255,255,255,0.05)'],
                shadowColor: 'rgba(255,255,255,0.5)',
                shadowBlur: 40,
                shadowOffset: { x: 0, y: 0 },
                shadowOpacity: 1,
            }));
            // Floating geometric elements
            [
                { x: sw * 0.15, y: sh * 0.25, sides: 3, radius: 25, color: '#ff6b6b' },
                { x: sw * 0.85, y: sh * 0.15, sides: 4, radius: 30, color: '#4ecdc4' },
                { x: sw * 0.1, y: sh * 0.8, sides: 6, radius: 35, color: '#45b7d1' },
                { x: sw * 0.9, y: sh * 0.75, sides: 8, radius: 20, color: '#f093fb' }
            ].forEach(shape => {
                coverLayer.add(new window.Konva.RegularPolygon({
                    x: shape.x,
                    y: shape.y,
                    sides: shape.sides,
                    radius: shape.radius,
                    fill: shape.color,
                    opacity: 0.7,
                    shadowColor: shape.color,
                    shadowBlur: 15,
                    shadowOffset: { x: 0, y: 5 },
                    shadowOpacity: 0.4,
                }));
            });
            // Main title
            const titleText = parsedSlides.cover?.title || (window.Lang ? Lang.get('professionalDefaultTitle') : 'Professional SlideForge');
            const titleFontSize = Math.min(64, Math.max(32, sw * 0.06));
            coverLayer.add(new window.Konva.Text({
                x: 60,
                y: sh * 0.2,
                text: titleText,
                fontSize: titleFontSize,
                fontFamily: 'Montserrat, Arial',
                fontStyle: 'bold',
                fill: '#ffffff',
                width: sw * 0.8,
                align: 'left',
                shadowColor: 'rgba(0,0,0,0.3)',
                shadowBlur: 8,
                shadowOffset: { x: 0, y: 4 },
                shadowOpacity: 1,
                lineHeight: 1.2,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            }));
            // Subtitle
            if (parsedSlides.cover?.subtitle) {
                coverLayer.add(new window.Konva.Text({
                    x: 60,
                    y: sh * 0.2 + titleFontSize + 300,
                    text: parsedSlides.cover.subtitle,
                    fontSize: 28,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: 'normal',
                    fill: 'rgba(255,255,255,0.9)',
                    width: sw * 0.8,
                    align: 'left',
                    shadowColor: 'rgba(0,0,0,0.2)',
                    shadowBlur: 4,
                    shadowOffset: { x: 0, y: 2 },
                    shadowOpacity: 1,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                }));
            }
            // Cover image (optional, as background) - load first so decorations are on top
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // Scale and center image to fill background without deforming (like renderClassic)
                    const imgRatio = imgObj.width / imgObj.height;
                    const stageRatio = sw / sh;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > stageRatio) {
                        drawH = sh;
                        drawW = imgObj.width * (sh / imgObj.height);
                        drawX = (sw - drawW) / 2;
                        drawY = 0;
                    } else {
                        drawW = sw;
                        drawH = imgObj.height * (sw / imgObj.width);
                        drawX = 0;
                        drawY = (sh - drawH) / 2;
                    }

                    // Create a new layer for the background image (insert before existing layers)
                    const bgLayer = new window.Konva.Layer();

                    // Add the background image
                    const coverImg = new window.Konva.Image({
                        image: imgObj,
                        x: drawX,
                        y: drawY,
                        width: drawW,
                        height: drawH,
                        opacity: 1.0, // Full opacity for the background image
                        pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides)
                    });
                    bgLayer.add(coverImg);

                    // Add overlay gradient to blend with purple glass theme
                    const overlayGradient = new window.Konva.Rect({
                        x: 0, y: 0, width: sw, height: sh,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: sw, y: sh },
                        fillLinearGradientColorStops: [0, 'rgba(102,126,234,0.3)', 0.3, 'rgba(118,75,162,0.4)', 0.7, 'rgba(240,147,251,0.3)', 1, 'rgba(245,87,108,0.4)']
                    });
                    bgLayer.add(overlayGradient);

                    // Insert background layer behind the existing decoration layer
                    coverStage.removeChildren();
                    coverStage.add(bgLayer);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                // No image, just add decoration layer
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            // Call-to-action accent line
            coverLayer.add(new window.Konva.Rect({
                x: 60,
                y: sh * 0.65,
                width: 200,
                height: 4,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: 200, y: 0 },
                fillLinearGradientColorStops: [0, '#ff6b6b', 0.5, '#4ecdc4', 1, '#45b7d1'],
                cornerRadius: 2,
            }));
            // Content slides
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();
                // --- Ultra-modern multi-gradient background with overlays ---
                const primaryGradient = new window.Konva.Rect({
                    x: 0, y: 0,
                    width: w,
                    height: h,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: w, y: h },
                    fillLinearGradientColorStops: [0, '#667eea', 0.3, '#764ba2', 0.7, '#f093fb', 1, '#f5576c'],
                });
                layer.add(primaryGradient);
                // Geometric overlay patterns
                const patterns = [
                    { x: w * 0.1, y: h * 0.1, size: 80, rotation: 45, opacity: 0.05 },
                    { x: w * 0.8, y: h * 0.2, size: 60, rotation: -30, opacity: 0.08 },
                    { x: w * 0.9, y: h * 0.8, size: 100, rotation: 15, opacity: 0.06 },
                    { x: w * 0.15, y: h * 0.7, size: 45, rotation: 75, opacity: 0.07 }
                ];
                patterns.forEach(pattern => {
                    layer.add(new window.Konva.RegularPolygon({
                        x: pattern.x,
                        y: pattern.y,
                        sides: 6,
                        radius: pattern.size,
                        fill: '#ffffff',
                        opacity: pattern.opacity,
                        rotation: pattern.rotation,
                    }));
                });
                // --- Dynamic top navigation bar with glass effect ---
                layer.add(new window.Konva.Rect({
                    x: 0,
                    y: 0,
                    width: w,
                    height: 80,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 0, y: 80 },
                    fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0.1)'],
                    shadowColor: 'rgba(0,0,0,0.15)',
                    shadowBlur: 20,
                    shadowOffset: { x: 0, y: 4 },
                    shadowOpacity: 1,
                }));
                // Side accent bar
                layer.add(new window.Konva.Rect({
                    x: 0,
                    y: 80,
                    width: 8,
                    height: h - 160,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 0, y: h - 160 },
                    fillLinearGradientColorStops: [0, '#ff6b6b', 0.5, '#4ecdc4', 1, '#45b7d1'],
                }));
                // Title in nav bar
                const slideData = parsedSlides.slides[i - 1];
                const titleY = 25;
                layer.add(new window.Konva.Text({
                    x: 80,
                    y: titleY,
                    text: slideData.title || (window.Lang ? Lang.get('contentOverviewTitle') : 'Content Overview'),
                    fontSize: 36,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: 'bold',
                    fill: '#ffffff',
                    width: w - 160,
                    align: 'left',
                    shadowColor: 'rgba(0,0,0,0.4)',
                    shadowBlur: 8,
                    shadowOffset: { x: 0, y: 2 },
                    shadowOpacity: 1,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                }));
                // Dynamic gradient underline
                const underlineY = titleY + 42;
                layer.add(new window.Konva.Rect({
                    x: 80,
                    y: underlineY,
                    width: 250,
                    height: 4,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 250, y: 0 },
                    fillLinearGradientColorStops: [0, '#ff6b6b', 0.5, '#4ecdc4', 1, '#45b7d1'],
                    cornerRadius: 2,
                    shadowColor: 'rgba(255,255,255,0.4)',
                    shadowBlur: 6,
                    shadowOffset: { x: 0, y: 0 },
                    shadowOpacity: 1,
                }));
                // Content blocks (cards)
                const slideCenter = h / 2;
                const minBlockHeight = 60;
                const blockGap = 15;
                // Reserve space on the right for the (possibly present) doubled sidebar image
                const expectedSideBase = 180; // matches image base used elsewhere
                const expectedSideImgW = expectedSideBase * 2; // double-size image
                const sideRightInset = 80; // same inset used for image placement
                const sideGap = 40; // gap between content area and the side image/frame
                const reservedRight = (slideImagesResult?.slideImages?.[i - 1]) ? (expectedSideImgW + sideRightInset + sideGap) : 400;
                const blockWidth = Math.max(220, w - reservedRight);
                if (Array.isArray(slideData.content) && slideData.content.length > 0) {
                    const totalGaps = (slideData.content.length - 1) * blockGap;
                    let fontSize = 22;
                    let finalBlockHeight = minBlockHeight;
                    let contentFits = false;
                    while (fontSize >= 14 && !contentFits) {
                        let maxRequiredHeight = 0;
                        slideData.content.forEach((txt, idx) => {
                            const tempText = new window.Konva.Text({
                                text: txt,
                                fontSize: fontSize,
                                fontFamily: 'Montserrat, Arial',
                                width: blockWidth - 120,
                                lineHeight: 1.3,
                                pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                            });
                            const textHeight = tempText.height();
                            const requiredHeight = Math.max(minBlockHeight, textHeight + 30);
                            maxRequiredHeight = Math.max(maxRequiredHeight, requiredHeight);
                        });
                        const totalRequired = maxRequiredHeight * slideData.content.length + totalGaps;
                        const availableSpace = h - 100 - 120;
                        if (totalRequired <= availableSpace) {
                            contentFits = true;
                            finalBlockHeight = maxRequiredHeight;
                        } else {
                            fontSize -= 2;
                        }
                    }
                    if (!contentFits) {
                        const availableSpace = h - 100 - 120;
                        finalBlockHeight = Math.max(minBlockHeight, Math.floor((availableSpace - totalGaps) / slideData.content.length));
                        fontSize = 14;
                    }
                    const totalContentHeight = finalBlockHeight * slideData.content.length + totalGaps;
                    let y = slideCenter - (totalContentHeight / 2);
                    slideData.content.forEach((txt, idx) => {
                        const cardColors = [
                            { bg: 'rgba(255,107,107,0.15)', accent: '#ff6b6b', icon: '●' },
                            { bg: 'rgba(78,205,196,0.15)', accent: '#4ecdc4', icon: '▲' },
                            { bg: 'rgba(69,183,209,0.15)', accent: '#45b7d1', icon: '■' },
                            { bg: 'rgba(240,147,251,0.15)', accent: '#f093fb', icon: '♦' }
                        ];
                        const cardStyle = cardColors[idx % cardColors.length];
                        // Card background
                        layer.add(new window.Konva.Rect({
                            x: 80,
                            y,
                            width: blockWidth,
                            height: finalBlockHeight,
                            fillLinearGradientStartPoint: { x: 0, y: 0 },
                            fillLinearGradientEndPoint: { x: 0, y: finalBlockHeight },
                            fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0.1)'],
                            cornerRadius: 20,
                            shadowColor: 'rgba(0,0,0,0.15)',
                            shadowBlur: 15,
                            shadowOffset: { x: 0, y: 5 },
                            shadowOpacity: 1,
                            stroke: 'rgba(255,255,255,0.3)',
                            strokeWidth: 1,
                        }));
                        // Accent border
                        layer.add(new window.Konva.Rect({
                            x: 80,
                            y,
                            width: 6,
                            height: finalBlockHeight,
                            fill: cardStyle.accent,
                            cornerRadius: [20, 0, 0, 20],
                        }));
                        // Content number/icon
                        layer.add(new window.Konva.Circle({
                            x: 120,
                            y: y + finalBlockHeight / 2,
                            radius: 20,
                            fill: cardStyle.accent,
                            shadowColor: cardStyle.accent,
                            shadowBlur: 10,
                            shadowOffset: { x: 0, y: 3 },
                            shadowOpacity: 0.4,
                        }));
                        layer.add(new window.Konva.Text({
                            x: 100,
                            y: y + finalBlockHeight / 2 - 10,
                            text: (idx + 1).toString(),
                            fontSize: 20,
                            fontFamily: 'Montserrat, Arial',
                            fontStyle: 'bold',
                            fill: '#ffffff',
                            width: 40,
                            align: 'center',
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        }));
                        // Content text
                        const textObj = new window.Konva.Text({
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: blockWidth - 120,
                            lineHeight: 1.3,
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        });
                        const textHeight = textObj.height();
                        layer.add(new window.Konva.Text({
                            x: 160,
                            y: y + (finalBlockHeight - textHeight) / 2,
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            fontStyle: 'normal',
                            fill: '#ffffff',
                            width: blockWidth - 120,
                            align: 'left',
                            lineHeight: 1.3,
                            shadowColor: 'rgba(0,0,0,0.2)',
                            shadowBlur: 3,
                            shadowOffset: { x: 0, y: 1 },
                            shadowOpacity: 1,
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        }));
                        y += finalBlockHeight + blockGap;
                    });
                }
                // Sidebar image
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                stage.add(layer); // Always add layer before image load
                stage.draw();     // Always draw before image load
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Image frame background (replaced with double-size masked image)
                            const baseSmall = 180; // original small image size
                            const targetW = baseSmall * 2; // double size as requested
                            const targetH = baseSmall * 2;
                            const rightInset = 80; // keep similar right-side spacing as before

                            // Position the image block aligned to the right column
                            const shiftRight = 100; // move image and frame 100px to the right
                            const imgX = Math.max(w - targetW - rightInset, 60) + shiftRight;
                            const imgY = Math.max(120, Math.round(h / 2 - targetH / 2));

                            // Decorative frame under the image that is 8px bigger on every side
                            const framePad = 8; // 8px larger in every direction
                            const frameX = imgX - framePad;
                            const frameY = imgY - framePad;
                            const frameW = targetW + framePad * 2;
                            const frameH = targetH + framePad * 2;

                            const glass = new window.Konva.Rect({
                                x: frameX,
                                y: frameY,
                                width: frameW,
                                height: frameH,
                                fillLinearGradientStartPoint: { x: 0, y: 0 },
                                fillLinearGradientEndPoint: { x: frameW, y: frameH },
                                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.22)', 1, 'rgba(255,255,255,0.06)'],
                                cornerRadius: 30,
                                shadowColor: 'rgba(0,0,0,0.22)',
                                shadowBlur: 22,
                                shadowOffset: { x: 0, y: 10 },
                                shadowOpacity: 1,
                                stroke: 'rgba(255,255,255,0.2)',
                                strokeWidth: 2
                            });

                            // Clipped group for visible image area (exact target size)
                            const clipRadius = 24;
                            const imgGroup = new window.Konva.Group({
                                x: imgX, y: imgY, clipFunc: function (ctx) {
                                    const fw = targetW, fh = targetH, r = clipRadius;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(fw - r, 0);
                                    ctx.quadraticCurveTo(fw, 0, fw, r);
                                    ctx.lineTo(fw, fh - r);
                                    ctx.quadraticCurveTo(fw, fh, fw - r, fh);
                                    ctx.lineTo(r, fh);
                                    ctx.quadraticCurveTo(0, fh, 0, fh - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Cover-scale the image to fill the clipped frame without squishing
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(targetW / imgW, targetH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const offsetX = Math.round((targetW - drawW) / 2);
                            const offsetY = Math.round((targetH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: offsetX,
                                y: offsetY,
                                width: drawW,
                                height: drawH,
                                opacity: 0.98,
                                shadowColor: 'rgba(0,0,0,0.22)',
                                shadowBlur: 18,
                                shadowOpacity: 0.2,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Add in z-order: glass under, clipped image above
                            layer.add(glass);
                            imgGroup.add(imageNode);
                            layer.add(imgGroup);

                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }
            }
            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderWilderness(stages, parsedSlides, slideImagesResult) {
        // National Geographic inspired: bold yellow frame, deep natural greens, earthy overlays, photo-centric.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // ---------------- Cover Slide ----------------
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Base deep forest gradient + subtle dusk overlay
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#0b2e20', 0.35, '#164a2f', 0.75, '#2f5d30', 1, '#4d6b2f']
            }));
            // Atmospheric mist layers (soft translucent whites)
            for (let i = 0; i < 3; i++) {
                coverLayer.add(new window.Konva.Rect({ x: -50 + i * 80, y: sh * 0.15 + i * 90, width: sw + 100, height: 180, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: sw, y: 0 }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0)', 0.5, 'rgba(255,255,255,0.06)', 1, 'rgba(255,255,255,0)'], opacity: 0.5 }));
            }
            // Signature National Geographic yellow vertical frame bar
            coverLayer.add(new window.Konva.Rect({ x: 48, y: 48, width: sw - 96, height: sh - 96, stroke: '#FFCC00', strokeWidth: 10, cornerRadius: 4 }));


            // Floating leaf-like polygons (abstract nature motifs)
            const leafColors = ['#6b8e23', '#88a94b', '#3d5a2a', '#537f37'];
            for (let i = 0; i < 8; i++) {
                const lx = Math.random() * sw * 0.8 + sw * 0.1;
                const ly = Math.random() * sh * 0.7 + sh * 0.15;
                const sides = 5 + (i % 2); // 5 or 6
                const radius = 18 + Math.random() * 34;
                coverLayer.add(new window.Konva.RegularPolygon({
                    x: lx, y: ly, sides, radius,
                    fill: leafColors[i % leafColors.length], opacity: 0.18,
                    rotation: Math.random() * 360,
                    shadowColor: '#000', shadowBlur: 15, shadowOpacity: 0.15
                }));
            }

            // Title, line, and subtitle (always on top, with line between title and subtitle, and nice gap)
            // Defer adding these until after all other coverLayer.add() calls
            const title = parsedSlides.cover?.title || 'Into The Wilderness';
            let titleFontSize = Math.min(80, Math.max(48, sw * 0.06));
            const minTitleFontSize = 24;
            const titleX = 110;
            const titleY = sh * 0.25;
            // Reserve space for the expected cover image so title/subtitle do not overlap it when it is added
            const expectedImageWidth = Math.round(sw * 0.38);
            const expectedImageX = Math.round(sw - expectedImageWidth - 140); // same calc used in onload
            const maxTextWidth = Math.max(120, expectedImageX - titleX - 24); // ensure a sane minimum
            const titleWidth = Math.min(sw * 0.55, maxTextWidth);
            const subtitleFontSize = 30;
            const subtitleGap = 36; // px gap between title and subtitle
            const lineGap = 18; // px gap below title before line
            // Title node with overflow fix
            let titleNode = new window.Konva.Text({
                x: titleX, y: titleY, width: titleWidth, text: title, fontSize: titleFontSize,
                fontFamily: 'Montserrat, Arial', fontStyle: '800', lineHeight: 1.1,
                fill: '#f5f5f2', shadowColor: '#000', shadowBlur: 14, shadowOpacity: 0.35,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Reduce font size if title does not fit in one line
            while ((titleNode.height() > titleNode.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                titleFontSize -= 2;
                titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth, text: title, fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '800', lineHeight: 1.1,
                    fill: '#f5f5f2', shadowColor: '#000', shadowBlur: 14, shadowOpacity: 0.35,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            }
            // Line node (between title and subtitle)
            const lineY = titleY + titleNode.height() + lineGap;
            const lineNode = new window.Konva.Rect({
                x: titleX, y: lineY, width: 260, height: 6, fill: '#FFCC00', cornerRadius: 3
            });
            // Subtitle node (below line, with gap)
            let subtitleNode = null;
            if (parsedSlides.cover?.subtitle) {
                const subtitleY = lineY + 6 + subtitleGap;
                const subtitleWidth = Math.min(sw * 0.5, titleWidth - 4); // keep subtitle within same reserved area
                subtitleNode = new window.Konva.Text({
                    x: titleX + 2, y: subtitleY, width: subtitleWidth,
                    text: parsedSlides.cover.subtitle, fontSize: subtitleFontSize, fontFamily: 'Montserrat, Arial', lineHeight: 1.3,
                    fill: '#e6e0c9', shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.3,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            }
            // Add overlays/text last to ensure on top (after all other coverLayer.add calls)

            // Add cover image and frame first, so overlays/text are always on top
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    const targetW = sw * 0.38;
                    const targetH = sh * 0.6;
                    const imgNode = new window.Konva.Image({
                        image: imgObj,
                        x: sw - targetW - 140,
                        y: sh * 0.22,
                        width: targetW,
                        height: targetH,
                        opacity: 0.9,
                        filters: [window.Konva.Filters.Brighten, window.Konva.Filters.Contrast],
                        brightness: 0.05,
                        contrast: 0.1,
                        cornerRadius: 20,
                        shadowColor: '#000', shadowBlur: 30, shadowOpacity: 0.35,
                        pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides)
                    });
                    coverLayer.add(new window.Konva.Rect({ x: imgNode.x() - 14, y: imgNode.y() - 14, width: targetW + 28, height: targetH + 28, stroke: '#FFCC00', strokeWidth: 6, cornerRadius: 26, opacity: 0.95 }));
                    coverLayer.add(imgNode);
                    // Add overlays/text last to ensure on top (after all other coverLayer.add calls)
                    coverLayer.add(titleNode);
                    coverLayer.add(lineNode);
                    if (subtitleNode) coverLayer.add(subtitleNode);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                // No image, just add overlays/text
                coverLayer.add(titleNode);
                coverLayer.add(lineNode);
                if (subtitleNode) coverLayer.add(subtitleNode);
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            // ---------------- Content Slides ----------------
            const margin = 70;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const w = stage.width();
                const h = stage.height();
                const layer = new window.Konva.Layer();

                // Background gradient forest canopy
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: h,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: w, y: h },
                    fillLinearGradientColorStops: [0, '#0e2d20', 0.4, '#1e442c', 0.75, '#305b33', 1, '#466c34']
                }));
                // Yellow frame
                layer.add(new window.Konva.Rect({ x: 30, y: 30, width: w - 60, height: h - 60, stroke: '#FFCC00', strokeWidth: 8, cornerRadius: 6 }));
                // Overlay mist band
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: 140, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 140 }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.25)', 1, 'rgba(255,255,255,0)'] }));

                const slideData = parsedSlides.slides[i - 1];
                const slideTitle = slideData?.title || `Slide ${i}`;
                let slideTitleFontSize = 44;
                const minSlideTitleFontSize = 18;
                const slideTitleX = margin + 10;
                const slideTitleY = 54;
                const slideTitleWidth = w - (margin + 10) * 2;
                let slideTitleObj = new window.Konva.Text({
                    x: slideTitleX,
                    y: slideTitleY,
                    width: slideTitleWidth,
                    text: slideTitle.toUpperCase(),
                    fontSize: slideTitleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#f2f2ef',
                    shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.35,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                });
                // Reduce font size if title does not fit in one line
                while ((slideTitleObj.height() > slideTitleObj.fontSize() * 1.5) && slideTitleFontSize > minSlideTitleFontSize) {
                    slideTitleFontSize -= 2;
                    slideTitleObj = new window.Konva.Text({
                        x: slideTitleX,
                        y: slideTitleY,
                        width: slideTitleWidth,
                        text: slideTitle.toUpperCase(),
                        fontSize: slideTitleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#0f172a',
                        shadowColor: '#000',
                        shadowBlur: 6,
                        shadowOpacity: 0.25,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                    });
                }
                layer.add(slideTitleObj);
                layer.add(new window.Konva.Rect({ x: margin + 10, y: slideTitleY + slideTitleObj.height() + 10, width: Math.min(340, slideTitleObj.width()), height: 6, fill: '#FFCC00', cornerRadius: 3 }));

                // Content bullets in field-note cards with comprehensive overflow fix
                const bullets = (slideData?.content || []).map(t => t.trim());
                // Give the content column a bit more width to reduce wrapping (closer to the image)
                const colWidth = w * 0.58; // increased from 0.52
                const blockGap = 14; // tighter gap between blocks
                const yellowOutline = 30; // margin for yellow outline
                const marginLeft = margin + 10;
                const maxBlockWidth = colWidth - 40;
                // Reserve space on the left for the badge (circle). We'll place text to the right and left-align it.
                const badgeArea = 100; // horizontal space reserved for badge and padding
                const textAreaX = Math.round(Math.max(72, badgeArea)); // x offset inside card for text start
                const contentWidth = Math.max(80, maxBlockWidth - textAreaX - 20); // measured text width inside card
                const lineColors = ['#6b8e23', '#88a94b', '#3d5a2a', '#a5b97a'];

                // Dynamically fit all text nodes with the same font size - overflow protection
                let fontSize = 24;
                let fits = false;
                let textHeights = [];
                let blockHeights = [];
                const minBlockHeight = 90; // reduced minimum to make cards tighter
                const textLineHeight = 1.2; // slightly denser
                const innerPadding = 24; // vertical padding inside each block

                // Calculate available vertical space (from current Y position to h - yellowOutline)
                const contentStartY = slideTitleY + slideTitleObj.height() + 10 + 6 + 20; // title + underline + gap
                const availableHeight = h - contentStartY - yellowOutline;

                // Reduce font size until all cards fit or we hit the minimum
                while (fontSize >= 14 && !fits) {
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: contentWidth,
                            lineHeight: textLineHeight,
                            pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    // block height includes measured text height + inner padding
                    blockHeights = textHeights.map(hh => Math.max(minBlockHeight, hh + innerPadding));
                    const totalHeight = blockHeights.reduce((a, b) => a + b, 0) + Math.max(0, bullets.length - 1) * blockGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }

                // If still doesn't fit, force minimum font size and recalc heights
                if (!fits) {
                    fontSize = 14;
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: contentWidth,
                            lineHeight: textLineHeight,
                            pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    blockHeights = textHeights.map(hh => Math.max(minBlockHeight, hh + innerPadding));
                }

                // Render the card groups using a Group offset so internal coordinates are simple
                let yCursor = contentStartY;
                const textX = textAreaX; // text starts to the right of the badge
                bullets.forEach((txt, idx) => {
                    const blockH = blockHeights[idx];
                    const blockY = yCursor;
                    const cardGroup = new window.Konva.Group({ x: marginLeft, y: blockY });

                    // Card background translucent parchment
                    cardGroup.add(new window.Konva.Rect({ x: 0, y: 0, width: maxBlockWidth, height: blockH, fill: 'rgba(255,255,245,0.08)', stroke: 'rgba(255,204,0,0.5)', strokeWidth: 2, cornerRadius: 18, shadowColor: '#000', shadowBlur: 12, shadowOpacity: 0.25 }));

                    // Lined paper effect
                    for (let ly = 18; ly < blockH - 18; ly += 20) {
                        cardGroup.add(new window.Konva.Line({ points: [20, ly, maxBlockWidth - 20, ly], stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }));
                    }

                    // Index badge leaf (positioned relative to group and vertically centered)
                    const badgeCenterY = Math.round(blockH / 2);
                    const badgeRadius = 30;
                    cardGroup.add(new window.Konva.Circle({ x: 48, y: badgeCenterY, radius: badgeRadius, fill: lineColors[idx % lineColors.length], shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.3 }));
                    const numStr = (idx + 1).toString();
                    const tmpBadgeText = new window.Konva.Text({ text: numStr, fontSize: Math.min(26, fontSize + 2), fontFamily: 'Montserrat, Arial', width: 52, align: 'center', pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                    const badgeTextY = Math.round(badgeCenterY - tmpBadgeText.height() / 2);
                    cardGroup.add(new window.Konva.Text({ x: 22, y: badgeTextY, width: 52, text: numStr, fontSize: Math.min(26, fontSize + 2), fontFamily: 'Montserrat, Arial', fontStyle: '700', fill: '#fff', align: 'center', pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined }));

                    // Content text left-aligned and vertically centered inside the card, positioned to the right of the badge
                    const tH = textHeights[idx];
                    const textY = Math.round((blockH - tH) / 2);
                    cardGroup.add(new window.Konva.Text({ x: textX, y: textY, width: contentWidth, text: txt, fontSize: fontSize, fontFamily: 'Montserrat, Arial', lineHeight: textLineHeight, fill: '#f2f2ef', align: 'left', shadowColor: '#000', shadowBlur: 4, shadowOpacity: 0.3, pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined }));

                    layer.add(cardGroup);
                    yCursor += blockH + blockGap;
                });

                // Right side image panel (polaroid stack effect)
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                const polaroidW = w - (margin + colWidth) - 120;
                const polaroidH = Math.min(h - 220, 420);
                const polyX = colWidth + margin + 70;
                const polyY = 180;
                // Stacked frames (even without image for style)
                for (let s = 0; s < 2; s++) {
                    layer.add(new window.Konva.Rect({ x: polyX + s * 18, y: polyY + s * 14, width: polaroidW, height: polaroidH, fill: '#fff', opacity: 0.05, stroke: '#FFCC00', strokeWidth: s === 0 ? 4 : 2, shadowColor: '#000', shadowBlur: 20, shadowOpacity: 0.25, rotation: s === 0 ? -2 : 3, cornerRadius: 14 }));
                }

                // Add layer before async
                stage.add(layer);
                stage.draw();

                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Place the picture nearly as big as the decorative polaroid frame but leave a visible border
                            const gap = 14; // visible gap so the decorative border shows
                            const frameX = polyX + gap;
                            const frameY = polyY + gap;
                            const frameW = Math.max(40, polaroidW - gap * 2);
                            const frameH = Math.max(40, polaroidH - gap * 2);
                            const cornerR = 12;

                            // Create a clipped group with a rounded-rect clip to preserve rounded corners
                            const imgGroup = new window.Konva.Group({
                                x: frameX, y: frameY, clipFunc: function (ctx) {
                                    const w = frameW, h = frameH, r = cornerR;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(w - r, 0);
                                    ctx.quadraticCurveTo(w, 0, w, r);
                                    ctx.lineTo(w, h - r);
                                    ctx.quadraticCurveTo(w, h, w - r, h);
                                    ctx.lineTo(r, h);
                                    ctx.quadraticCurveTo(0, h, 0, h - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Calculate scaling using 'cover' so the frame is filled without squishing
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(frameW / imgW, frameH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgX = Math.round((frameW - drawW) / 2);
                            const imgY = Math.round((frameH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgX,
                                y: imgY,
                                width: drawW,
                                height: drawH,
                                cornerRadius: cornerR,
                                shadowColor: '#000', shadowBlur: 20, shadowOpacity: 0.3,
                                filters: [window.Konva.Filters.Contrast, window.Konva.Filters.Brighten],
                                contrast: 0.05,
                                brightness: 0.03,
                                opacity: 0.92,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Yellow border overlay: add before the image so the image group/image node are added last and sit on top/clickable
                            layer.add(new window.Konva.Rect({ x: polyX + 10, y: polyY + 10, width: polaroidW - 20, height: polaroidH - 20, stroke: '#FFCC00', strokeWidth: 4, cornerRadius: 10, opacity: 0.85 }));

                            // Add clipped image above the decorative frames; image added last so it remains on top and selectable
                            layer.add(imgGroup);
                            imgGroup.add(imageNode);

                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Page number (earthy subdued)
                const pageNumLayer = new window.Konva.Layer();
                pageNumLayer.add(new window.Konva.Text({ x: w - 160, y: h - 80, text: i.toString(), fontSize: 60, fontFamily: 'Montserrat, Arial', fill: 'rgba(255,255,255,0.15)', shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.3, pw_id: undefined }));
                stage.add(pageNumLayer);
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderCorporate(stages, parsedSlides, slideImagesResult) {
        // Clean executive style: navy + blue accents, structured layout, safe async pattern.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // -------- Cover Slide --------
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Base gradient background (subtle diagonal)
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#0f172a', 0.45, '#1e293b', 1, '#0f172a']
            }));
            // Accent angled bands
            [
                { y: sh * 0.15, h: 160, from: '#1d4ed8', to: '#3b82f6', opacity: 0.18, skew: 20 },
                { y: sh * 0.5, h: 220, from: '#0ea5e9', to: '#1d4ed8', opacity: 0.12, skew: 14 }
            ].forEach(b => {
                const g = new window.Konva.Rect({
                    x: -sw * 0.25,
                    y: b.y,
                    width: sw * 1.5,
                    height: b.h,
                    rotation: b.skew,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: sw * 1.5, y: 0 },
                    fillLinearGradientColorStops: [0, b.from, 1, b.to],
                    opacity: b.opacity
                });
                coverLayer.add(g);
            });


            // Title and subtitle (ensure on top)
            const title = (parsedSlides.cover?.title || 'Corporate SlideForge');
            const titleFontSize = Math.min(72, Math.max(48, sw * 0.055));
            const titleY = sh * 0.28;
            const titleTextNode = new window.Konva.Text({
                x: sw * 0.1,
                y: titleY,
                width: sw * 0.65,
                text: title,
                fontSize: titleFontSize,
                fontFamily: 'Montserrat, Arial',
                fontStyle: '700',
                fill: '#f8fafc',
                lineHeight: 1.15,
                shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.3
                ,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Prepare subtitle and line, but add after all other elements
            let subtitleTextNode = null;
            let lineNode = null;
            if (parsedSlides.cover?.subtitle) {
                const subtitleFontSize = 30;
                const subtitleGap = 32; // px gap between title and subtitle
                const lineGap = 18; // px gap below title before line
                const lineY = titleY + titleTextNode.height() + lineGap;
                lineNode = new window.Konva.Rect({
                    x: sw * 0.1,
                    y: lineY,
                    width: 220,
                    height: 6,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 220, y: 0 },
                    fillLinearGradientColorStops: [0, '#3b82f6', 1, '#06b6d4'],
                    cornerRadius: 3
                });
                const subtitleY = lineY + 6 + subtitleGap;
                subtitleTextNode = new window.Konva.Text({
                    x: sw * 0.1,
                    y: subtitleY,
                    width: sw * 0.55,
                    text: parsedSlides.cover.subtitle,
                    fontSize: subtitleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fill: '#cbd5e1',
                    lineHeight: 1.3
                    ,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            } else {
                const lineY = titleY + titleTextNode.height() + 10;
                lineNode = new window.Konva.Rect({
                    x: sw * 0.1,
                    y: lineY,
                    width: 220,
                    height: 6,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 220, y: 0 },
                    fillLinearGradientColorStops: [0, '#3b82f6', 1, '#06b6d4'],
                    cornerRadius: 3
                });
            }

            // Add image and frame at the bottom of the layer stack (like brutalist)
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // Enlarge frame to better match the visual shape and make the image larger
                    const targetImgW = Math.min(sw * 0.42, sw * 0.5); // slightly larger than before, but capped
                    const targetImgH = Math.min(sh * 0.68, sh * 0.75);
                    const imgX = sw - targetImgW - 100;
                    const imgY = sh * 0.22;

                    // Outer decorative frame (slightly larger so stroke and shadow remain visible)
                    const framePadding = 18;
                    const outerX = imgX - framePadding;
                    const outerY = imgY - framePadding;
                    const outerW = Math.max(40, targetImgW + framePadding * 2);
                    const outerH = Math.max(40, targetImgH + framePadding * 2);

                    coverLayer.add(new window.Konva.Rect({ x: outerX, y: outerY, width: outerW, height: outerH, stroke: '#1d4ed8', strokeWidth: 6, cornerRadius: 32, opacity: 0.95 }));

                    // Create clipped group for the visible image area (leave a small gap so frame shows)
                    const gap = 14; // visible gap so decorative border shows
                    const frameX = outerX + gap;
                    const frameY = outerY + gap;
                    const frameW = Math.max(20, outerW - gap * 2);
                    const frameH = Math.max(20, outerH - gap * 2);
                    const cornerR = 24;

                    const imgGroup = new window.Konva.Group({
                        x: frameX, y: frameY, clipFunc: function (ctx) {
                            const w = frameW, h = frameH, r = cornerR;
                            ctx.beginPath();
                            ctx.moveTo(r, 0);
                            ctx.lineTo(w - r, 0);
                            ctx.quadraticCurveTo(w, 0, w, r);
                            ctx.lineTo(w, h - r);
                            ctx.quadraticCurveTo(w, h, w - r, h);
                            ctx.lineTo(r, h);
                            ctx.quadraticCurveTo(0, h, 0, h - r);
                            ctx.lineTo(0, r);
                            ctx.quadraticCurveTo(0, 0, r, 0);
                            ctx.closePath();
                        }
                    });

                    // Calculate scaling using 'cover' so the frame is filled without squishing
                    const imgW = imgObj.width || 1;
                    const imgH = imgObj.height || 1;
                    const scale = Math.max(frameW / imgW, frameH / imgH);
                    const drawW = Math.round(imgW * scale);
                    const drawH = Math.round(imgH * scale);
                    const imgInnerX = Math.round((frameW - drawW) / 2);
                    const imgInnerY = Math.round((frameH - drawH) / 2);

                    // Compute pw_id from cover data (no `slideData` is available in this scope)
                    const __pw_imageId_for_cover = SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides);
                    const imageNode = new window.Konva.Image({
                        image: imgObj,
                        x: imgInnerX,
                        y: imgInnerY,
                        width: drawW,
                        height: drawH,
                        cornerRadius: cornerR,
                        shadowColor: '#000', shadowBlur: 25, shadowOpacity: 0.3,
                        opacity: 0.9,
                        filters: [window.Konva.Filters.Brighten, window.Konva.Filters.Contrast],
                        brightness: 0.05,
                        contrast: 0.03,
                        pw_id: __pw_imageId_for_cover
                    });

                    // Add clipped image above the decorative frame (outer frame added earlier)
                    coverLayer.add(imgGroup);
                    imgGroup.add(imageNode);

                    // Finally add overlays/text on top
                    coverLayer.add(titleTextNode);
                    if (lineNode) coverLayer.add(lineNode);
                    if (subtitleTextNode) coverLayer.add(subtitleTextNode);

                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                // No image, just add overlays/text
                coverLayer.add(titleTextNode);
                if (lineNode) coverLayer.add(lineNode);
                if (subtitleTextNode) coverLayer.add(subtitleTextNode);
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            // -------- Content Slides --------
            const margin = 70;

            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const w = stage.width();
                const h = stage.height();
                const layer = new window.Konva.Layer();

                // Background base
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: '#f5f7fa' }));

                // Accent angled bands (cover-like) — vary slightly per slide
                (function addAccentBandsForSlide(index) {
                    const bandVariants = [
                        { from: '#1d4ed8', to: '#3b82f6', skew: 18 },
                        { from: '#0ea5e9', to: '#1d4ed8', skew: 14 },
                        { from: '#06b6d4', to: '#0891b2', skew: 22 }
                    ];
                    const v = bandVariants[(index - 1) % bandVariants.length];

                    const topY = h * (0.10 + ((index - 1) % 3) * 0.05);
                    const topH = 100 + ((index - 1) % 2) * 60;
                    const bottomY = h * (0.45 + ((index - 1) % 2) * 0.06);
                    const bottomH = 140 + ((index - 1) % 3) * 40;

                    const bands = [
                        { y: topY, h: topH, from: v.from, to: v.to, opacity: 0.07, skew: v.skew },
                        { y: bottomY, h: bottomH, from: v.to, to: v.from, opacity: 0.03, skew: Math.max(8, v.skew - 6) }
                    ];

                    bands.forEach(b => {
                        const g = new window.Konva.Rect({
                            x: -w * 0.25,
                            y: b.y,
                            width: w * 1.5,
                            height: b.h,
                            rotation: b.skew,
                            fillLinearGradientStartPoint: { x: 0, y: 0 },
                            fillLinearGradientEndPoint: { x: w * 1.5, y: 0 },
                            fillLinearGradientColorStops: [0, b.from, 1, b.to],
                            opacity: b.opacity
                        });
                        layer.add(g);
                    });
                })(i);

                // Top header band
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: 110,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: w, y: 0 },
                    fillLinearGradientColorStops: [0, '#1e3a8a', 1, '#1d4ed8']
                }));
                // Decorative thin bottom line of header
                layer.add(new window.Konva.Rect({ x: 0, y: 108, width: w, height: 2, fill: '#0ea5e9' }));

                const slideData = parsedSlides.slides[i - 1];
                const slideTitle = (slideData?.title || `Slide ${i}`);
                layer.add(new window.Konva.Text({
                    x: margin,
                    y: 32,
                    text: slideTitle,
                    fontSize: 42,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '600',
                    fill: '#ffffff',
                    shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.25,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                }));
                // Title underline accent
                layer.add(new window.Konva.Rect({ x: margin, y: 86, width: Math.min(320, slideTitle.length * 18), height: 6, fill: '#38bdf8', cornerRadius: 3 }));

                // Content text column (dynamic font sizing to fit, like renderClassic)
                const colWidth = w * 0.52;
                const marginTop = 140;
                const marginBottom = 60;
                const availableHeight = h - marginTop - marginBottom;
                const textNodes = (slideData?.content || []);
                let fontSize = 24; // match renderClassic default
                let fits = false;
                let textHeights = [];
                const lineHeight = 1.25;
                const betweenGap = 18;
                // Try to fit all text nodes, reduce font size if needed
                while (fontSize >= 14 && !fits) {
                    textHeights = textNodes.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: '  ' + txt,
                            fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: colWidth - 10,
                            lineHeight,
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        });
                        return temp.height();
                    });
                    const totalHeight = textHeights.reduce((a, b) => a + b, 0) + (textNodes.length - 1) * betweenGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }
                // Now render the text nodes with calculated font size and spacing
                let yCursor = marginTop;
                textNodes.forEach((txt, idx) => {
                    const textObj = new window.Konva.Text({
                        x: margin,
                        y: yCursor,
                        width: colWidth - 10,
                        text: '  ' + txt,
                        fontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight,
                        fill: '#1e293b',
                        pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                    });
                    layer.add(textObj);
                    yCursor += textObj.height() + betweenGap;
                });

                // Right side panel card (for image / visual)
                const panelX = colWidth + margin + 50;
                const panelW = w - panelX - margin;
                const panelY = 140;
                const panelH = h - panelY - 120;
                layer.add(new window.Konva.Rect({
                    x: panelX,
                    y: panelY,
                    width: panelW,
                    height: panelH,
                    fill: '#ffffff',
                    cornerRadius: 28,
                    shadowColor: '#0f172a', shadowBlur: 25, shadowOpacity: 0.12,
                    stroke: '#e2e8f0', strokeWidth: 2
                }));
                // Panel header bar
                layer.add(new window.Konva.Rect({ x: panelX, y: panelY, width: panelW, height: 64, fillLinearGradientStartPoint: { x: panelX, y: panelY }, fillLinearGradientEndPoint: { x: panelX + panelW, y: panelY }, fillLinearGradientColorStops: [0, '#1d4ed8', 1, '#2563eb'], cornerRadius: [28, 28, 0, 0] }));
                layer.add(new window.Konva.Text({ x: panelX + 28, y: panelY + 18, text: (window.Lang ? Lang.get('visualLabel') : 'Visual'), fontSize: 22, fontFamily: 'Montserrat, Arial', fontStyle: '600', fill: '#ffffff', pw_id: undefined }));

                // Add layer before async operations
                stage.add(layer);
                stage.draw();

                // Image load (optional)
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Build a frame that matches the visual panel area (header excluded)
                            const frameW = panelW - 56;
                            const frameH = panelH - 64 - 56; // header + padding
                            const frameX = panelX + 28; // center padding
                            const frameY = panelY + 64 + 28; // below header + top padding

                            // Outer decorative border (slightly larger so stroke is visible)
                            const borderPad = 8;
                            const outerX = frameX - borderPad;
                            const outerY = frameY - borderPad;
                            const outerW = frameW + borderPad * 2;
                            const outerH = frameH + borderPad * 2;

                            const cornerR = 16;

                            // Add a subtle outer border under the clipped image (keeps previous visual look)
                            layer.add(new window.Konva.Rect({ x: outerX, y: outerY, width: outerW, height: outerH, stroke: '#1d4ed8', strokeWidth: 2, cornerRadius: cornerR + 4, opacity: 0.8 }));

                            // Clipped group for rounded image area
                            const imgGroup = new window.Konva.Group({
                                x: frameX, y: frameY, clipFunc: function (ctx) {
                                    const w = frameW, h = frameH, r = cornerR;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(w - r, 0);
                                    ctx.quadraticCurveTo(w, 0, w, r);
                                    ctx.lineTo(w, h - r);
                                    ctx.quadraticCurveTo(w, h, w - r, h);
                                    ctx.lineTo(r, h);
                                    ctx.quadraticCurveTo(0, h, 0, h - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Scale image using 'cover' so it fills the frame without squishing
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(frameW / imgW, frameH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgInnerX = Math.round((frameW - drawW) / 2);
                            const imgInnerY = Math.round((frameH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgInnerX,
                                y: imgInnerY,
                                width: drawW,
                                height: drawH,
                                cornerRadius: cornerR,
                                shadowColor: '#0f172a', shadowBlur: 15, shadowOpacity: 0.3,
                                opacity: 0.96,
                                filters: [window.Konva.Filters.Brighten, window.Konva.Filters.Contrast],
                                brightness: 0.02,
                                contrast: 0.03,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Keep a subtle overlay stroke (matches previous overlay but now independent of image sizing)
                            // Add overlay before the image so the image itself is added last and remains on top/clickable.
                            layer.add(new window.Konva.Rect({ x: frameX - 8, y: frameY - 8, width: frameW + 16, height: frameH + 16, stroke: '#1d4ed8', strokeWidth: 2, cornerRadius: cornerR + 4, opacity: 0.85 }));

                            // Add clipped image above the decorative border (image added last so it sits on top and can be clicked)
                            layer.add(imgGroup);
                            imgGroup.add(imageNode);

                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Footer page number
                const footer = new window.Konva.Text({
                    x: w - 160,
                    y: h - 60,
                    text: `${i}`,
                    fontSize: 48,
                    fontFamily: 'Montserrat, Arial',
                    fill: '#94a3b8',
                    opacity: 0.6,
                    pw_id: undefined
                });
                layer.add(footer);
                stage.draw();
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderBrutalist(stages, parsedSlides, slideImagesResult) {
        // High-contrast, grid + thick borders, bold type, accent splashes.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // ---------------- Cover Slide ----------------
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Base background (stark off‑white with subtle noise blocks)
            const baseBG = new window.Konva.Rect({ x: 0, y: 0, width: sw, height: sh, fill: '#f8f8f4' });
            coverLayer.add(baseBG);

            // Thick outer frame
            coverLayer.add(new window.Konva.Rect({ x: 18, y: 18, width: sw - 36, height: sh - 36, stroke: '#000', strokeWidth: 8 }));

            // Accent brutal bars (random vertical + horizontal)
            const accentColors = ['#ff0055', '#00d084', '#ffd400', '#111'];
            [
                { x: 0, y: 0, w: sw * 0.28, h: 40, color: '#ff0055' },
                { x: sw * 0.72, y: sh - 50, w: sw * 0.28, h: 50, color: '#00d084' },
                { x: sw - 60, y: 0, w: 60, h: sh * 0.35, color: '#ffd400' },
            ].forEach(b => coverLayer.add(new window.Konva.Rect({ x: b.x, y: b.y, width: b.w, height: b.h, fill: b.color })));

            // Subtle grid lines
            const gridGap = 80;
            for (let gx = 0; gx <= sw; gx += gridGap) {
                coverLayer.add(new window.Konva.Line({ points: [gx, 0, gx, sh], stroke: '#000', strokeWidth: 1, opacity: 0.05 }));
            }
            for (let gy = 0; gy <= sh; gy += gridGap) {
                coverLayer.add(new window.Konva.Line({ points: [0, gy, sw, gy], stroke: '#000', strokeWidth: 1, opacity: 0.05 }));
            }

            // Optional cover image (grayscale, low opacity, clipped inside frame) placed BELOW all text/overlays
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    const imgW = sw * 0.38;
                    const imgH = sh * 0.55;
                    const imgNode = new window.Konva.Image({
                        image: imgObj,
                        x: sw - imgW - 110,
                        y: sh * 0.25,
                        width: imgW,
                        height: imgH,
                        opacity: 0.3,
                        filters: [window.Konva.Filters.Grayscale],
                        pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides)
                    });
                    // Add image and frame at the bottom of the layer stack
                    coverLayer.add(new window.Konva.Rect({ x: imgNode.x() - 14, y: imgNode.y() - 14, width: imgW + 28, height: imgH + 28, stroke: '#000', strokeWidth: 8 }));
                    coverLayer.add(imgNode);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            }
            // Title with overflow fix
            const title = (parsedSlides.cover?.title || (window.Lang ? Lang.get('untitledSlideForge') : 'UNTITLED PRESENTATION')).toUpperCase();
            const titleX = 70;
            const titleY = sh * 0.25;
            const titleWidth = sw - 140;
            let titleFontSize = Math.min(92, Math.max(48, sw * 0.07));
            const minTitleFontSize = 24;
            let titleObj = new window.Konva.Text({
                x: titleX,
                y: titleY,
                text: title,
                fontSize: titleFontSize,
                fontFamily: 'Impact, "Arial Black", Montserrat, Arial',
                fontStyle: 'bold',
                fill: '#000',
                width: titleWidth,
                lineHeight: 1.05,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Reduce font size if title does not fit in one line
            while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                titleFontSize -= 2;
                titleObj = new window.Konva.Text({
                    x: titleX,
                    y: titleY,
                    text: title,
                    fontSize: titleFontSize,
                    fontFamily: 'Impact, "Arial Black", Montserrat, Arial',
                    fontStyle: 'bold',
                    fill: '#000',
                    width: titleWidth,
                    lineHeight: 1.05,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : undefined
                });
            }
            coverLayer.add(titleObj);
            // Title shadow offset block (brutalist offset effect)
            coverLayer.add(new window.Konva.Text({
                x: titleX + 6,
                y: titleY + 6,
                text: title,
                fontSize: titleFontSize,
                fontFamily: 'Impact, "Arial Black", Montserrat, Arial',
                fontStyle: 'bold',
                fill: '#ff0055',
                width: titleWidth,
                opacity: 0.25,
                listening: false,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            }));

            // Subtitle bar + text
            if (parsedSlides.cover?.subtitle) {
                const subtitle = parsedSlides.cover.subtitle.toUpperCase();
                const subtitleFontSize = 26;
                const subtitleFontFamily = '"Arial Black", Impact, Montserrat, Arial';
                const subtitleWidth = sw * 0.55;
                const subtitleX = 90;
                const subtitleY = sh * 0.25 + 228;
                // Measure subtitle text
                const tempText = new window.Konva.Text({
                    text: subtitle,
                    fontSize: subtitleFontSize,
                    fontFamily: subtitleFontFamily,
                    width: subtitleWidth,
                });
                const pad = 16;
                const rectW = tempText.width();
                const rectH = tempText.height();
                // Draw black rectangle with padding
                coverLayer.add(new window.Konva.Rect({
                    x: subtitleX - pad,
                    y: subtitleY - pad,
                    width: rectW + pad * 2,
                    height: rectH + pad * 2,
                    fill: '#000',
                    cornerRadius: 8,
                }));
                // Draw subtitle text
                coverLayer.add(new window.Konva.Text({
                    x: subtitleX,
                    y: subtitleY,
                    text: subtitle,
                    fontSize: subtitleFontSize,
                    fontFamily: subtitleFontFamily,
                    fill: '#f8f8f4',
                    width: subtitleWidth,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                }));
            }
            coverStage.add(coverLayer);
            coverStage.draw();

            // ---------------- Content Slides ----------------
            const margin = 70;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const w = stage.width();
                const h = stage.height();
                const layer = new window.Konva.Layer();

                // Base white + frame
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: '#ffffff' }));
                layer.add(new window.Konva.Rect({ x: 22, y: 22, width: w - 44, height: h - 44, stroke: '#000', strokeWidth: 6 }));

                // Faint grid
                for (let gx = 22; gx <= w - 22; gx += 100) {
                    layer.add(new window.Konva.Line({ points: [gx, 22, gx, h - 22], stroke: '#000', strokeWidth: 1, opacity: 0.04 }));
                }
                for (let gy = 22; gy <= h - 22; gy += 100) {
                    layer.add(new window.Konva.Line({ points: [22, gy, w - 22, gy], stroke: '#000', strokeWidth: 1, opacity: 0.04 }));
                }

                const slideData = parsedSlides.slides[i - 1];
                const titleText = (slideData?.title || `Slide ${i}`).toUpperCase();
                let titleFontSize = 48;
                const minTitleFontSize = 18;
                const titleY = margin - 10;
                const titleWidth = w - margin * 2;
                let titleObj = new window.Konva.Text({
                    text: titleText,
                    x: margin,
                    y: titleY,
                    width: titleWidth,
                    fontSize: titleFontSize,
                    fontFamily: 'Impact, "Arial Black", Montserrat, Arial',
                    fill: '#000',
                    lineHeight: 1,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleObj = new window.Konva.Text({
                        text: titleText,
                        x: margin,
                        y: titleY,
                        width: titleWidth,
                        fontSize: titleFontSize,
                        fontFamily: 'Impact, "Arial Black", Montserrat, Arial',
                        fill: '#000',
                        lineHeight: 1,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                    });
                }
                const underlineY = titleY + titleObj.height() + 10;
                // Title
                layer.add(titleObj);
                // Heavy underline bar
                const underlineW = Math.min(w - margin * 2, titleObj.width());
                layer.add(new window.Konva.Rect({ x: margin, y: underlineY, width: underlineW, height: 14, fill: '#000' }));

                // Calculate image Y so it does not overlap with title/line
                const imageGap = 32; // gap below underline before image
                const imageTop = underlineY + 14 + imageGap;

                // Content bullets - each in its own stark block with overflow fix.
                const bulletTexts = (slideData?.content || []).map(c => c.trim());
                const blockGap = 25;
                const blockWidth = w * 0.55;
                const marginTop = margin + 110;
                const marginBottom = 70;
                const availableHeight = h - marginTop - marginBottom;
                let fontSize = 26;
                const minFontSize = 14;
                const maxBlockHeight = 180;
                const minBlockHeight = 80;
                let fits = false;
                let textHeights = [];
                let blockHeights = [];

                // Overflow protection: measure and reduce font size until items fit in availableHeight
                const itemCount = bulletTexts.length;
                if (itemCount > 0) {
                    while (fontSize >= minFontSize && !fits) {
                        let maxRequiredHeight = 0;
                        // measure each bullet and compute a required card height (text height + padding)
                        bulletTexts.forEach((txt, idx) => {
                            const tmp = new window.Konva.Text({ text: txt, fontSize, fontFamily: 'Helvetica, Arial', width: blockWidth - 160, lineHeight: 1.15, pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                            const textHeight = tmp.height();
                            const requiredHeight = Math.max(minBlockHeight, textHeight + 30);
                            maxRequiredHeight = Math.max(maxRequiredHeight, requiredHeight);
                        });

                        const totalRequired = maxRequiredHeight * itemCount + (itemCount - 1) * blockGap;
                        if (totalRequired <= availableHeight) {
                            fits = true;
                            // use the same height for all blocks (keeps visual rhythm and avoids overflow)
                            blockHeights = new Array(itemCount).fill(maxRequiredHeight);
                        } else {
                            fontSize -= 2;
                        }
                    }

                    // If still doesn't fit, distribute available space evenly with min block height enforced
                    if (!fits) {
                        const distributed = Math.max(minBlockHeight, Math.floor((availableHeight - (itemCount - 1) * blockGap) / itemCount));
                        blockHeights = new Array(itemCount).fill(distributed);
                        fontSize = minFontSize;
                    }

                    // Compute total column height and vertically center it in the available area
                    const totalColumnHeight = blockHeights.reduce((a, b) => a + b, 0) + (itemCount - 1) * blockGap;
                    let startY = marginTop + Math.max(0, Math.round((availableHeight - totalColumnHeight) / 2));

                    // Render each bullet card using computed heights and final fontSize
                    let yCursor = startY;
                    bulletTexts.forEach((txt, idx) => {
                        const blockHeight = blockHeights[idx];
                        const accent = accentColors[idx % accentColors.length];

                        // Block container
                        layer.add(new window.Konva.Rect({ x: margin, y: yCursor, width: blockWidth, height: blockHeight, fill: '#fdfdfd', stroke: '#000', strokeWidth: 4 }));

                        // Accent side bar (full height)
                        layer.add(new window.Konva.Rect({ x: margin, y: yCursor, width: 22, height: blockHeight, fill: accent }));

                        // Index badge (vertically centered inside the block)
                        const badgeSize = 60;
                        const badgeX = margin + 30;
                        const badgeY = yCursor + Math.round((blockHeight - badgeSize) / 2);
                        layer.add(new window.Konva.Rect({ x: badgeX, y: badgeY, width: badgeSize, height: badgeSize, fill: '#000' }));
                        layer.add(new window.Konva.Text({
                            x: badgeX,
                            y: badgeY + Math.round((badgeSize - 34) / 2),
                            width: badgeSize,
                            text: (idx + 1).toString(),
                            align: 'center',
                            fontSize: 34,
                            fontFamily: 'Impact, "Arial Black"',
                            fill: '#fff'
                        }));

                        // Main text: measure its height and vertically center inside the block
                        const textX = margin + 110;
                        const textWidth = blockWidth - 160;
                        const tmp = new window.Konva.Text({ text: txt, fontSize, fontFamily: 'Helvetica, Arial', width: textWidth, lineHeight: 1.15, pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                        const tH = tmp.height();
                        const textY = yCursor + Math.round((blockHeight - tH) / 2);
                        layer.add(new window.Konva.Text({
                            x: textX,
                            y: textY,
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Helvetica, Arial',
                            fill: '#000',
                            width: textWidth,
                            align: 'left',
                            lineHeight: 1.15,
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined,
                        }));
                        yCursor += blockHeight + blockGap;
                    });
                }
                // Sidebar image (if any), ensure it does not overlap with title/line
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            const imgMaxW = w - (margin + blockWidth) - 120;
                            // Only allow image to start at or below imageTop
                            const imgMaxH = h - imageTop - margin - 60;
                            let drawW = imgObj.width; let drawH = imgObj.height;
                            const ratio = Math.min(imgMaxW / drawW, imgMaxH / drawH, 1);
                            drawW *= ratio; drawH *= ratio;
                            const imgX = margin + blockWidth + 80;
                            const imgY = imageTop;
                            // Frame
                            layer.add(new window.Konva.Rect({ x: imgX - 16, y: imgY - 16, width: drawW + 32, height: drawH + 32, stroke: '#000', strokeWidth: 6, fill: '#fff' }));
                            // Accent corner square
                            layer.add(new window.Konva.Rect({ x: imgX - 16, y: imgY - 16, width: 60, height: 60, fill: '#ff0055' }));
                            layer.add(new window.Konva.Image({
                                image: imgObj,
                                x: imgX,
                                y: imgY,
                                width: drawW,
                                height: drawH,
                                opacity: 0.92,
                            }));
                            // Caption line
                            layer.add(new window.Konva.Text({ x: imgX, y: imgY + drawH + 18, text: (window.Lang ? (Lang.get('figurePrefix') + i) : 'FIG.' + i), fontSize: 18, fontFamily: 'Courier New, monospace', fill: '#000', pw_id: undefined }));
                            stage.add(layer);
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { stage.add(layer); stage.draw(); res(); };
                    }));
                    imgObj.src = base64;
                } else {
                    stage.add(layer);
                    stage.draw();
                }

                // Large page number rotated (added after draw for layering)
                const pageNumLayer = new window.Konva.Layer();
                pageNumLayer.add(new window.Konva.Text({
                    x: w - 120,
                    y: h - 40,
                    text: (i).toString(),
                    fontSize: 140,
                    fontFamily: 'Impact, "Arial Black"',
                    fill: '#000',
                    opacity: 0.06,
                    rotation: -90,
                    offsetX: 0,
                    offsetY: 0,
                    pw_id: undefined
                }));
                stage.add(pageNumLayer);
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderEnchanted(stages, parsedSlides, slideImagesResult) {
        // Futuristic AI marketing style: dark nano-grid, neon cyan/magenta/violet gradients, glass panels.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // Cover slide
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Deep space gradient
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#05060a', 0.35, '#0e1030', 0.7, '#1a0f3f', 1, '#120a24']
            }));
            // Radial glow
            coverLayer.add(new window.Konva.Circle({
                x: sw * 0.72, y: sh * 0.42, radius: 260,
                fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: 260,
                fillRadialGradientColorStops: [0, 'rgba(34,211,238,0.35)', 0.45, 'rgba(168,85,247,0.25)', 0.75, 'rgba(236,72,153,0.18)', 1, 'rgba(0,0,0,0)']
            }));
            // Nano grid
            const gridGap = 40; for (let gx = 0; gx <= sw; gx += gridGap) coverLayer.add(new window.Konva.Line({ points: [gx, 0, gx, sh], stroke: '#22d3ee', strokeWidth: 1, opacity: 0.04 }));
            for (let gy = 0; gy <= sh; gy += gridGap) coverLayer.add(new window.Konva.Line({ points: [0, gy, sw, gy], stroke: '#a855f7', strokeWidth: 1, opacity: 0.035 }));
            // Circuit nodes
            const nodeCols = ['#22d3ee', '#a855f7', '#ec4899'];
            for (let i = 0; i < 26; i++) coverLayer.add(new window.Konva.Circle({ x: Math.random() * sw, y: Math.random() * sh, radius: 3 + Math.random() * 5, fill: nodeCols[i % nodeCols.length], shadowColor: nodeCols[i % nodeCols.length], shadowBlur: 10, opacity: 0.65 }));
            // Diagonal neon streaks
            [{ x: -sw * 0.2, y: sh * 0.16, w: sw * 1.4, h: 140, rot: 18, from: '#22d3ee', to: '#3b82f6', op: 0.14 }, { x: -sw * 0.15, y: sh * 0.55, w: sw * 1.4, h: 200, rot: 18, from: '#ec4899', to: '#a855f7', op: 0.12 }]
                .forEach(s => coverLayer.add(new window.Konva.Rect({
                    x: s.x, y: s.y, width: s.w, height: s.h, rotation: s.rot,
                    fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: s.w, y: 0 }, fillLinearGradientColorStops: [0, s.from, 1, s.to], opacity: s.op
                })));

            // Title, line, subtitle nodes (defer adding until after image) with overflow fix
            const title = parsedSlides.cover?.title || (window.Lang ? Lang.get('aiVisionDefaultTitle') : 'AI TECHNOLOGY VISION');
            let tSize = Math.min(84, Math.max(48, sw * 0.065));
            const minTitleFontSize = 24;
            const titleX = 90;
            const titleY = sh * 0.25;
            // Reserve space for the expected right-hand cover panel so title/subtitle do not overlap it
            const expectedPanelW = Math.round(sw * 0.36);
            const expectedPanelX = Math.round(sw - expectedPanelW - 120); // same calc used when adding the image
            const titleWidth = Math.min(sw * 0.55, Math.max(120, expectedPanelX - titleX - 24));
            const subtitleFontSize = 30;
            const subtitleGap = 32;
            const lineGap = 18;
            let titleNode = new window.Konva.Text({
                x: titleX, y: titleY, width: titleWidth, text: title, fontSize: tSize,
                fontFamily: 'Montserrat, Arial', fontStyle: '800', lineHeight: 1.1,
                fill: '#f8fafc', shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.4,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Reduce font size if title does not fit in one line
            while ((titleNode.height() > titleNode.fontSize() * 1.5) && tSize > minTitleFontSize) {
                tSize -= 2;
                titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth, text: title, fontSize: tSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '800', lineHeight: 1.1,
                    fill: '#f8fafc', shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.4,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            }
            const lineY = titleY + titleNode.height() + lineGap;
            const lineNode = new window.Konva.Rect({
                x: titleX, y: lineY, width: 260, height: 6, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 260, y: 0 }, fillLinearGradientColorStops: [0, '#22d3ee', 1, '#ec4899'], cornerRadius: 3
            });
            let subtitleNode = null;
            if (parsedSlides.cover?.subtitle) {
                const subtitleY = lineY + 6 + subtitleGap;
                const subtitleWidth = Math.min(sw * 0.5, titleWidth - 4); // keep subtitle within same reserved area
                subtitleNode = new window.Konva.Text({
                    x: titleX + 4, y: subtitleY, width: subtitleWidth,
                    text: parsedSlides.cover.subtitle, fontSize: subtitleFontSize, fontFamily: 'Montserrat, Arial', lineHeight: 1.35,
                    fill: '#cbd5e1', shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.3,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            }

            // Add cover image and frame first, then overlays/text
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    const panelW = sw * 0.36, panelH = sh * 0.58;
                    const imgNode = new window.Konva.Image({ image: imgObj, x: sw - panelW - 120, y: sh * 0.23, width: panelW, height: panelH, opacity: 0.88, cornerRadius: 30, shadowColor: '#22d3ee', shadowBlur: 30, shadowOpacity: 0.35, pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides) });
                    coverLayer.add(new window.Konva.Rect({
                        x: imgNode.x(), y: imgNode.y(), width: panelW, height: panelH, cornerRadius: 30,
                        fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: panelW, y: panelH }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.15)', 1, 'rgba(255,255,255,0.02)'], stroke: 'rgba(255,255,255,0.25)', strokeWidth: 2
                    }));
                    coverLayer.add(imgNode);
                    // Add overlays/text last
                    coverLayer.add(titleNode);
                    coverLayer.add(lineNode);
                    if (subtitleNode) coverLayer.add(subtitleNode);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                // No image, just overlays/text
                coverLayer.add(titleNode);
                coverLayer.add(lineNode);
                if (subtitleNode) coverLayer.add(subtitleNode);
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            // Content slides
            const margin = 70;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const w = stage.width(); const h = stage.height();
                const layer = new window.Konva.Layer();
                // Base
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: w, y: h }, fillLinearGradientColorStops: [0, '#05060a', 0.4, '#0f1733', 0.8, '#1e1144', 1, '#05060a'] }));
                const gap = 50; for (let gx = 0; gx <= w; gx += gap) layer.add(new window.Konva.Line({ points: [gx, 0, gx, h], stroke: '#22d3ee', strokeWidth: 1, opacity: 0.03 }));
                for (let gy = 0; gy <= h; gy += gap) layer.add(new window.Konva.Line({ points: [0, gy, w, gy], stroke: '#a855f7', strokeWidth: 1, opacity: 0.025 }));
                // Header glass bar + glow line
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: 110, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: w, y: 0 }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.12)', 1, 'rgba(255,255,255,0.05)'], shadowColor: '#000', shadowBlur: 30, shadowOpacity: 0.4 }));
                const slideData = parsedSlides.slides[i - 1];
                const slideTitle = (slideData?.title || `Slide ${i}`).toUpperCase();
                let slideTitleFontSize = 40;
                const minSlideTitleFontSize = 18;
                const slideTitleX = margin;
                const slideTitleY = 34;
                const slideTitleWidth = w - margin * 2;
                let slideTitleObj = new window.Konva.Text({
                    x: slideTitleX,
                    y: slideTitleY,
                    width: slideTitleWidth,
                    text: slideTitle.toUpperCase(),
                    fontSize: slideTitleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#e5eaf4ff',
                    shadowColor: '#000',
                    shadowBlur: 6,
                    shadowOpacity: 0.25,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                });
                // Reduce font size if title does not fit in one line
                while ((slideTitleObj.height() > slideTitleObj.fontSize() * 1.5) && slideTitleFontSize > minSlideTitleFontSize) {
                    slideTitleFontSize -= 2;
                    slideTitleObj = new window.Konva.Text({
                        x: slideTitleX,
                        y: slideTitleY,
                        width: slideTitleWidth,
                        text: slideTitle,
                        fontSize: slideTitleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#f1f5f9',
                        shadowColor: '#000',
                        shadowBlur: 10,
                        shadowOpacity: 0.35,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                    });
                }
                layer.add(slideTitleObj);
                // Bullets as chips with comprehensive overflow fix
                const bullets = (slideData?.content || []).map(t => t.trim());
                const colWidth = w * 0.55;
                const blockGap = 18;
                const marginLeft = margin + 10;
                const maxBlockWidth = colWidth - 40;
                let fontSize = 24;
                let fits = false;
                let textHeights = [];
                let blockHeights = [];
                const minBlockHeight = 70;
                const textLineHeight = 1.25;
                const yellowOutline = 30;
                const availableHeight = h - 140 - yellowOutline;

                // Overflowing fix for bullets - calculate available space and reduce font size if needed
                while (fontSize >= 14 && !fits) {
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: maxBlockWidth - 130,
                            lineHeight: textLineHeight
                            , pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    blockHeights = textHeights.map(hh => Math.max(minBlockHeight, hh + 36));
                    const totalHeight = blockHeights.reduce((a, b) => a + b, 0) + (bullets.length - 1) * blockGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }

                // If still doesn't fit, use minimum font size and recalc
                if (!fits) {
                    fontSize = 14;
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: txt,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: maxBlockWidth - 130,
                            lineHeight: textLineHeight
                            , pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    blockHeights = textHeights.map(hh => Math.max(minBlockHeight, hh + 36));
                }
                // Render bullet cards with calculated font size
                let yCursor = 140;
                const lineColors = ['#22d3ee', '#a855f7', '#ec4899', '#3b82f6'];
                bullets.forEach((txt, idx) => {
                    const blockH = blockHeights[idx];
                    const blockY = yCursor;
                    const g = new window.Konva.Group();
                    g.add(new window.Konva.Rect({
                        x: marginLeft, y: blockY, width: maxBlockWidth, height: blockH, cornerRadius: 20,
                        fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: maxBlockWidth, y: blockH }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.12)', 1, 'rgba(255,255,255,0.04)'], stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1, shadowColor: '#000', shadowBlur: 15, shadowOpacity: 0.35
                    }));
                    g.add(new window.Konva.Rect({ x: marginLeft, y: blockY, width: 8, height: blockH, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: blockH }, fillLinearGradientColorStops: [0, lineColors[idx % lineColors.length], 1, '#ec4899'], cornerRadius: [20, 0, 0, 20] }));
                    // badge circle (center number vertically)
                    const _circleCx = marginLeft + 42;
                    const _circleCy = blockY + blockH / 2;
                    const _circleR = 24;
                    g.add(new window.Konva.Circle({ x: _circleCx, y: _circleCy, radius: _circleR, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 48, y: 48 }, fillLinearGradientColorStops: [0, lineColors[idx % lineColors.length], 1, '#a855f7'], shadowColor: lineColors[idx % lineColors.length], shadowBlur: 12, shadowOpacity: 0.6 }));
                    const numText = new window.Konva.Text({ x: _circleCx - _circleR, y: _circleCy - 12, width: _circleR * 2, text: (idx + 1).toString(), fontSize: 22, fontFamily: 'Montserrat, Arial', fontStyle: '700', fill: '#fff', align: 'center', pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                    // vertically center the number inside the circle using measured height
                    numText.y(Math.round(_circleCy - numText.height() / 2));
                    g.add(numText);
                    // Text with calculated font size
                    g.add(new window.Konva.Text({ x: marginLeft + 80, y: blockY + (blockH - textHeights[idx]) / 2 - 2, width: maxBlockWidth - 130, text: txt, fontSize: fontSize, fontFamily: 'Montserrat, Arial', lineHeight: textLineHeight, fill: '#e2e8f0', shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.4, pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined }));
                    layer.add(g); yCursor += blockH + blockGap;
                });

                // Right panel
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                const panelX = colWidth + margin + 40; const panelW = w - panelX - margin; const panelY = 150; const panelH = h - panelY - 140;
                layer.add(new window.Konva.Rect({
                    x: panelX, y: panelY, width: panelW, height: panelH, cornerRadius: 34,
                    fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: panelW, y: panelH }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.09)', 1, 'rgba(255,255,255,0.02)'], stroke: 'rgba(255,255,255,0.25)', strokeWidth: 2, shadowColor: '#000', shadowBlur: 30, shadowOpacity: 0.45
                }));
                layer.add(new window.Konva.Circle({
                    x: panelX + panelW * 0.65, y: panelY + panelH * 0.4, radius: Math.min(panelW, panelH) * 0.28,
                    fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0, fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: Math.min(panelW, panelH) * 0.28,
                    fillRadialGradientColorStops: [0, 'rgba(168,85,247,0.6)', 0.6, 'rgba(56,189,248,0.25)', 1, 'rgba(0,0,0,0)'], shadowColor: '#a855f7', shadowBlur: 40, shadowOpacity: 0.6
                }));

                stage.add(layer); stage.draw();
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Make the visible image nearly as big as the decorative panel while leaving a border
                            const gap = 14; // visible gap so the neon border shows
                            const frameX = panelX + gap;
                            const frameY = panelY + gap;
                            const frameW = Math.max(40, panelW - gap * 2);
                            const frameH = Math.max(40, panelH - gap * 2);
                            const cornerR = 30;

                            // Add an outer subtle glow/border under the clipped image (keeps existing look)
                            layer.add(new window.Konva.Rect({ x: panelX, y: panelY, width: panelW, height: panelH, cornerRadius: cornerR, fill: 'transparent', stroke: 'rgba(255,255,255,0.02)', strokeWidth: 0 }));

                            // Clipped group for rounded image area
                            const imgGroup = new window.Konva.Group({
                                x: frameX, y: frameY, clipFunc: function (ctx) {
                                    const w = frameW, h = frameH, r = cornerR - 6;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(w - r, 0);
                                    ctx.quadraticCurveTo(w, 0, w, r);
                                    ctx.lineTo(w, h - r);
                                    ctx.quadraticCurveTo(w, h, w - r, h);
                                    ctx.lineTo(r, h);
                                    ctx.quadraticCurveTo(0, h, 0, h - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Calculate cover scaling so the image fills frame without squishing
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(frameW / imgW, frameH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgInnerX = Math.round((frameW - drawW) / 2);
                            const imgInnerY = Math.round((frameH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgInnerX,
                                y: imgInnerY,
                                width: drawW,
                                height: drawH,
                                cornerRadius: cornerR - 6,
                                opacity: 0.92,
                                shadowColor: '#000', shadowBlur: 25, shadowOpacity: 0.35,
                                filters: [window.Konva.Filters.Brighten, window.Konva.Filters.Contrast],
                                brightness: 0.02,
                                contrast: 0.04,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Add clipped image into its own top layer so the image is rendered last and is clickable
                            imgGroup.add(imageNode);
                            const imgLayer = new window.Konva.Layer();
                            imgLayer.add(imgGroup);
                            // Add decorative overlay/border to the main layer (keeps previous look but will remain under the image)
                            layer.add(new window.Konva.Rect({ x: frameX - 10, y: frameY - 10, width: frameW + 20, height: frameH + 20, stroke: '#22d3ee', strokeWidth: 3, cornerRadius: cornerR + 2, shadowColor: '#22d3ee', shadowBlur: 18, opacity: 0.9 }));
                            // Ensure the image layer is added after the decoration layer so it is on top
                            stage.add(imgLayer);
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }
                const numLayer = new window.Konva.Layer();
                numLayer.add(new window.Konva.Text({ x: w - 150, y: h - 80, text: i.toString(), fontSize: 58, fontFamily: 'Montserrat, Arial', fill: '#a855f7', shadowColor: '#22d3ee', shadowBlur: 18, shadowOpacity: 0.5, opacity: 0.55, pw_id: undefined }));
                stage.add(numLayer);
            }
            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderDarkMode(stages, parsedSlides, slideImagesResult) {
        // Structure mirrors renderClassic: cover + simple content slides (left text / right image)
        // Palette: layered greys (#0d0f11 -> #1e2227 -> #2b3036) with soft silver accents.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // ---------------- Cover Slide ----------------
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Base deep vignetted gradient backdrop
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#0d0f11', 0.4, '#1a1d22', 0.75, '#242a30', 1, '#2b3036']
            }));
            // Radial glow center subtle (soft charcoal spotlight)
            coverLayer.add(new window.Konva.Circle({
                x: sw * 0.55, y: sh * 0.45, radius: Math.max(sw, sh) * 0.5,
                fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: Math.max(sw, sh) * 0.5,
                fillRadialGradientColorStops: [0, 'rgba(255,255,255,0.04)', 0.5, 'rgba(255,255,255,0.02)', 1, 'rgba(255,255,255,0)']
            }));
            // Subtle vertical hairlines (luxury texture)
            for (let x = 0; x < sw; x += 90) {
                coverLayer.add(new window.Konva.Line({ points: [x, 0, x, sh], stroke: '#ffffff', strokeWidth: 1, opacity: 0.03 }));
            }

            // --- Cover image and frame first, then overlays/text ---
            function addCoverTexts() {
                const title = parsedSlides.cover?.title || 'Dark Mode SlideForge';
                let tSize = Math.min(72, Math.max(48, sw * 0.055));
                const minTitleFontSize = 24;
                const titleX = 80;
                const titleY = sh * 0.28;
                // Reserve expected right-hand cover image area so text does not overlap it
                const expectedPanelW = Math.round(sw * 0.62); // matches image sizing used when loading the cover image
                const expectedPanelX = Math.round(sw * 0.55); // x where the image is positioned (see onload below)
                const titleWidth = Math.min(sw - 160, Math.max(120, expectedPanelX - titleX - 24));
                const subtitleFontSize = 30;
                const subtitleGap = 32;
                const lineGap = 18;
                // Title node with overflow fix
                let titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth, text: title, fontSize: tSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '800', lineHeight: 1.1,
                    fill: '#f8fafc', shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.4,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleNode.height() > titleNode.fontSize() * 1.5) && tSize > minTitleFontSize) {
                    tSize -= 2;
                    titleNode = new window.Konva.Text({
                        x: titleX, y: titleY, width: titleWidth, text: title, fontSize: tSize,
                        fontFamily: 'Montserrat, Arial', fontStyle: '800', lineHeight: 1.1,
                        fill: '#f8fafc', shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.4
                        , pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : undefined
                    });
                }
                // Line node (between title and subtitle)
                const lineY = titleY + titleNode.height() + lineGap;
                const lineNode = new window.Konva.Rect({
                    x: titleX,
                    y: lineY,
                    width: 260,
                    height: 6,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 260, y: 0 },
                    fillLinearGradientColorStops: [0, '#4b5563', 1, '#9ca3af'],
                    cornerRadius: 3,
                    opacity: 0.8
                });
                // Subtitle node (below line, with gap)
                let subtitleNode = null;
                if (parsedSlides.cover?.subtitle) {
                    const subtitleY = lineY + 6 + subtitleGap;
                    // Ensure subtitle width does not exceed the computed title width (keeps text away from the image)
                    const subtitleWidth = Math.min(sw * 0.5, titleWidth - 4);
                    subtitleNode = new window.Konva.Text({
                        x: titleX + 4, y: subtitleY, width: subtitleWidth,
                        text: parsedSlides.cover.subtitle,
                        fontSize: subtitleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight: 1.35,
                        fill: '#cbd5e1',
                        shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.3,
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                }
                // Add overlays/text last
                coverLayer.add(titleNode);
                coverLayer.add(lineNode);
                if (subtitleNode) coverLayer.add(subtitleNode);
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // Centered, framed, below overlays
                    const imgRatio = imgObj.width / imgObj.height;
                    const stageRatio = sw / sh;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > stageRatio) {
                        drawW = sw * 0.62;
                        drawH = drawW / imgRatio;
                    } else {
                        drawH = sh * 0.48;
                        drawW = drawH * imgRatio;
                    }
                    drawX = sw * 0.55;
                    drawY = sh * 0.22;
                    // Frame
                    coverLayer.add(new window.Konva.Rect({
                        x: drawX - 18, y: drawY - 18, width: drawW + 36, height: drawH + 36,
                        stroke: '#9ca3af', strokeWidth: 8, cornerRadius: 24, opacity: 0.22
                    }));
                    coverLayer.add(new window.Konva.Image({
                        image: imgObj, x: drawX, y: drawY, width: drawW, height: drawH,
                        opacity: 0.92, cornerRadius: 20, shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.18
                    }));
                    addCoverTexts();
                };
                imgObj.onerror = () => { addCoverTexts(); };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                addCoverTexts();
            }


            // ---------------- Content Slides ----------------
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();

                // Background layered gradient + subtle top vignette bar
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: h,
                    fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: w, y: h },
                    fillLinearGradientColorStops: [0, '#0f1114', 0.5, '#181b20', 0.85, '#22282e', 1, '#262d33']
                }));
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: 140, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 140 }, fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.06)', 1, 'rgba(255,255,255,0)'] }));
                // Hairlines
                for (let x = 0; x < w; x += 100) {
                    layer.add(new window.Konva.Line({ points: [x, 0, x, h], stroke: '#fff', strokeWidth: 1, opacity: 0.02 }));
                }

                const slideData = parsedSlides.slides[i - 1];
                const titleText = slideData?.title || (window.Lang ? (Lang.get('slideLabel') + ' ' + (i + 1)) : `Slide ${i + 1}`);
                // Title with overflow fix
                let titleFontSize = 44;
                const minTitleFontSize = 18;
                const titleX = margin;
                const titleY = margin - 10;
                const titleWidth = w - margin * 2;
                let titleObj = new window.Konva.Text({
                    text: titleText,
                    x: titleX,
                    y: titleY,
                    width: titleWidth,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#f3f4f6',
                    shadowColor: '#000', shadowBlur: 14, shadowOpacity: 0.4
                    ,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleObj = new window.Konva.Text({
                        text: titleText,
                        x: titleX,
                        y: titleY,
                        width: titleWidth,
                        fontSize: titleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#f3f4f6',
                        shadowColor: '#000', shadowBlur: 14, shadowOpacity: 0.4
                        ,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                    });
                }
                layer.add(titleObj);
                // Underline
                layer.add(new window.Konva.Rect({ x: margin, y: titleY + titleObj.height() + 10, width: Math.min(320, titleText.length * 20), height: 6, cornerRadius: 3, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 320, y: 0 }, fillLinearGradientColorStops: [0, '#4b5563', 1, '#9ca3af'], opacity: 0.8 }));

                // --- Bullets as cards, dynamic font sizing/fitting like Classic ---
                const colWidth = w * 0.52;
                const marginTop = titleY + titleObj.height() + 10 + 6 + 20; // title + underline + gap
                const marginBottom = 60;
                const availableHeight = h - marginTop - marginBottom;
                const bullets = (slideData?.content || []).map(c => c.trim());
                let fontSize = 24;
                let fits = false;
                let textHeights = [];
                const lineHeight = 1.25;
                const blockGap = 18;
                // Enhanced overflowing fix for bullets - try to fit all text nodes, reduce font size if needed (all bullets use same font size)
                while (fontSize >= 14 && !fits) {
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            width: colWidth - 54,
                            lineHeight: lineHeight,
                            fontFamily: 'Montserrat, Arial',
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    const blockHeights = textHeights.map(th => th + 32); // text height + padding
                    const totalHeight = blockHeights.reduce((a, b) => a + b, 0) + (bullets.length - 1) * blockGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }
                // If still doesn't fit, use minimum font size and recalc
                if (!fits) {
                    fontSize = 14;
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            width: colWidth - 54,
                            lineHeight: lineHeight,
                            fontFamily: 'Montserrat, Arial',
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                }
                // Now render the text nodes and their cards
                let yCursor = marginTop;
                bullets.forEach((txt, idx) => {
                    const blockH = textHeights[idx] + 32;
                    // Card background
                    layer.add(new window.Konva.Rect({
                        x: margin,
                        y: yCursor,
                        width: colWidth - 10,
                        height: blockH,
                        cornerRadius: 18,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: colWidth - 10, y: blockH },
                        fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.08)', 1, 'rgba(255,255,255,0.01)'],
                        stroke: '#4b5563', strokeWidth: 1.5, shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.18
                    }));
                    // Bullet text
                    layer.add(new window.Konva.Text({
                        x: margin + 22,
                        y: yCursor + 16,
                        width: colWidth - 54,
                        text: `   ${txt}`,
                        fontSize: fontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight: lineHeight,
                        fill: '#d1d5db',
                        shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.22,
                        pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    }));
                    yCursor += blockH + blockGap;
                });

                // --- Right-side image panel (does not overlap title/line) ---
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                const panelX = colWidth + margin + 40;
                const panelW = w - panelX - margin;
                const panelY = margin + 70; // ensure below title/line
                const panelH = h - panelY - 80;
                layer.add(new window.Konva.Rect({
                    x: panelX,
                    y: panelY,
                    width: panelW,
                    height: panelH,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: panelW, y: panelH },
                    fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.09)', 1, 'rgba(255,255,255,0.02)'],
                    cornerRadius: 28,
                    stroke: '#4b5563', strokeWidth: 1.5, shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.22
                }));
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Use clipped rounded frame and 'cover' scaling so image fills panel without squishing
                            const frameW = panelW - 60;
                            const frameH = panelH - 60;
                            const frameX = panelX + Math.round((panelW - frameW) / 2);
                            const frameY = panelY + Math.round((panelH - frameH) / 2);

                            // Outer subtle border under the image
                            const borderPad = 8;
                            const outerX = frameX - borderPad;
                            const outerY = frameY - borderPad;
                            const outerW = frameW + borderPad * 2;
                            const outerH = frameH + borderPad * 2;
                            const cornerR = 18;

                            layer.add(new window.Konva.Rect({ x: outerX, y: outerY, width: outerW, height: outerH, stroke: '#4b5563', strokeWidth: 1.5, cornerRadius: cornerR + 4, opacity: 0.85 }));

                            // Clipped group for rounded image area
                            const imgGroup = new window.Konva.Group({
                                x: frameX, y: frameY, clipFunc: function (ctx) {
                                    const w = frameW, h = frameH, r = cornerR;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(w - r, 0);
                                    ctx.quadraticCurveTo(w, 0, w, r);
                                    ctx.lineTo(w, h - r);
                                    ctx.quadraticCurveTo(w, h, w - r, h);
                                    ctx.lineTo(r, h);
                                    ctx.quadraticCurveTo(0, h, 0, h - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // 'cover' scaling to fill the frame while keeping aspect ratio
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(frameW / imgW, frameH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgInnerX = Math.round((frameW - drawW) / 2);
                            const imgInnerY = Math.round((frameH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgInnerX,
                                y: imgInnerY,
                                width: drawW,
                                height: drawH,
                                cornerRadius: cornerR,
                                opacity: 0.96,
                                shadowColor: '#000', shadowBlur: 16, shadowOpacity: 0.18,
                                filters: [window.Konva.Filters.Brighten, window.Konva.Filters.Contrast],
                                brightness: 0.02,
                                contrast: 0.03,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Add image to its own top layer so it's above decorations and clickable
                            imgGroup.add(imageNode);
                            const imgLayer = new window.Konva.Layer();
                            imgLayer.add(imgGroup);
                            // Keep decorative overlay/stroke on main layer (under the image)
                            layer.add(new window.Konva.Rect({ x: frameX - 8, y: frameY - 8, width: frameW + 16, height: frameH + 16, stroke: '#9ca3af', strokeWidth: 1.5, cornerRadius: cornerR + 4, opacity: 0.7 }));
                            stage.add(imgLayer);
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Page number (subtle, bottom right)
                const numLayer = new window.Konva.Layer();
                numLayer.add(new window.Konva.Text({
                    x: w - 140,
                    y: h - 70,
                    text: i.toString(),
                    fontSize: 54,
                    fontFamily: 'Montserrat, Arial',
                    fill: '#4b5563',
                    opacity: 0.22,
                    pw_id: undefined
                }));
                stage.add(layer);
                stage.add(numLayer);
                stage.draw();
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderLightMode(stages, parsedSlides, slideImagesResult) {
        // Mirrors renderDarkMode structure but uses light colors: bright backgrounds, dark text, soft gray accents.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // ---------------- Cover Slide ----------------
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Base airy vignetted gradient backdrop (light neutrals)
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#ffffff', 0.5, '#f8fafc', 0.85, '#f1f5f9', 1, '#eef2f7']
            }));
            // Soft radial glow center (very subtle warm highlight)
            coverLayer.add(new window.Konva.Circle({
                x: sw * 0.55, y: sh * 0.45, radius: Math.max(sw, sh) * 0.5,
                fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: Math.max(sw, sh) * 0.5,
                fillRadialGradientColorStops: [0, 'rgba(0,0,0,0.02)', 0.5, 'rgba(0,0,0,0.01)', 1, 'rgba(0,0,0,0)']
            }));
            // Subtle vertical hairlines for texture (dark thin lines with very low opacity)
            for (let x = 0; x < sw; x += 90) {
                coverLayer.add(new window.Konva.Line({ points: [x, 0, x, sh], stroke: '#000', strokeWidth: 1, opacity: 0.02 }));
            }

            // --- Cover image and frame first, then overlays/text ---
            function addCoverTexts() {
                const title = parsedSlides.cover?.title || 'Light Mode SlideForge';
                let tSize = Math.min(72, Math.max(48, sw * 0.055));
                const minTitleFontSize = 24;
                const titleX = 80;
                const titleY = sh * 0.28;
                // Reserve space for the expected right-hand cover image so title/subtitle do not overlap it
                const expectedImageW = Math.round(sw * 0.62); // matches image sizing used when loading the cover image
                const expectedImageX = Math.round(sw * 0.55); // x where the image is positioned (see onload below)
                const titleWidth = Math.min(sw - 160, Math.max(120, expectedImageX - titleX - 24));
                const subtitleFontSize = 30;
                const subtitleGap = 32;
                const lineGap = 18;
                // Title node with overflow fix
                let titleNode = new window.Konva.Text({
                    x: titleX,
                    y: titleY,
                    width: titleWidth,
                    text: title,
                    fontSize: tSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    lineHeight: 1.15,
                    fill: '#0f172a', // dark text for light background
                    shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.06,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleNode.height() > titleNode.fontSize() * 1.5) && tSize > minTitleFontSize) {
                    tSize -= 2;
                    titleNode = new window.Konva.Text({
                        x: titleX,
                        y: titleY,
                        width: titleWidth,
                        text: title,
                        fontSize: tSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        lineHeight: 1.15,
                        fill: '#0f172a',
                        shadowColor: '#000', shadowBlur: 10, shadowOpacity: 0.06,
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                }
                // Line node (between title and subtitle)
                const lineY = titleY + titleNode.height() + lineGap;
                const lineNode = new window.Konva.Rect({
                    x: titleX,
                    y: lineY,
                    width: 260,
                    height: 6,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 260, y: 0 },
                    fillLinearGradientColorStops: [0, '#cbd5e1', 1, '#94a3b8'],
                    cornerRadius: 3,
                    opacity: 0.9
                });
                // Subtitle node (below line, with gap)
                let subtitleNode = null;
                if (parsedSlides.cover?.subtitle) {
                    const subtitleY = lineY + 6 + subtitleGap;
                    // Limit subtitle width so it stays within the reserved title area and doesn't overlap the image
                    const subtitleWidth = Math.min(sw * 0.5, titleWidth - 4);
                    subtitleNode = new window.Konva.Text({
                        x: titleX + 4,
                        y: subtitleY,
                        width: subtitleWidth,
                        text: parsedSlides.cover.subtitle,
                        fontSize: subtitleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight: 1.35,
                        fill: '#4b5563',
                        shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.05,
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                    });
                }
                // Add overlays/text last
                coverLayer.add(titleNode);
                coverLayer.add(lineNode);
                if (subtitleNode) coverLayer.add(subtitleNode);
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // Centered, framed, below overlays
                    const imgRatio = imgObj.width / imgObj.height;
                    const stageRatio = sw / sh;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > stageRatio) {
                        drawW = sw * 0.62;
                        drawH = drawW / imgRatio;
                    } else {
                        drawH = sh * 0.48;
                        drawW = drawH * imgRatio;
                    }
                    drawX = sw * 0.55;
                    drawY = sh * 0.22;
                    // Light frame
                    coverLayer.add(new window.Konva.Rect({
                        x: drawX - 18, y: drawY - 18, width: drawW + 36, height: drawH + 36,
                        stroke: '#e6edf3', strokeWidth: 8, cornerRadius: 24, opacity: 0.9
                    }));
                    coverLayer.add(new window.Konva.Image({
                        image: imgObj, x: drawX, y: drawY, width: drawW, height: drawH,
                        opacity: 0.98, cornerRadius: 20, shadowColor: '#000', shadowBlur: 12, shadowOpacity: 0.06
                    }));
                    addCoverTexts();
                };
                imgObj.onerror = () => { addCoverTexts(); };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                addCoverTexts();
            }


            // ---------------- Content Slides ----------------
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();

                // Background soft light gradient + subtle top vignette
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: h,
                    fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: w, y: h },
                    fillLinearGradientColorStops: [0, '#ffffff', 0.5, '#fbfdff', 0.85, '#f8fafc', 1, '#f1f5f9']
                }));
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: 140, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 0, y: 140 }, fillLinearGradientColorStops: [0, 'rgba(0,0,0,0.02)', 1, 'rgba(0,0,0,0)'] }));
                // Hairlines (very subtle)
                for (let x = 0; x < w; x += 100) {
                    layer.add(new window.Konva.Line({ points: [x, 0, x, h], stroke: '#000', strokeWidth: 1, opacity: 0.01 }));
                }

                const slideData = parsedSlides.slides[i - 1];
                const titleText = slideData?.title || `Slide ${i + 1}`;
                // Title with overflow fix
                let titleFontSize = 44;
                const minTitleFontSize = 18;
                const titleX = margin;
                const titleY = margin - 10;
                const titleWidth = w - margin * 2;
                let titleObj = new window.Konva.Text({
                    text: titleText,
                    x: titleX,
                    y: titleY,
                    width: titleWidth,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#0f172a',
                    shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.06,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleObj = new window.Konva.Text({
                        text: titleText,
                        x: titleX,
                        y: titleY,
                        width: titleWidth,
                        fontSize: titleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#0f172a',
                        shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.06,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                    });
                }
                layer.add(titleObj);
                // Underline (soft gray)
                layer.add(new window.Konva.Rect({ x: margin, y: titleY + titleObj.height() + 10, width: Math.min(320, titleText.length * 20), height: 6, cornerRadius: 3, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 320, y: 0 }, fillLinearGradientColorStops: [0, '#cbd5e1', 1, '#94a3b8'], opacity: 0.9 }));

                // --- Bullets as cards, dynamic font sizing/fitting like Classic (light mode colors) ---
                const colWidth = w * 0.52;
                const marginTop = titleY + titleObj.height() + 10 + 6 + 20; // title + underline + gap
                const marginBottom = 60;
                const availableHeight = h - marginTop - marginBottom;
                const bullets = (slideData?.content || []).map(c => c.trim());
                let fontSize = 24;
                let fits = false;
                let textHeights = [];
                const lineHeight = 1.25;
                const blockGap = 18;
                // Enhanced overflowing fix for bullets - try to fit all text nodes, reduce font size if needed (all bullets use same font size)
                while (fontSize >= 14 && !fits) {
                    textHeights = bullets.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            width: colWidth - 54,
                            lineHeight: lineHeight,
                            fontFamily: 'Montserrat, Arial',
                            pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    const blockHeights = textHeights.map(th => th + 32); // text height + padding
                    const totalHeight = blockHeights.reduce((a, b) => a + b, 0) + (bullets.length - 1) * blockGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }
                // If still doesn't fit, use minimum font size and recalc
                if (!fits) {
                    fontSize = 14;
                    textHeights = bullets.map(txt => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            width: colWidth - 54,
                            lineHeight: lineHeight,
                            fontFamily: 'Montserrat, Arial',
                        });
                        return temp.height();
                    });
                }
                // Now render the text nodes and their cards
                let yCursor = marginTop;
                bullets.forEach((txt, idx) => {
                    const blockH = textHeights[idx] + 32;
                    // Card background (very light glass)
                    layer.add(new window.Konva.Rect({
                        x: margin,
                        y: yCursor,
                        width: colWidth - 10,
                        height: blockH,
                        cornerRadius: 18,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: colWidth - 10, y: blockH },
                        fillLinearGradientColorStops: [0, 'rgba(15,23,42,0.02)', 1, 'rgba(15,23,42,0.01)'],
                        stroke: '#e6edf3', strokeWidth: 1.5, shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.04
                    }));
                    // Bullet text (dark)
                    layer.add(new window.Konva.Text({
                        x: margin + 22,
                        y: yCursor + 16,
                        width: colWidth - 54,
                        text: `   ${txt}`,
                        fontSize: fontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight: lineHeight,
                        fill: '#0f172a',
                        shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.02,
                        pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    }));
                    yCursor += blockH + blockGap;
                });

                // --- Right-side image panel (does not overlap title/line) ---
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                const panelX = colWidth + margin + 40;
                const panelW = w - panelX - margin;
                const panelY = margin + 70; // ensure below title/line
                const panelH = h - panelY - 80;
                layer.add(new window.Konva.Rect({
                    x: panelX,
                    y: panelY,
                    width: panelW,
                    height: panelH,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: panelW, y: panelH },
                    fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.98)', 1, 'rgba(255,255,255,0.96)'],
                    cornerRadius: 28,
                    stroke: '#e6edf3', strokeWidth: 1.5, shadowColor: '#000', shadowBlur: 12, shadowOpacity: 0.06
                }));
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Use clipped rounded frame and 'cover' scaling to fill the panel without squishing
                            const frameW = panelW - 60;
                            const frameH = panelH - 60;
                            const frameX = panelX + Math.round((panelW - frameW) / 2);
                            const frameY = panelY + Math.round((panelH - frameH) / 2);

                            // Outer subtle border under the image to match light theme
                            const borderPad = 8;
                            const outerX = frameX - borderPad;
                            const outerY = frameY - borderPad;
                            const outerW = frameW + borderPad * 2;
                            const outerH = frameH + borderPad * 2;
                            const cornerR = 18;

                            layer.add(new window.Konva.Rect({ x: outerX, y: outerY, width: outerW, height: outerH, stroke: '#e6edf3', strokeWidth: 1.5, cornerRadius: cornerR + 4, opacity: 0.9 }));

                            // Clipped group for rounded image area
                            const imgGroup = new window.Konva.Group({
                                x: frameX, y: frameY, clipFunc: function (ctx) {
                                    const w = frameW, h = frameH, r = cornerR;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(w - r, 0);
                                    ctx.quadraticCurveTo(w, 0, w, r);
                                    ctx.lineTo(w, h - r);
                                    ctx.quadraticCurveTo(w, h, w - r, h);
                                    ctx.lineTo(r, h);
                                    ctx.quadraticCurveTo(0, h, 0, h - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // 'cover' scaling so image fills the frame while preserving aspect ratio
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(frameW / imgW, frameH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgInnerX = Math.round((frameW - drawW) / 2);
                            const imgInnerY = Math.round((frameH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgInnerX,
                                y: imgInnerY,
                                width: drawW,
                                height: drawH,
                                cornerRadius: cornerR,
                                opacity: 0.98,
                                shadowColor: '#000', shadowBlur: 12, shadowOpacity: 0.06,
                                filters: [window.Konva.Filters.Brighten, window.Konva.Filters.Contrast],
                                brightness: 0.02,
                                contrast: 0.03,
                                pw_id: SlideStyles._getImagePwId(slideData, parsedSlides)
                            });

                            // Add image into its own top layer so it's above decorations and can receive pointer events
                            imgGroup.add(imageNode);
                            const imgLayer = new window.Konva.Layer();
                            imgLayer.add(imgGroup);
                            // Keep the overlay stroke on the main layer (under the image)
                            layer.add(new window.Konva.Rect({ x: frameX - 8, y: frameY - 8, width: frameW + 16, height: frameH + 16, stroke: '#e6edf3', strokeWidth: 1.5, cornerRadius: cornerR + 4, opacity: 0.9 }));
                            stage.add(imgLayer);
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Page number (subtle, bottom right)
                const numLayer = new window.Konva.Layer();
                numLayer.add(new window.Konva.Text({
                    x: w - 140,
                    y: h - 70,
                    text: i.toString(),
                    fontSize: 54,
                    fontFamily: 'Montserrat, Arial',
                    fill: '#94a3b8',
                    opacity: 0.22,
                    pw_id: undefined
                }));
                stage.add(layer);
                stage.add(numLayer);
                stage.draw();
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderProductShowcase(stages, parsedSlides, slideImagesResult) {
        // Inspired by modern product marketing: clean white space, soft shadows, floating product cards, gradient accents.
        // Logic similar to renderClassic (cover + content, left text / right visual) but with duplicated placeholder product images (2 or 3) per slide.
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // ---------------- Cover Slide ----------------
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Soft diagonal gradient background
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#f8fafc', 0.5, '#f1f5f9', 1, '#e2e8f0']
            }));
            // Large subtle radial highlight behind hero
            coverLayer.add(new window.Konva.Circle({
                x: sw * 0.55, y: sh * 0.5, radius: Math.max(sw, sh) * 0.45,
                fillRadialGradientStartPoint: { x: 0, y: 0 }, fillRadialGradientStartRadius: 0,
                fillRadialGradientEndPoint: { x: 0, y: 0 }, fillRadialGradientEndRadius: Math.max(sw, sh) * 0.45,
                fillRadialGradientColorStops: [0, 'rgba(255,255,255,0.9)', 0.3, 'rgba(255,255,255,0.55)', 0.8, 'rgba(255,255,255,0.05)', 1, 'rgba(255,255,255,0)']
            }));

            // Title & subtitle with overflow fix
            const title = parsedSlides.cover?.title || 'Product Showcase';
            let tSize = Math.min(80, Math.max(52, sw * 0.06));
            const minTitleFontSize = 24;
            const titleX = 80;
            const titleY = sh * 0.28;
            // Reserve space for the hero image on the right so title/subtitle don't overlap it
            const _reservedHeroW = sw * 0.42;
            const _reservedHeroX = sw - _reservedHeroW - 140;
            // compute title width bounded by a minimum and by the reserved hero area
            const titleWidth = Math.max(240, Math.min(sw * 0.5, Math.max(240, _reservedHeroX - titleX - 40)));
            // Title node with overflow fix
            let titleNode = new window.Konva.Text({
                x: titleX, y: titleY, width: titleWidth,
                text: title,
                fontSize: tSize,
                fontFamily: 'Montserrat, Arial', fontStyle: '700', lineHeight: 1.1,
                fill: '#0f172a', shadowColor: '#94a3b8', shadowBlur: 12, shadowOpacity: 0.35
                ,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Reduce font size if title does not fit in one line
            while ((titleNode.height() > titleNode.fontSize() * 1.5) && tSize > minTitleFontSize) {
                tSize -= 2;
                titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth,
                    text: title,
                    fontSize: tSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '700', lineHeight: 1.1,
                    fill: '#0f172a', shadowColor: '#94a3b8', shadowBlur: 12, shadowOpacity: 0.35
                });
            }
            coverLayer.add(titleNode);
            if (parsedSlides.cover?.subtitle) {
                coverLayer.add(new window.Konva.Text({ x: titleX + 2, y: titleY + titleNode.height() + 30, width: Math.max(200, titleWidth - 4), text: parsedSlides.cover.subtitle, fontSize: 30, fontFamily: 'Montserrat, Arial', fill: '#475569', lineHeight: 1.3, pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined }));
            }
            // Cover hero image(s)
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    const heroW = sw * 0.42, heroH = sh * 0.55;
                    const heroX = sw - heroW - 140; const heroY = sh * 0.22;
                    const hero = new window.Konva.Image({ image: imgObj, x: heroX, y: heroY, width: heroW, height: heroH, cornerRadius: 40, shadowColor: '#0f172a', shadowBlur: 40, shadowOpacity: 0.3, pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides) });
                    // Two floating duplicates (scaled / rotated) for depth
                    const ghost1 = new window.Konva.Image({ image: imgObj, x: heroX - 60, y: heroY + 40, width: heroW * 0.55, height: heroH * 0.55, opacity: 0.18, rotation: -8, cornerRadius: 30, shadowColor: '#6366f1', shadowBlur: 30, shadowOpacity: 0.4, pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides) });
                    const ghost2 = new window.Konva.Image({ image: imgObj, x: heroX + heroW * 0.15, y: heroY - 50, width: heroW * 0.35, height: heroH * 0.35, opacity: 0.22, rotation: 10, cornerRadius: 24, shadowColor: '#ec4899', shadowBlur: 30, shadowOpacity: 0.35, pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides) });
                    coverLayer.add(ghost1); coverLayer.add(ghost2); coverLayer.add(hero);
                    coverStage.add(coverLayer); coverStage.draw();
                }; imgObj.src = slideImagesResult.coverImage;
            } else {
                // Placeholder product card stack
                const cardW = sw * 0.24; const cardH = sh * 0.42; const baseX = sw - cardW - 160; const baseY = sh * 0.28;
                for (let c = 0; c < 3; c++) coverLayer.add(new window.Konva.Rect({ x: baseX + c * 30, y: baseY - c * 24, width: cardW, height: cardH, cornerRadius: 36, fill: '#ffffff', stroke: '#e2e8f0', strokeWidth: 2, shadowColor: '#94a3b8', shadowBlur: 25, shadowOpacity: 0.25, opacity: 0.9 - c * 0.2 }));
                coverStage.add(coverLayer); coverStage.draw();
            }

            // Feature badges - positioned at bottom-left, bottom-center and bottom-right with a gap from bottom
            const features = [
                (window.Lang ? Lang.get('featureHighQuality') : 'High Quality'),
                (window.Lang ? Lang.get('featureFastShipping') : 'Fast Shipping'),
                (window.Lang ? Lang.get('featurePremiumSupport') : 'Premium Support')
            ];
            const badgeGapBottom = 72; // space from bottom of stage
            const bw = 280; const bh = 54;
            const leftX = 80;
            const centerX = Math.round((sw - bw) / 2);
            const rightX = Math.round(sw - 80 - bw);
            const by = Math.round(sh - badgeGapBottom - bh);
            features.forEach((f, idx) => {
                const g = new window.Konva.Group();
                let bx = leftX;
                if (idx === 1) bx = centerX;
                else if (idx === 2) bx = rightX;
                // decorative rounded rect
                g.add(new window.Konva.Rect({ x: bx, y: by, width: bw, height: bh, cornerRadius: 18, fillLinearGradientStartPoint: { x: bx, y: by }, fillLinearGradientEndPoint: { x: bx + bw, y: by + bh }, fillLinearGradientColorStops: [0, 'rgba(59,130,246,0.15)', 1, 'rgba(236,72,153,0.15)'], stroke: 'rgba(99,102,241,0.35)', strokeWidth: 1, shadowColor: '#6366f1', shadowBlur: 14, shadowOpacity: 0.3 }));
                // small accent circle
                g.add(new window.Konva.Circle({ x: bx + 40, y: by + bh / 2, radius: 18, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 36, y: 36 }, fillLinearGradientColorStops: [0, '#3b82f6', 1, '#6366f1'], shadowColor: '#3b82f6', shadowBlur: 12, shadowOpacity: 0.5 }));
                // text (decorative)
                g.add(new window.Konva.Text({ x: bx + 70, y: by + bh / 2 - 14, width: bw - 90, text: f, fontSize: 20, fontFamily: 'Montserrat, Arial', fontStyle: '600', fill: '#1e293b', pw_id: undefined }));
                coverLayer.add(g);
            });

            if (!slideImagesResult?.coverImage) { coverStage.add(coverLayer); coverStage.draw(); }

            // ---------------- Content Slides ----------------
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const w = stage.width(); const h = stage.height();
                const layer = new window.Konva.Layer();

                // Background: clean card on light neutral
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: '#f8fafc' }));
                layer.add(new window.Konva.Rect({ x: 24, y: 24, width: w - 48, height: h - 48, cornerRadius: 40, fill: '#ffffff', shadowColor: '#94a3b8', shadowBlur: 35, shadowOpacity: 0.25 }));

                const slideData = parsedSlides.slides[i - 1];
                const titleText = slideData?.title || `Slide ${i + 1}`;
                // Title with overflow fix
                let titleFontSize = 50;
                const minTitleFontSize = 18;
                const titleX = margin;
                const titleY = margin + 10;
                const titleWidth = w - margin * 2;
                let titleObj = new window.Konva.Text({
                    x: titleX, y: titleY,
                    text: titleText,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#0f172a',
                    width: titleWidth,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleObj = new window.Konva.Text({
                        x: titleX, y: titleY,
                        text: titleText,
                        fontSize: titleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#0f172a',
                        width: titleWidth,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                    });
                }
                layer.add(titleObj);
                layer.add(new window.Konva.Rect({ x: margin, y: titleY + titleObj.height() + 8, width: Math.min(360, titleText.length * 22), height: 8, cornerRadius: 4, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 360, y: 0 }, fillLinearGradientColorStops: [0, '#3b82f6', 0.5, '#6366f1', 1, '#ec4899'], opacity: 0.9 }));

                // Bullet list (features / selling points) with comprehensive overflow fix
                const bullets = (slideData?.content || []).map(s => s.trim());
                const colWidth = w * 0.42;
                const contentStartY = titleY + titleObj.height() + 8 + 8 + 20; // title + underline + gap
                const chipGap = 18;
                let baseFont = 24;
                const chipMinH = 60;
                const marginBottom = 60;
                const availableHeight = h - contentStartY - marginBottom;

                // Enhanced overflowing fix for bullets - calculate available space and reduce font size if needed
                let fits = false;
                let textHeights = [];
                let chipHeights = [];
                while (baseFont >= 14 && !fits) {
                    textHeights = bullets.map(txt => {
                        const temp = new window.Konva.Text({
                            text: txt,
                            fontSize: baseFont,
                            fontFamily: 'Montserrat, Arial',
                            width: colWidth - 140,
                            lineHeight: 1.25,
                            pw_id: undefined
                        });
                        return temp.height();
                    });
                    chipHeights = textHeights.map(th => Math.max(chipMinH, th + 28));
                    const totalHeight = chipHeights.reduce((a, b) => a + b, 0) + (bullets.length - 1) * chipGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) baseFont -= 2;
                }

                // If still doesn't fit, use minimum font size and recalc
                if (!fits) {
                    baseFont = 14;
                    textHeights = bullets.map(txt => {
                        const temp = new window.Konva.Text({
                            text: txt,
                            fontSize: baseFont,
                            fontFamily: 'Montserrat, Arial',
                            width: colWidth - 140,
                            lineHeight: 1.25,
                            pw_id: undefined
                        });
                        return temp.height();
                    });
                    chipHeights = textHeights.map(th => Math.max(chipMinH, th + 28));
                }

                let yCursor = contentStartY;
                bullets.forEach((txt, idx) => {
                    const chipH = chipHeights[idx];

                    // Card background (top-level, not wrapped in a Group)
                    layer.add(new window.Konva.Rect({
                        x: margin,
                        y: yCursor,
                        width: colWidth,
                        height: chipH,
                        cornerRadius: 26,
                        fill: 'rgba(59,130,246,0.07)',
                        stroke: 'rgba(99,102,241,0.35)',
                        strokeWidth: 1,
                        shadowColor: '#6366f1',
                        shadowBlur: 12,
                        shadowOpacity: 0.25
                    }));

                    // Accent circle (top-level)
                    const circleCx = margin + 46;
                    const circleCy = yCursor + chipH / 2;
                    const circleR = 22;
                    layer.add(new window.Konva.Circle({
                        x: circleCx,
                        y: circleCy,
                        radius: circleR,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: 44, y: 44 },
                        fillLinearGradientColorStops: [0, '#3b82f6', 1, '#6366f1'],
                        shadowColor: '#3b82f6',
                        shadowBlur: 10,
                        shadowOpacity: 0.5
                    }));

                    // Number inside circle (top-level text node)
                    const numText = new window.Konva.Text({
                        text: (idx + 1).toString(),
                        x: circleCx - circleR,
                        y: yCursor,
                        width: circleR * 2,
                        fontSize: 22,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#ffffff',
                        align: 'center'
                        , pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    });
                    numText.y(Math.round(circleCy - numText.height() / 2));
                    layer.add(numText);

                    // Bullet text (top-level)
                    layer.add(new window.Konva.Text({
                        x: margin + 80,
                        y: yCursor + (chipH - textHeights[idx]) / 2 - 2,
                        width: colWidth - 120,
                        text: txt,
                        fontSize: baseFont,
                        fontFamily: 'Montserrat, Arial',
                        fill: '#334155',
                        lineHeight: 1.25,
                        pw_id: (slideData && slideData._pw && slideData._pw.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    }));

                    yCursor += chipH + chipGap;
                });

                // Product image mosaic on right
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                const mosaicX = colWidth + margin + 120;
                const mosaicW = w - mosaicX - margin - 40;
                // Ensure mosaic Y starts below the title / content column to avoid overlap
                const mosaicY = Math.max(contentStartY, margin + 40);
                const mosaicH = h - mosaicY - 160;
                // Placeholder frames first (so layout exists even if no image)
                const even = (i % 2 === 0);
                if (even) {
                    // 3 images layout: large left, two stacked right
                    const bigW = mosaicW * 0.55; const bigH = mosaicH;
                    // use slightly reduced corner radii so outer decorative frame matches clipped image rounding
                    layer.add(new window.Konva.Rect({ x: mosaicX, y: mosaicY, width: bigW, height: bigH, cornerRadius: 32, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 2 }));
                    const smallW = mosaicW - bigW - 40; const smallH = (mosaicH - 40) / 2;
                    for (let s = 0; s < 2; s++) layer.add(new window.Konva.Rect({ x: mosaicX + bigW + 40, y: mosaicY + s * (smallH + 40), width: smallW, height: smallH, cornerRadius: 24, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 2 }));
                } else {
                    // 2 images layout: side by side equal
                    const cardW = (mosaicW - 40) / 2; const cardH = mosaicH;
                    for (let s = 0; s < 2; s++) layer.add(new window.Konva.Rect({ x: mosaicX + s * (cardW + 40), y: mosaicY, width: cardW, height: cardH, cornerRadius: 32, fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 2 }));
                }

                stage.add(layer); stage.draw();

                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            const clones = [];
                            if (even) {
                                const bigW = mosaicW * 0.55; const bigH = mosaicH; const bigX = mosaicX; const bigY = mosaicY;
                                clones.push({ x: bigX, y: bigY, w: bigW, h: bigH, r: 40 });
                                const smallW = mosaicW - bigW - 40; const smallH = (mosaicH - 40) / 2; const sx = mosaicX + bigW + 40;
                                clones.push({ x: sx, y: mosaicY, w: smallW, h: smallH, r: 32 });
                                clones.push({ x: sx, y: mosaicY + smallH + 40, w: smallW, h: smallH, r: 32 });
                            } else {
                                const cardW = (mosaicW - 40) / 2; const cardH = mosaicH;
                                clones.push({ x: mosaicX, y: mosaicY, w: cardW, h: cardH, r: 40 });
                                clones.push({ x: mosaicX + cardW + 40, y: mosaicY, w: cardW, h: cardH, r: 40 });
                            }
                            clones.forEach(cfg => {
                                // Fit image inside cfg box using a clipped Group (cover scaling) to preserve aspect ratio and avoid squishing
                                const pad = 8;
                                const frameX = cfg.x + pad;
                                const frameY = cfg.y + pad;
                                const frameW = cfg.w - pad * 2;
                                const frameH = cfg.h - pad * 2;
                                // Make the inner clipped corner visually match the outer decorative frame.
                                // Subtract the small padding so the radius scales with the inset, but keep a sensible minimum.
                                const cornerR = Math.max(4, cfg.r - pad);

                                // 'cover' scaling: image fills frame and crops overflow
                                const imgW = imgObj.width || 1;
                                const imgH = imgObj.height || 1;
                                const scale = Math.max(frameW / imgW, frameH / imgH);
                                const drawW = Math.round(imgW * scale);
                                const drawH = Math.round(imgH * scale);
                                const imgX = Math.round((frameW - drawW) / 2);
                                const imgY = Math.round((frameH - drawH) / 2);

                                const imgGroup = new window.Konva.Group({
                                    x: frameX, y: frameY, clipFunc: function (ctx) {
                                        const fsw = frameW, fsh = frameH, r = cornerR;
                                        ctx.beginPath();
                                        ctx.moveTo(r, 0);
                                        ctx.lineTo(fsw - r, 0);
                                        ctx.quadraticCurveTo(fsw, 0, fsw, r);
                                        ctx.lineTo(fsw, fsh - r);
                                        ctx.quadraticCurveTo(fsw, fsh, fsw - r, fsh);
                                        ctx.lineTo(r, fsh);
                                        ctx.quadraticCurveTo(0, fsh, 0, fsh - r);
                                        ctx.lineTo(0, r);
                                        ctx.quadraticCurveTo(0, 0, r, 0);
                                        ctx.closePath();
                                    }
                                });

                                const imageNode = new window.Konva.Image({
                                    image: imgObj,
                                    x: imgX,
                                    y: imgY,
                                    width: drawW,
                                    height: drawH,
                                    cornerRadius: cornerR,
                                    shadowColor: '#0f172a',
                                    shadowBlur: 25,
                                    shadowOpacity: 0.25,
                                    pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                                });

                                imgGroup.add(imageNode);
                                layer.add(imgGroup);
                            });
                            stage.draw(); res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Page / slide number
                const numLayer = new window.Konva.Layer();
                numLayer.add(new window.Konva.Text({ x: w - 140, y: h - 90, text: i.toString(), fontSize: 58, fontFamily: 'Montserrat, Arial', fill: '#94a3b8', opacity: 0.25, pw_id: undefined }));
                stage.add(numLayer);
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderFinance(stages, parsedSlides, slideImagesResult) {
        // Emerald, gold, deep blue, geometric overlays, subtle currency motifs
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];
            // Cover slide (stage index 0)
            const coverStage = stages[0];
            const coverLayer = new window.Konva.Layer();
            const sw = coverStage.width();
            const sh = coverStage.height();
            // --- Background: deep blue to emerald gradient ---
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#0f2137', 0.5, '#1e3a34', 1, '#1de9b6']
            }));
            // --- Gold accent arc (top right) ---
            coverLayer.add(new window.Konva.Arc({
                x: sw * 0.85, y: sh * 0.18, innerRadius: 0, outerRadius: 180,
                angle: 120, rotation: 30, fill: '#ffd700', opacity: 0.13,
                shadowColor: '#ffd700', shadowBlur: 30, shadowOpacity: 0.18
            }));

            // --- Title and subtitle with overflow fix ---
            const title = parsedSlides.cover?.title || 'Finance SlideForge';
            const subtitle = parsedSlides.cover?.subtitle || '';
            let titleFontSize = 68;
            const minTitleFontSize = 24;
            const titleX = 80;
            // push title up 200px to avoid overlapping the decorative artwork
            const titleY = (sh / 2 - 160) - 100;

            // Reserve horizontal space on the right for the cover image so title/subtitle won't overlap
            // Estimate the cover frame geometry (must match placement used when image loads) and account for scaling
            const _frameW_est = Math.round(sw * 0.32);
            const _frameH_est = Math.round(sh * 0.38);
            const _frameX_est = Math.round(sw - _frameW_est - 90);
            const _padding_est = 12; // matches padding used for the decorative ring

            const _scaleFactor_est = 2; // matches the scale applied to the circular artwork

            const _baseDiameter_est = Math.min(_frameW_est, _frameH_est);
            const _diameter_est = _baseDiameter_est * _scaleFactor_est;
            const _innerRadius_est = Math.round(_diameter_est / 2);
            const _centerX_est = Math.round(_frameX_est + _frameW_est / 2);
            // make the decorative frame diameter exactly 3px larger than the image mask
            const _outerRadius_est = _innerRadius_est + 1.5;

            // reservedRight is the x-coordinate we must not cross with title/subtitle (add small gap)
            const reservedRight = Math.min(sw - 40, _centerX_est + _outerRadius_est + 24);
            const titleWidth = Math.max(220, Math.min(sw - 160, reservedRight - titleX - 20));

            // Title node with overflow fix (left-aligned so title and subtitle share same starting x)
            let titleNode = new window.Konva.Text({
                text: title,
                x: titleX,
                y: titleY,
                width: titleWidth,
                fontSize: titleFontSize,
                fontFamily: 'Montserrat, Arial',
                fontStyle: 'bold',
                align: 'left',
                fill: '#fff',
                shadowColor: '#000',
                shadowBlur: 16,
                shadowOpacity: 0.22,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Reduce font size if title does not fit in one line
            while ((titleNode.height() > titleNode.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                titleFontSize -= 2;
                titleNode = new window.Konva.Text({
                    text: title,
                    x: titleX,
                    y: titleY,
                    width: titleWidth,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: 'bold',
                    align: 'left',
                    fill: '#fff',
                    shadowColor: '#000',
                    shadowBlur: 16,
                    shadowOpacity: 0.22,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            }
            coverLayer.add(titleNode);

            // Subtitle (left-aligned to the same starting x as title)
            if (subtitle) {
                let subtitleFontSize = 28;
                const minSubtitleFontSize = 12;
                const subtitleX = titleX;
                const subtitleY = titleY + titleNode.height() + 12;
                let subtitleNode = new window.Konva.Text({
                    text: subtitle,
                    x: subtitleX,
                    y: subtitleY,
                    width: titleWidth,
                    fontSize: subtitleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    align: 'left',
                    fill: '#fff',
                    opacity: 0.92,
                    shadowColor: '#000',
                    shadowBlur: 12,
                    shadowOpacity: 0.14,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : undefined
                });
                while ((subtitleNode.height() > subtitleNode.fontSize() * 1.6) && subtitleFontSize > minSubtitleFontSize) {
                    subtitleFontSize -= 2;
                    subtitleNode = new window.Konva.Text({
                        text: subtitle,
                        x: subtitleX,
                        y: subtitleY,
                        width: titleWidth,
                        fontSize: subtitleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        align: 'left',
                        fill: '#fff',
                        opacity: 0.92,
                        shadowColor: '#000',
                        shadowBlur: 12,
                        shadowOpacity: 0.14,
                        pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : undefined
                    });
                }
                coverLayer.add(subtitleNode);
            }
            // --- Optional cover image (bottom right, clipped in gold circle) ---
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // Frame geometry (place at bottom-right)
                    const frameW = Math.round(sw * 0.32);
                    const frameH = Math.round(sh * 0.38);
                    const frameX = Math.round(sw - frameW - 90);
                    const frameY = Math.round(sh - frameH - 80);
                    const padding = 12; // decorative stroke/padding outside clipped area

                    // Make the visible area a circle: use the smaller of frameW/frameH as base diameter
                    const baseDiameter = Math.min(frameW, frameH);

                    // Scale everything by 200%
                    const scaleFactor = 2; // 200%
                    const diameter = baseDiameter * scaleFactor;
                    const innerRadius = Math.round(diameter / 2);
                    const centerX = Math.round(frameX + frameW / 2);
                    const centerY = Math.round(frameY + frameH / 2);
                    // make the decorative frame diameter exactly 3px larger than the image mask
                    const outerRadius = innerRadius + 1.5;

                    // Decorative outer circle (stroke) placed so the ring is 3px thick in total
                    const outerCircle = new window.Konva.Circle({
                        x: centerX,
                        y: centerY,
                        radius: outerRadius,
                        stroke: '#ffd700',
                        strokeWidth: 3,
                        fill: 'transparent',
                        opacity: 0.85
                    });

                    // Clipped group: draw circular clip path exactly the visible circle size
                    const imgGroup = new window.Konva.Group({
                        x: centerX - innerRadius, y: centerY - innerRadius, clipFunc: function (ctx) {
                            const r = innerRadius;
                            ctx.beginPath();
                            ctx.arc(r, r, r, 0, Math.PI * 2);
                            ctx.closePath();
                        }
                    });

                    // Compute 'cover' scaling so the image fills the circular frame and crops overflow
                    const nativeW = imgObj.width || 1;
                    const nativeH = imgObj.height || 1;
                    const scale = Math.max(diameter / nativeW, diameter / nativeH);
                    const drawW = Math.round(nativeW * scale);
                    const drawH = Math.round(nativeH * scale);
                    const imgOffsetX = Math.round((diameter - drawW) / 2);
                    const imgOffsetY = Math.round((diameter - drawH) / 2);

                    const imageNode = new window.Konva.Image({
                        image: imgObj,
                        x: imgOffsetX,
                        y: imgOffsetY,
                        width: drawW,
                        height: drawH,
                        opacity: 0.93,
                        shadowColor: '#000',
                        shadowBlur: 18 * scaleFactor,
                        shadowOpacity: 0.18,
                        pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                    });

                    // Add decorative outer stroke under the clipped circular image so stroke remains visible
                    coverLayer.add(outerCircle);
                    imgGroup.add(imageNode);
                    coverLayer.add(imgGroup);
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.onerror = () => {
                    coverStage.add(coverLayer);
                    coverStage.draw();
                };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                coverStage.add(coverLayer);
                coverStage.draw();
            }
            // --- Content slides ---
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();
                // --- Emerald/blue gradient background ---
                layer.add(new window.Konva.Rect({
                    x: 0, y: 0, width: w, height: h,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: w, y: h },
                    fillLinearGradientColorStops: [0, '#006450ff', 0.5, '#004e41ff', 1, '#003a2cff']
                }));
                // --- Gold accent bar (left) ---
                layer.add(new window.Konva.Rect({
                    x: margin - 18, y: margin, width: 3, height: h - margin * 2,
                    fill: '#f6f3e0ff', cornerRadius: 6, opacity: 0.85
                }));
                // --- Title with overflow fix ---
                const slideData = parsedSlides.slides[i - 1];
                const titleText = slideData?.title || `Slide ${i + 1}`;
                let titleFontSize = 44;
                const minTitleFontSize = 18;
                const titleX = margin + 10;
                const titleY = margin;
                const titleWidth = w - margin * 2 - 30;
                let titleObj = new window.Konva.Text({
                    text: titleText,
                    x: titleX,
                    y: titleY,
                    width: titleWidth,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: 'bold',
                    fill: '#e3f6f5ff',
                    shadowColor: '#ffd700',
                    shadowBlur: 8,
                    shadowOpacity: 0.18,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleObj.height() > titleObj.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleObj = new window.Konva.Text({
                        text: titleText,
                        x: titleX,
                        y: titleY,
                        width: titleWidth,
                        fontSize: titleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: 'bold',
                        fill: '#e3f6f5ff',
                        shadowColor: '#ffd700',
                        shadowBlur: 8,
                        shadowOpacity: 0.18,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                    });
                }
                layer.add(titleObj);
                // --- Underline (emerald) positioned based on actual title height ---
                layer.add(new window.Konva.Rect({
                    x: titleX,
                    y: titleY + titleObj.height() + 6,
                    width: 220,
                    height: 5,
                    fill: '#1de9b6',
                    cornerRadius: 2
                }));
                // --- Content bullets (left column) with comprehensive overflow fix ---
                const contentWidth = (w * 0.55) - margin * 1.0;
                const contentStartY = titleY + titleObj.height() + 6 + 5 + 20; // title + underline + gap
                const bullets = (slideData?.content || []).map(c => c.trim());
                const marginBottom = 60;
                const availableHeight = h - contentStartY - marginBottom;
                const betweenGap = 16; // gap between bullet lines

                // Enhanced overflowing fix for bullets - calculate available space and reduce font size if needed
                let fontSize = 26;
                let fits = false;
                let textHeights = [];
                while (fontSize >= 14 && !fits) {
                    textHeights = bullets.map(txt => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: contentWidth,
                            lineHeight: 1.28,
                            pw_id: undefined
                        });
                        return temp.height();
                    });
                    const totalHeight = textHeights.reduce((a, b) => a + b, 0) + (bullets.length - 1) * betweenGap;
                    fits = totalHeight <= availableHeight;
                    if (!fits) fontSize -= 2;
                }

                // If still doesn't fit, use minimum font size and recalc
                if (!fits) {
                    fontSize = 14;
                    textHeights = bullets.map(txt => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: fontSize,
                            fontFamily: 'Montserrat, Arial',
                            width: contentWidth,
                            lineHeight: 1.28,
                            pw_id: undefined
                        });
                        return temp.height();
                    });
                }

                // Now render the text nodes with calculated font size and spacing
                let yCursor = contentStartY;
                bullets.forEach((txt, idx) => {
                    const textObj = new window.Konva.Text({
                        text: `   ${txt}`,
                        x: margin + 10,
                        y: yCursor,
                        width: contentWidth,
                        fontSize: fontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight: 1.28,
                        fill: '#e3f6f5ff',
                        shadowColor: '#ffd700',
                        shadowBlur: 4,
                        shadowOpacity: 0.10,
                        pw_id: (slideData && slideData._pw && slideData._pw.contentIds && typeof idx !== 'undefined' && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    });
                    layer.add(textObj);
                    yCursor += textHeights[idx] + betweenGap;
                });
                // --- Image (right column, in gold frame) ---
                const imgIndex = i - 1;
                const base64 = slideImagesResult?.slideImages?.[imgIndex];
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            const imgMaxW = w - (contentWidth + margin * 3);
                            const imgMaxH = h - (margin * 2);
                            let drawW = imgObj.width;
                            let drawH = imgObj.height;
                            const ratio = Math.min(imgMaxW / drawW, imgMaxH / drawH, 1);
                            drawW *= ratio; drawH *= ratio;

                            // ensure image is placed below the title/underline area
                            const imageY = Math.max(margin, contentStartY + 10);

                            // Gold frame (positioned relative to computed imageY)
                            layer.add(new window.Konva.Rect({
                                x: contentWidth + margin * 2 - 10,
                                y: imageY - 10,
                                width: drawW + 20,
                                height: drawH + 20,
                                stroke: '#f6f3e0ff',
                                strokeWidth: 3,
                                cornerRadius: 18,
                                opacity: 0.85
                            }));
                            layer.add(new window.Konva.Image({
                                image: imgObj,
                                x: contentWidth + margin * 2,
                                y: imageY,
                                width: drawW,
                                height: drawH,
                                cornerRadius: 14,
                                opacity: 0.97,
                                shadowColor: '#000',
                                shadowBlur: 12,
                                shadowOpacity: 0.13,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            }));
                            stage.add(layer);
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { stage.add(layer); stage.draw(); res(); };
                    }));
                    imgObj.src = base64;
                } else {
                    stage.add(layer);
                    stage.draw();
                }
            }
            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderData(stages, parsedSlides, slideImagesResult) {
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // --- Cover Slide ---
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // helper to add all cover graphics; if bgImg is provided it will be drawn to cover the whole slide
            const addCoverGraphics = (bgImg) => {
                // background: either full-cover image or gradient
                if (bgImg) {
                    const imgRatio = bgImg.width / bgImg.height;
                    const stageRatio = sw / sh;
                    let drawW, drawH, drawX, drawY;
                    if (imgRatio > stageRatio) {
                        drawH = sh;
                        drawW = bgImg.width * (sh / bgImg.height);
                        drawX = (sw - drawW) / 2;
                        drawY = 0;
                    } else {
                        drawW = sw;
                        drawH = bgImg.height * (sw / bgImg.width);
                        drawX = 0;
                        drawY = (sh - drawH) / 2;
                    }
                    coverLayer.add(new window.Konva.Image({
                        image: bgImg,
                        x: drawX,
                        y: drawY,
                        width: drawW,
                        height: drawH,
                        opacity: 0.92,
                        pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides)
                    }));
                    // subtle gradient overlay for readability on top of the image
                    coverLayer.add(new window.Konva.Rect({
                        x: 0, y: 0, width: sw, height: sh,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: sw, y: sh },
                        // increased opacity stops for stronger overlay
                        fillLinearGradientColorStops: [0, 'rgba(30,58,138,0.85)', 0.6, 'rgba(49,46,129,0.85)', 1, 'rgba(14,78,138,0.85)']
                    }));
                } else {
                    // original gradient background
                    coverLayer.add(new window.Konva.Rect({
                        x: 0, y: 0, width: sw, height: sh,
                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                        fillLinearGradientEndPoint: { x: sw, y: sh },
                        fillLinearGradientColorStops: [0, '#0f172a', 0.4, '#312e81', 0.75, '#1e3a8a', 1, '#0d9488']
                    }));
                }

                // Faint grid overlay (light lines)
                const gridGap = 90;
                for (let gx = 0; gx <= sw; gx += gridGap) {
                    coverLayer.add(new window.Konva.Line({ points: [gx, 0, gx, sh], stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }));
                }
                for (let gy = 0; gy <= sh; gy += gridGap) {
                    coverLayer.add(new window.Konva.Line({ points: [0, gy, sw, gy], stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }));
                }
                // Concentric analytic rings (center right)
                const ringCenterX = sw * 0.72;
                const ringCenterY = sh * 0.52;
                [160, 120, 80, 40].forEach((r, i) => {
                    coverLayer.add(new window.Konva.Circle({ x: ringCenterX, y: ringCenterY, radius: r, stroke: ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b'][i], strokeWidth: r === 160 ? 2 : 1, opacity: 0.15 }));
                });

                // Measure title and subtitle to reserve space and avoid chart overlap
                const measureTitleText = parsedSlides.cover?.title || 'Data & Insights';
                let measureTitleFontSize = Math.min(78, Math.max(52, sw * 0.055));
                const measureMinTitleFontSize = 24;
                const measureTitleWidth = sw * 0.55;
                const measureTitleX = Math.round((sw - measureTitleWidth) / 2);
                const measureTitleY = sh * 0.23;
                let measureTitleNode = new window.Konva.Text({
                    x: measureTitleX, y: measureTitleY, width: measureTitleWidth,
                    text: measureTitleText,
                    fontSize: measureTitleFontSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '700', lineHeight: 1.1,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
                while ((measureTitleNode.height() > measureTitleNode.fontSize() * 1.5) && measureTitleFontSize > measureMinTitleFontSize) {
                    measureTitleFontSize -= 2;
                    measureTitleNode.fontSize(measureTitleFontSize);
                }
                // measure subtitle if present
                let measureSubtitleHeight = 0;
                const measureSubtitleText = parsedSlides.cover?.subtitle;
                if (measureSubtitleText) {
                    let measureSubtitleFont = 30;
                    const measureMinSubtitleFont = 12;
                    const measureSubtitleWidth = sw * 0.48;
                    const measureSubtitleX = Math.round((sw - measureSubtitleWidth) / 2);
                    const measureSubtitleNode = new window.Konva.Text({
                        x: measureSubtitleX, y: measureTitleY + measureTitleNode.height() + 12, width: measureSubtitleWidth,
                        text: measureSubtitleText,
                        fontSize: measureSubtitleFont,
                        fontFamily: 'Montserrat, Arial', lineHeight: 1.3
                    });
                    while ((measureSubtitleNode.height() > measureSubtitleNode.fontSize() * 1.6) && measureSubtitleFont > measureMinSubtitleFont) {
                        measureSubtitleFont -= 2;
                        measureSubtitleNode.fontSize(measureSubtitleFont);
                    }
                    measureSubtitleHeight = measureSubtitleNode.height();
                }
                const titleBlockBottom = measureTitleY + measureTitleNode.height() + (measureSubtitleHeight ? measureSubtitleHeight + 12 : 0);

                // Title with overflow fix
                const title = parsedSlides.cover?.title || 'Data & Insights';
                let titleFontSize = Math.min(78, Math.max(52, sw * 0.055));
                const minTitleFontSize = 24;
                const titleWidth = sw * 0.55;
                const titleX = Math.round((sw - titleWidth) / 2);
                const titleY = sh * 0.23;
                // Title node with overflow fix
                let titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth,
                    text: title,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '700', lineHeight: 1.1,
                    fill: '#f8fafc', shadowColor: '#000', shadowBlur: 16, shadowOpacity: 0.32,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
                // Reduce font size if title does not fit in one line
                while ((titleNode.height() > titleNode.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleNode = new window.Konva.Text({
                        x: titleX, y: titleY, width: titleWidth,
                        text: title,
                        fontSize: titleFontSize,
                        fontFamily: 'Montserrat, Arial', fontStyle: '700', lineHeight: 1.1,
                        fill: '#f8fafc', shadowColor: '#000', shadowBlur: 16, shadowOpacity: 0.32
                    });
                }
                coverLayer.add(titleNode);
                // Subtitle
                let subtitleNode = null;
                if (parsedSlides.cover?.subtitle) {
                    // Target max width leaving 100px gap on both sides
                    const sideGap = 100;
                    const maxSubtitleWidth = Math.max(80, sw - sideGap * 2);

                    // prefer an initial compact width but never exceed the side-gap constrained width
                    const preferredWidth = Math.min(sw * 0.48, maxSubtitleWidth);
                    let subtitleFont = 30;
                    const minSubtitleFont = 12;

                    // compute Y based on the rendered title so subtitle sits directly below it
                    const subtitleY = titleY + titleNode.height() + 12;

                    // create a measuring text and reduce font until it fits on one line or hit min font
                    let subtitleX = Math.round((sw - preferredWidth) / 2);
                    let temp = new window.Konva.Text({ x: subtitleX, y: subtitleY, width: preferredWidth, text: parsedSlides.cover.subtitle, fontSize: subtitleFont, fontFamily: 'Montserrat, Arial', lineHeight: 1.3, pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined });
                    // single-line target: measured height should be close to fontSize * lineHeight
                    while (subtitleFont > minSubtitleFont && temp.height() > subtitleFont * 1.35) {
                        subtitleFont -= 2;
                        temp.fontSize(subtitleFont);
                    }

                    // If we hit min font and it's still wrapped, allow multi-line but ensure side gaps by using maxSubtitleWidth
                    if (subtitleFont === minSubtitleFont && temp.height() > subtitleFont * 1.35) {
                        const multiWidth = maxSubtitleWidth;
                        subtitleX = Math.round((sw - multiWidth) / 2);
                        temp = new window.Konva.Text({ x: subtitleX, y: subtitleY, width: multiWidth, text: parsedSlides.cover.subtitle, fontSize: subtitleFont, fontFamily: 'Montserrat, Arial', lineHeight: 1.3, pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined });
                    }

                    // Final subtitle node
                    subtitleNode = new window.Konva.Text({ x: temp.x(), y: temp.y(), width: temp.width(), text: parsedSlides.cover.subtitle, fontSize: subtitleFont, fontFamily: 'Montserrat, Arial', lineHeight: 1.3, fill: '#cbd5e1', shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.25, pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined });
                    coverLayer.add(subtitleNode);
                }
                // Accent bar
                const accentW = 240;
                const accentX = Math.round((sw - accentW) / 2);
                coverLayer.add(new window.Konva.Rect({ x: accentX, y: sh * 0.23 + 100, width: accentW, height: 8, cornerRadius: 4, fillLinearGradientStartPoint: { x: accentX, y: 0 }, fillLinearGradientEndPoint: { x: accentX + accentW, y: 0 }, fillLinearGradientColorStops: [0, '#6366f1', 0.5, '#06b6d4', 1, '#f59e0b'] }));

                // Now render the Dynamic line chart motif using actual title/subtitle sizes so it never overlaps
                (function renderDynamicChart() {
                    const chartPoints = [];
                    const chartW = sw * 0.5;
                    const chartH = sh * 0.28;
                    const chartGap = 100; // extra spacing between title block and top of chart
                    const baseX = Math.round((sw - chartW) / 2);

                    // compute actual title block bottom using the rendered titleNode and subtitleNode
                    const actualTitleY = titleY;
                    const actualTitleH = titleNode ? titleNode.height() : measureTitleNode.height();
                    const actualSubtitleH = subtitleNode ? subtitleNode.height() : 0;
                    const actualTitleBlockBottom = actualTitleY + actualTitleH + (actualSubtitleH ? actualSubtitleH + 12 : 0);

                    // natural placement and enforced minimum so chart top stays below title block + gap
                    const naturalBaseY = sh * 0.62;
                    const minBaseY = actualTitleBlockBottom + chartH + chartGap;
                    let baseY = Math.max(naturalBaseY, minBaseY);
                    baseY = Math.min(baseY, sh - 40);

                    const steps = 10;
                    for (let i = 0; i <= steps; i++) {
                        const x = baseX + (chartW / steps) * i;
                        const y = baseY - (Math.sin(i * 0.9) + 1) / 2 * chartH * 0.85 - 20 - (Math.random() * 25);
                        chartPoints.push(x, y);
                    }
                    coverLayer.add(new window.Konva.Line({ points: chartPoints, stroke: '#38bdf8', strokeWidth: 5, lineJoin: 'round', lineCap: 'round', shadowColor: '#38bdf8', shadowBlur: 12, opacity: 0.9 }));
                    coverLayer.add(new window.Konva.Line({ points: [...chartPoints, baseX + chartW, baseY, baseX, baseY], fill: 'rgba(56,189,248,0.18)', closed: true, strokeEnabled: false }));
                    for (let i = 0; i < chartPoints.length; i += 2) {
                        coverLayer.add(new window.Konva.Circle({ x: chartPoints[i], y: chartPoints[i + 1], radius: 6, fill: '#f59e0b', shadowColor: '#f59e0b', shadowBlur: 10, opacity: 0.9 }));
                    }
                })();


            };

            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => { addCoverGraphics(imgObj); coverStage.add(coverLayer); coverStage.draw(); };
                imgObj.onerror = () => { addCoverGraphics(null); coverStage.add(coverLayer); coverStage.draw(); };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                addCoverGraphics(null);
                coverStage.add(coverLayer);
                coverStage.draw();
            }

            // --- Content Slides ---
            const margin = 70;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();

                // Background softly split: left light panel, right dark analytic panel
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w * 0.62, height: h, fill: '#ffffff' }));
                layer.add(new window.Konva.Rect({ x: w * 0.62, y: 0, width: w * 0.38, height: h, fillLinearGradientStartPoint: { x: w * 0.62, y: 0 }, fillLinearGradientEndPoint: { x: w, y: h }, fillLinearGradientColorStops: [0, '#1e293b', 1, '#0f172a'] }));
                // Vertical gradient divider
                layer.add(new window.Konva.Rect({ x: w * 0.62 - 3, y: 0, width: 6, height: h, fillLinearGradientStartPoint: { x: w * 0.62 - 3, y: 0 }, fillLinearGradientEndPoint: { x: w * 0.62 + 3, y: 0 }, fillLinearGradientColorStops: [0, '#06b6d4', 1, '#6366f1'], opacity: 0.85 }));

                // Faint grid on right panel
                const gridGroup = new window.Konva.Group({ opacity: 0.12 });
                const gGap = 60;
                for (let gx = w * 0.62; gx <= w; gx += gGap) gridGroup.add(new window.Konva.Line({ points: [gx, 0, gx, h], stroke: '#fff', strokeWidth: 1 }));
                for (let gy = 0; gy <= h; gy += gGap) gridGroup.add(new window.Konva.Line({ points: [w * 0.62, gy, w, gy], stroke: '#fff', strokeWidth: 1 }));
                layer.add(gridGroup);

                const slideData = parsedSlides.slides[i - 1];
                const slideTitle = slideData?.title || `Slide ${i}`;
                // Title with overflow fix
                let titleFontSize = 46;
                const minTitleFontSize = 20;
                const titleX = margin;
                let titleY = margin;
                const titleWidth = w * 0.55;
                // Title node with overflow fix
                let titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth,
                    text: slideTitle,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial', fontStyle: '700',
                    fill: '#1e293b',
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                });
                // Reduce font size and adjust Y position if title does not fit in one line
                while ((titleNode.height() > titleNode.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                    titleFontSize -= 2;
                    titleY = margin - (titleNode.height() - titleNode.fontSize() * 1.5) / 2;
                    titleNode = new window.Konva.Text({
                        x: titleX, y: titleY, width: titleWidth,
                        text: slideTitle,
                        fontSize: titleFontSize,
                        fontFamily: 'Montserrat, Arial', fontStyle: '700',
                        fill: '#1e293b',
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : undefined
                    });
                }
                layer.add(titleNode);
                // Title underline gradient
                layer.add(new window.Konva.Rect({ x: margin, y: titleY + titleNode.height() + 6, width: Math.min(360, slideTitle.length * 20), height: 6, cornerRadius: 3, fillLinearGradientStartPoint: { x: margin, y: 0 }, fillLinearGradientEndPoint: { x: margin + 360, y: 0 }, fillLinearGradientColorStops: [0, '#6366f1', 0.5, '#06b6d4', 1, '#f59e0b'] }));

                // Bullets left (with mini spark bars)
                const bullets = (slideData?.content || []).map(t => t.trim());
                const colWidth = w * 0.55 - margin * 0.5;
                let yCursor = titleY + titleNode.height() + 30;
                const blockGap = 34;

                // Measured-layout: pick a font size, measure each bullet with Konva.Text,
                // and decrease font size until all bullets fit in available space.
                let measuredFont = 24;
                const measuredMinFont = 12;
                const minBlockHeight = 56; // minimum visual block height
                const sparkW = 140;
                const textMeasureWidth = colWidth - sparkW - 80;
                const maxContentY = h - 60; // reserve bottom
                let finalBlockHeight = minBlockHeight;
                let fits = false;

                while (measuredFont >= measuredMinFont && !fits) {
                    let maxH = 0;
                    bullets.forEach((txt, idx) => {
                        const tmp = new window.Konva.Text({ text: `   ${txt}`, fontSize: measuredFont, width: textMeasureWidth, lineHeight: 1.15, fontFamily: 'Montserrat, Arial', pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined });
                        const hgt = Math.max(minBlockHeight, tmp.height() + 20);
                        if (hgt > maxH) maxH = hgt;
                    });
                    const total = maxH * bullets.length + (bullets.length - 1) * blockGap;
                    const available = maxContentY - yCursor;
                    if (total <= available) { fits = true; finalBlockHeight = maxH; } else { measuredFont -= 2; }
                }

                if (!fits) {
                    // Last-resort: compute final block height to evenly distribute available space
                    const avail = Math.max(0, maxContentY - yCursor);
                    finalBlockHeight = Math.max(minBlockHeight, Math.floor((avail - blockGap * (bullets.length - 1)) / Math.max(1, bullets.length)));
                    measuredFont = measuredMinFont;
                }

                // Measure text heights for vertical centering inside each finalBlockHeight
                const textHeights = bullets.map((txt, idx) => new window.Konva.Text({ text: `   ${txt}`, fontSize: measuredFont, width: textMeasureWidth, lineHeight: 1.15, fontFamily: 'Montserrat, Arial', pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined }).height());

                bullets.forEach((txt, idx) => {
                    if (yCursor + finalBlockHeight > maxContentY + 2) return; // stop if we would overflow
                    const group = new window.Konva.Group();
                    const barH = Math.min(22, Math.max(14, finalBlockHeight - 20));
                    group.add(new window.Konva.Rect({ x: margin, y: yCursor, width: colWidth - 40, height: finalBlockHeight, fill: idx % 2 ? 'rgba(99,102,241,0.06)' : 'rgba(6,182,212,0.06)', cornerRadius: 14 }));
                    // center text vertically inside block
                    const ty = yCursor + Math.round((finalBlockHeight - textHeights[idx]) / 2);
                    group.add(new window.Konva.Text({ x: margin + sparkW + 30, y: ty, width: textMeasureWidth, text: `   ${txt}`, fontSize: measuredFont, fontFamily: 'Montserrat, Arial', lineHeight: 1.15, fill: '#334155', pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined }));
                    // Spark bars (randomized length sequence) anchored to bottom of block
                    const bars = 8;
                    for (let b = 0; b < bars; b++) {
                        const val = 0.2 + Math.random() * 0.8;
                        const bw = (sparkW / bars) - 6;
                        const bh = Math.round(barH * val);
                        const bx = margin + 16 + b * ((sparkW) / bars);
                        const by = yCursor + finalBlockHeight - bh - 8;
                        group.add(new window.Konva.Rect({ x: bx, y: by, width: bw, height: bh, cornerRadius: 3, fill: ['#6366f1', '#06b6d4', '#f59e0b', '#8b5cf6'][b % 4] }));
                    }
                    layer.add(group);
                    yCursor += finalBlockHeight + blockGap;
                });

                // Add layer first
                stage.add(layer); stage.draw();

                // Image load (if any) placed above arcs but below future overlays
                const base64 = slideImagesResult?.slideImages?.[i - 1];
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Ensure panel metrics are available (define locally to avoid ReferenceError)
                            const panelX = w * 0.62 + 50;
                            const panelW = w - panelX - 60;
                            const panelY = 140;
                            const panelH = h - panelY - 140;

                            // Frame and visual metrics
                            const pad = 20; // space inside panel for the visual frame
                            const clipRadius = 28; // match panel corner radius
                            const shapeX = panelX + pad;
                            const shapeY = panelY + pad;
                            const shapeW = panelW - pad * 2;
                            const shapeH = panelH - pad * 2;

                            // Decorative glass: use the same size as the frame (no larger duplicate)
                            const glass = new window.Konva.Rect({
                                x: shapeX,
                                y: shapeY,
                                width: shapeW,
                                height: shapeH,
                                cornerRadius: clipRadius,
                                fillLinearGradientStartPoint: { x: 0, y: 0 },
                                fillLinearGradientEndPoint: { x: shapeW, y: shapeH },
                                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.12)', 1, 'rgba(255,255,255,0.04)'],
                                shadowColor: '#000', shadowBlur: 20, shadowOffset: { x: 0, y: 10 }, shadowOpacity: 0.22,
                                stroke: 'rgba(255,255,255,0.24)', strokeWidth: 2
                            });

                            // Decorative glass will be sized relative to the final rendered image (8px larger) —
                            // compute image draw size first then place a slightly larger glass under it.
                            // Compute inner area (where the image will be drawn)
                            const innerW = Math.max(1, shapeW - 3);
                            const innerH = Math.max(1, shapeH - 3);
                            // Position the clipped group so the inner area is centered inside the glass
                            const innerOffsetX = Math.round((shapeW - innerW) / 2);
                            const innerOffsetY = Math.round((shapeH - innerH) / 2);
                            const innerX = shapeX + innerOffsetX;
                            const innerY = shapeY + innerOffsetY;

                            // Compute 'cover' scale so the image fills the inner area and preserves aspect ratio
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(innerW / imgW, innerH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            // center image inside the inner area
                            const imgX = Math.round((innerW - drawW) / 2);
                            const imgY = Math.round((innerH - drawH) / 2);

                            // Use a less rounded corner for the image clipping
                            const imgClipRadius = Math.max(8, Math.round(clipRadius * 0.55));

                            // Clipped group for the visible image area (clip matches inner size)
                            const imgGroup = new window.Konva.Group({
                                x: innerX, y: innerY, clipFunc: function (ctx) {
                                    const fw = innerW, fh = innerH, r = Math.min(imgClipRadius, Math.floor(Math.min(fw, fh) / 2));
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(fw - r, 0);
                                    ctx.quadraticCurveTo(fw, 0, fw, r);
                                    ctx.lineTo(fw, fh - r);
                                    ctx.quadraticCurveTo(fw, fh, fw - r, fh);
                                    ctx.lineTo(r, fh);
                                    ctx.quadraticCurveTo(0, fh, 0, fh - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Prepare the Konva image node (keeps the same size as before)
                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgX,
                                y: imgY,
                                width: drawW,
                                height: drawH,
                                opacity: 0.98,
                                shadowColor: '#000', shadowBlur: 18, shadowOpacity: 0.20,
                                filters: [window.Konva.Filters.Contrast], contrast: 0.05,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Compute absolute image position on the canvas
                            const imageAbsX = innerX + imgX;
                            const imageAbsY = innerY + imgY;

                            // Decorative glass: 8px larger than image (4px inset each side)
                            const glassPad = 4;
                            const glassRect = new window.Konva.Rect({
                                x: imageAbsX - glassPad,
                                y: imageAbsY - glassPad,
                                width: drawW + glassPad * 2,
                                height: drawH + glassPad * 2,
                                // use less rounded corners for the larger glass so it visually matches the photo
                                cornerRadius: Math.max(6, Math.round(imgClipRadius * 0.65)),
                                fillLinearGradientStartPoint: { x: 0, y: 0 },
                                fillLinearGradientEndPoint: { x: drawW + glassPad * 2, y: drawH + glassPad * 2 },
                                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.12)', 1, 'rgba(255,255,255,0.04)'],
                                shadowColor: '#000', shadowBlur: 22, shadowOffset: { x: 0, y: 10 }, shadowOpacity: 0.22,
                                stroke: 'rgba(255,255,255,0.24)', strokeWidth: 2
                            });

                            // Add to layer in z-order: glass under, clipped image above
                            layer.add(glassRect);
                            imgGroup.add(imageNode);
                            layer.add(imgGroup);

                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Page number (muted)
                layer.add(new window.Konva.Text({ x: w - 140, y: h - 70, text: i.toString(), fontSize: 56, fontFamily: 'Montserrat, Arial', fill: 'rgba(255,255,255,0.12)', shadowColor: '#000', shadowBlur: 6, shadowOpacity: 0.3, pw_id: undefined }));
                stage.draw();
            }

            Promise.all(promises).then(() => resolve());
        });
    }

    static async renderHobby(stages, parsedSlides, slideImagesResult) {
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // ---- Cover Slide ----
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Wood plank background (striped browns)
            const plankWidths = [140, 120, 160, 110, 150];
            let xCursor = 0; let plankIndex = 0;
            while (xCursor < sw) {
                const pw = plankWidths[plankIndex % plankWidths.length];
                const shade = ['#4b342a', '#5a3c2f', '#6b4634', '#59382a', '#704d39'][plankIndex % 5];
                coverLayer.add(new window.Konva.Rect({ x: xCursor, y: 0, width: Math.min(pw, sw - xCursor), height: sh, fill: shade }));
                // Grain overlay (subtle vertical lines)
                for (let gy = 0; gy < 6; gy++) {
                    coverLayer.add(new window.Konva.Line({ points: [xCursor + 10 + gy * 20, 0, xCursor + 10 + gy * 20, sh], stroke: 'rgba(255,255,255,0.04)', strokeWidth: 1 }));
                }
                xCursor += pw; plankIndex++;
            }
            // Warm vignette
            coverLayer.add(new window.Konva.Rect({ x: 0, y: 0, width: sw, height: sh, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: sw, y: sh }, fillLinearGradientColorStops: [0, 'rgba(0,0,0,0.25)', 1, 'rgba(0,0,0,0.55)'] }));
            // Center parchment panel for title
            const panelW = sw * 0.7; const panelH = sh * 0.56; const panelX = (sw - panelW) / 2; const panelY = (sh - panelH) / 2 - 30;
            coverLayer.add(new window.Konva.Rect({ x: panelX, y: panelY, width: panelW, height: panelH, fill: '#f7f2e9', cornerRadius: 28, shadowColor: '#000', shadowBlur: 40, shadowOpacity: 0.35 }));
            // Parchment subtle fibers (lines)
            for (let i = 0; i < 14; i++) {
                coverLayer.add(new window.Konva.Line({ points: [panelX + 30, panelY + 40 + i * (panelH - 80) / 14, panelX + panelW - 30, panelY + 40 + i * (panelH - 80) / 14], stroke: 'rgba(110,80,60,0.08)', strokeWidth: 1 }));
            }
            // Title with overflow fix
            const title = parsedSlides.cover?.title || 'Hobby Showcase';
            let titleFontSize = Math.min(74, Math.max(48, sw * 0.055));
            const minTitleFontSize = 24;
            const titleX = panelX + 60;
            const titleY = panelY + 70;
            const titleWidth = panelW - 120;
            // Title node with overflow fix
            let titleNode = new window.Konva.Text({
                x: titleX, y: titleY, width: titleWidth,
                text: title,
                fontSize: titleFontSize,
                fontFamily: '"Montserrat", Arial',
                fontStyle: '700',
                fill: '#4b342a',
                lineHeight: 1.15,
                shadowColor: 'rgba(0,0,0,0.25)',
                shadowBlur: 6,
                shadowOpacity: 1,
                pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
            });
            // Reduce font size if title does not fit in one line
            while ((titleNode.height() > titleNode.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                titleFontSize -= 2;
                titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth,
                    text: title,
                    fontSize: titleFontSize,
                    fontFamily: '"Montserrat", Arial',
                    fontStyle: '700',
                    fill: '#4b342a',
                    lineHeight: 1.15,
                    shadowColor: 'rgba(0,0,0,0.25)',
                    shadowBlur: 6,
                    shadowOpacity: 1,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.titleId) ? parsedSlides.cover._pw.titleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                });
            }
            coverLayer.add(titleNode);
            if (parsedSlides.cover?.subtitle) {
                coverLayer.add(new window.Konva.Text({
                    text: parsedSlides.cover.subtitle,
                    x: panelX + 70,
                    y: panelY + 170,
                    width: panelW - 140,
                    fontSize: 30,
                    fontFamily: '"Montserrat", Arial',
                    fill: '#6d4f3b',
                    lineHeight: 1.3,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : undefined
                }));
            }
            // Decorative twine (ellipse outline) top-left / bottom-right
            coverLayer.add(new window.Konva.Circle({ x: panelX + 50, y: panelY + 40, radius: 34, stroke: '#c8a16a', strokeWidth: 6, opacity: 0.8 }));
            // Optional cover image clipped into circular wooden frame
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    const imgR = Math.min(sw, sh) * 0.17;
                    // Place the circular image and decorative wooden frame in the lower-right corner
                    // of the warm vignette with a comfortable inset so it doesn't hug the edge.
                    const vignetteInset = 72; // px from right/bottom edges of the stage
                    const circleX = sw - imgR - vignetteInset;
                    const circleY = sh - imgR - vignetteInset;

                    const group = new window.Konva.Group({ x: circleX, y: circleY, clipFunc: ctx => { ctx.arc(0, 0, imgR, 0, Math.PI * 2); } });
                    group.add(new window.Konva.Image({ image: imgObj, x: -imgR, y: -imgR, width: imgR * 2, height: imgR * 2 }));

                    // Wooden circular frame (slightly larger than image)
                    coverLayer.add(new window.Konva.Circle({ x: circleX, y: circleY, radius: imgR + 16, stroke: '#cfa870', strokeWidth: 18, shadowColor: '#000', shadowBlur: 16, shadowOpacity: 0.35 }));

                    coverLayer.add(group);
                    coverStage.add(coverLayer); coverStage.draw();
                };
                imgObj.onerror = () => { coverStage.add(coverLayer); coverStage.draw(); };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                coverStage.add(coverLayer); coverStage.draw();
            }

            // ---- Content Slides ----
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();
                // Wood plank background
                let xP = 0; let pi = 0;
                const plankPalette = ['#5a3c2f', '#6b4634', '#59382a', '#704d39'];
                while (xP < w) {
                    const pw = 120 + (pi % 3) * 40;
                    layer.add(new window.Konva.Rect({ x: xP, y: 0, width: Math.min(pw, w - xP), height: h, fill: plankPalette[pi % plankPalette.length] }));
                    // Subtle grain lines
                    for (let l = 0; l < 4; l++) layer.add(new window.Konva.Line({ points: [xP + 15 + l * 25, 0, xP + 15 + l * 25, h], stroke: 'rgba(255,255,255,0.04)', strokeWidth: 1 }));
                    xP += pw; pi++;
                }
                // Semi-transparent overlay for readability
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: 'rgba(0,0,0,0.25)' }));
                // Parchment content panel (left)
                const panelWidth = w * 0.58;
                layer.add(new window.Konva.Rect({ x: margin - 10, y: margin - 10, width: panelWidth, height: h - margin * 2 + 20, fill: '#f8f4ec', cornerRadius: 34, shadowColor: '#000', shadowBlur: 30, shadowOpacity: 0.28 }));
                // Parchment horizontal lines
                for (let ly = margin + 60; ly < h - margin - 40; ly += 48) {
                    layer.add(new window.Konva.Line({ points: [margin + 30, ly, margin + panelWidth - 60, ly], stroke: 'rgba(120,85,60,0.04)', strokeWidth: 2 }));
                }
                const slideData = parsedSlides.slides[i - 1];
                // Title with overflow fix
                const slideTitle = slideData?.title || `Slide ${i + 1}`;
                let slideTitleFontSize = 46;
                const minSlideTitleFontSize = 20;
                const slideTitleX = margin + 30;
                let slideTitleY = margin + 20;
                const slideTitleWidth = panelWidth - 120;
                // Title node with overflow fix
                let slideTitleNode = new window.Konva.Text({
                    x: slideTitleX, y: slideTitleY, width: slideTitleWidth,
                    text: slideTitle,
                    fontSize: slideTitleFontSize,
                    fontFamily: '"Montserrat", Arial',
                    fontStyle: '700',
                    fill: '#4b342a'
                    ,
                    pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                });
                // Reduce font size and adjust Y position if title does not fit in one line
                while ((slideTitleNode.height() > slideTitleNode.fontSize() * 1.5) && slideTitleFontSize > minSlideTitleFontSize) {
                    slideTitleFontSize -= 2;
                    slideTitleY = margin + 20 - (slideTitleNode.height() - slideTitleNode.fontSize() * 1.5) / 2;
                    slideTitleNode = new window.Konva.Text({
                        x: slideTitleX, y: slideTitleY, width: slideTitleWidth,
                        text: slideTitle,
                        fontSize: slideTitleFontSize,
                        fontFamily: '"Montserrat", Arial',
                        fontStyle: '700',
                        fill: '#4b342a'
                        ,
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                    });
                }
                layer.add(slideTitleNode);
                // Title underline (rope style simulated with circles)
                const underlineY = slideTitleY + slideTitleNode.height() + 20;
                for (let r = 0; r < 16; r++) {
                    layer.add(new window.Konva.Circle({ x: margin + 50 + r * 18, y: underlineY, radius: 7, fill: r % 2 ? '#d7a15f' : '#c28b4f', shadowColor: '#000', shadowBlur: 4, shadowOpacity: 0.2 }));
                }
                // Enhanced bullet overflow fix
                const bulletData = (slideData?.content || []).map(t => t.trim());
                const bulletStartY = underlineY + 30;
                const maxContentY = h - 60; // Reserve space at bottom
                const initialFontSize = 26;
                const minFontSize = 14;
                let bulletFontSize = initialFontSize;
                const bulletLineHeight = 1.25;
                const bulletGap = 8; // gap between bullets
                const bulletTextWidth = panelWidth - 120;

                // Calculate total space needed and reduce font size if necessary
                const availableSpace = maxContentY - bulletStartY;
                let totalHeight = 0;
                let bulletHeights = [];
                let fits = false;

                while (bulletFontSize >= minFontSize && !fits) {
                    bulletHeights = bulletData.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: bulletFontSize,
                            width: bulletTextWidth,
                            lineHeight: bulletLineHeight,
                            fontFamily: '"Montserrat", Arial',
                            pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                    totalHeight = bulletHeights.reduce((a, b) => a + b, 0) + (bulletData.length - 1) * bulletGap;
                    fits = totalHeight <= availableSpace;
                    if (!fits) bulletFontSize -= 2;
                }

                // If still doesn't fit, use minimum font size
                if (!fits) {
                    bulletFontSize = minFontSize;
                    bulletHeights = bulletData.map((txt, idx) => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: bulletFontSize,
                            width: bulletTextWidth,
                            lineHeight: bulletLineHeight,
                            fontFamily: '"Montserrat", Arial',
                            pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                        });
                        return temp.height();
                    });
                }

                // Render bullets with calculated font size
                let yCursor = bulletStartY;
                bulletData.forEach((txt, idx) => {
                    // Break if we would exceed available space
                    if (yCursor + bulletHeights[idx] > maxContentY) {
                        return;
                    }

                    layer.add(new window.Konva.Text({
                        text: `   ${txt}`,
                        x: margin + 30,
                        y: yCursor,
                        width: bulletTextWidth,
                        fontSize: bulletFontSize,
                        lineHeight: bulletLineHeight,
                        fontFamily: '"Montserrat", Arial',
                        fill: '#5b412f',
                        pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    }));
                    yCursor += bulletHeights[idx] + bulletGap;
                });
                // Right image area
                const imgIndex = i - 1;
                const base64 = slideImagesResult?.slideImages?.[imgIndex];
                const imgFrameX = panelWidth + margin + 30;
                const imgFrameY = margin + 40;
                const imgFrameW = w - imgFrameX - margin;
                const imgFrameH = h - imgFrameY - margin - 40;
                // Frame
                layer.add(new window.Konva.Rect({ x: imgFrameX - 12, y: imgFrameY - 12, width: imgFrameW + 24, height: imgFrameH + 24, fill: '#3e2723', cornerRadius: 28, shadowColor: '#000', shadowBlur: 25, shadowOpacity: 0.4 }));
                layer.add(new window.Konva.Rect({ x: imgFrameX, y: imgFrameY, width: imgFrameW, height: imgFrameH, fill: '#f7f2e9', cornerRadius: 20 }));
                // (pushpin will be added after the image so it renders on top)

                stage.add(layer); stage.draw();
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Compute the visible frame inside the right panel (leave margins)
                            const framePad = 30; // padding inside the parchment frame
                            const frameW = imgFrameW - framePad * 2;
                            const frameH = imgFrameH - framePad * 2;
                            const frameX = imgFrameX + framePad;
                            const frameY = imgFrameY + framePad;

                            // Decorative glass under the clipped image (slightly larger)
                            const glassPadding = 12; // how much larger the glass is around the image
                            const glassX = frameX - glassPadding;
                            const glassY = frameY - glassPadding;
                            const glassW = frameW + glassPadding * 2;
                            const glassH = frameH + glassPadding * 2;

                            const glass = new window.Konva.Rect({
                                x: glassX,
                                y: glassY,
                                width: glassW,
                                height: glassH,
                                fillLinearGradientStartPoint: { x: 0, y: 0 },
                                fillLinearGradientEndPoint: { x: glassW, y: glassH },
                                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.16)', 1, 'rgba(255,255,255,0.06)'],
                                cornerRadius: Math.max(20, 16 + Math.round(glassPadding / 2)),
                                shadowColor: 'rgba(0,0,0,0.35)',
                                shadowBlur: 18,
                                shadowOffset: { x: 0, y: 10 },
                                shadowOpacity: 1,
                                stroke: 'rgba(255,255,255,0.22)',
                                strokeWidth: 2
                            });

                            // Clipped group sized to the visible image frame
                            const imgClipRadius = 16; // keep same corner radius as before
                            const imgGroup = new window.Konva.Group({
                                x: frameX, y: frameY, clipFunc: function (ctx) {
                                    const fsw = frameW, fsh = frameH, r = imgClipRadius;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(fsw - r, 0);
                                    ctx.quadraticCurveTo(fsw, 0, fsw, r);
                                    ctx.lineTo(fsw, fsh - r);
                                    ctx.quadraticCurveTo(fsw, fsh, fsw - r, fsh);
                                    ctx.lineTo(r, fsh);
                                    ctx.quadraticCurveTo(0, fsh, 0, fsh - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Calculate cover scaling so the image fills the frame and may be cropped
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(frameW / imgW, frameH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgX = Math.round((frameW - drawW) / 2);
                            const imgY = Math.round((frameH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgX,
                                y: imgY,
                                width: drawW,
                                height: drawH,
                                opacity: 0.98,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Add glass (under) and clipped image group (above)
                            layer.add(glass);
                            imgGroup.add(imageNode);
                            layer.add(imgGroup);

                            // Pushpin (top-left of frame) — add after image so it appears on top
                            layer.add(new window.Konva.Circle({ x: imgFrameX + 40, y: imgFrameY + 40, radius: 14, fill: '#d9534f', shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.4 }));
                            layer.add(new window.Konva.Circle({ x: imgFrameX + 40, y: imgFrameY + 40, radius: 6, fill: '#fff' }));

                            // draw and resolve
                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                } else {
                    // No image — still add pushpin on top of the empty frame
                    layer.add(new window.Konva.Circle({ x: imgFrameX + 40, y: imgFrameY + 40, radius: 14, fill: '#d9534f', shadowColor: '#000', shadowBlur: 8, shadowOpacity: 0.4 }));
                    layer.add(new window.Konva.Circle({ x: imgFrameX + 40, y: imgFrameY + 40, radius: 6, fill: '#fff' }));
                    stage.add(layer);
                    stage.draw();
                }
            }

            Promise.all(promises).then(() => resolve());
        });
    }
   
    static async renderPets(stages, parsedSlides, slideImagesResult) {
        return new Promise(resolve => {
            if (!parsedSlides || !stages) return resolve();
            SlideStyles.clearStages(stages);
            const promises = [];

            // --- Cover Slide ---
            const coverStage = stages[0];
            const sw = coverStage.width();
            const sh = coverStage.height();
            const coverLayer = new window.Konva.Layer();

            // Gradient background (soft sunrise pastels)
            coverLayer.add(new window.Konva.Rect({
                x: 0, y: 0, width: sw, height: sh,
                fillLinearGradientStartPoint: { x: 0, y: 0 },
                fillLinearGradientEndPoint: { x: sw, y: sh },
                fillLinearGradientColorStops: [0, '#ffe5ec', 0.25, '#ffe9d6', 0.55, '#e0f7fa', 0.8, '#d1f5e1', 1, '#fde68a']
            }));
            // Floating circles (playful bubbles)
            for (let i = 0; i < 14; i++) {
                coverLayer.add(new window.Konva.Circle({
                    x: Math.random() * sw,
                    y: Math.random() * sh,
                    radius: 30 + Math.random() * 50,
                    fill: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)'][i % 2],
                    shadowColor: '#fff', shadowBlur: 20, shadowOpacity: 0.4
                }));
            }
            // Large faint paw prints (background motif)
            const addPaw = (px, py, size, opacity) => {
                const group = new window.Konva.Group({ x: px, y: py, opacity });
                const toeR = size * 0.22;
                const padW = size * 0.9; const padH = size * 0.65;
                // Toes
                [[-size * 0.3, -size * 0.15], [0, -size * 0.2], [size * 0.3, -size * 0.15], [-size * 0.15, 0]].forEach(tp => {
                    group.add(new window.Konva.Circle({ x: tp[0], y: tp[1], radius: toeR, fill: 'rgba(255,255,255,0.35)' }));
                });
                // Main pad
                group.add(new window.Konva.Ellipse({ x: size * 0.1, y: size * 0.22, width: padW, height: padH, fill: 'rgba(255,255,255,0.35)', rotation: 8 }));
                coverLayer.add(group);
            };
            addPaw(sw * 0.75, sh * 0.3, 140, 0.18);
            addPaw(sw * 0.2, sh * 0.75, 160, 0.14);

            // Title panel
            const titlePanelW = sw * 0.72;
            const titlePanelH = sh * 0.5;
            const panelX = (sw - titlePanelW) / 2;
            const panelY = sh * 0.23;
            coverLayer.add(new window.Konva.Rect({
                x: panelX, y: panelY, width: titlePanelW, height: titlePanelH,
                fill: 'rgba(255,255,255,0.75)', cornerRadius: 40,
                shadowColor: 'rgba(0,0,0,0.25)', shadowBlur: 30, shadowOpacity: 0.25
            }));


            // Title text with overflow fix
            const title = parsedSlides.cover?.title || 'Adorable Pets SlideForge';
            let titleFontSize = Math.min(78, Math.max(52, sw * 0.055));
            const minTitleFontSize = 24;
            const titleX = panelX + 70;
            const titleY = panelY + 80;

            // Reserve space for a possible cover image placed inside the title panel (lower-right)
            const expectedCoverImgW = slideImagesResult?.coverImage ? Math.round(sw * 0.28) : 0;
            const coverInset = 24; // must match image placement inset
            const decorativeFrameExtra = 32; // frame padding (image + decorative frame)
            const reservedForImage = expectedCoverImgW ? (expectedCoverImgW + decorativeFrameExtra + coverInset + 16) : 0; // extra gap

            // Ensure title area leaves room for the image when present
            let titleWidth = titlePanelW - 140 - reservedForImage;
            titleWidth = Math.max(220, titleWidth); // ensure a sane minimum width

            // Title node with overflow fix
            let titleNode = new window.Konva.Text({
                x: titleX, y: titleY, width: titleWidth,
                text: title,
                fontSize: titleFontSize,
                fontFamily: 'Montserrat, Arial',
                fontStyle: '700',
                fill: '#5d3c2e',
                lineHeight: 1.15,
                shadowColor: 'rgba(255,255,255,0.9)', shadowBlur: 4, shadowOpacity: 1
            });
            // Reduce font size if title does not fit in one line
            while ((titleNode.height() > titleNode.fontSize() * 1.5) && titleFontSize > minTitleFontSize) {
                titleFontSize -= 2;
                titleNode = new window.Konva.Text({
                    x: titleX, y: titleY, width: titleWidth,
                    text: title,
                    fontSize: titleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#5d3c2e',
                    lineHeight: 1.15,
                    shadowColor: 'rgba(255,255,255,0.9)', shadowBlur: 4, shadowOpacity: 1
                });
            }
            coverLayer.add(titleNode);
            if (parsedSlides.cover?.subtitle) {
                const subtitleX = panelX + 80;
                let subtitleWidth = titlePanelW - 160 - reservedForImage;
                subtitleWidth = Math.max(180, subtitleWidth);
                coverLayer.add(new window.Konva.Text({
                    text: parsedSlides.cover.subtitle,
                    x: subtitleX,
                    y: panelY + 190,
                    width: subtitleWidth,
                    fontSize: 32,
                    fontFamily: 'Montserrat, Arial',
                    fill: '#7a5545',
                    lineHeight: 1.3,
                    pw_id: (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.subtitleId) ? parsedSlides.cover._pw.subtitleId : (parsedSlides.cover && parsedSlides.cover._pw && parsedSlides.cover._pw.id) || undefined
                }));
            }
            // Tiny paw icons row (moved below the title panel with 20px gap) - centered
            const pawRowY = panelY + titlePanelH + 120; // moved 100px further down
            const pawCount = 10;
            const pawRadius = 10;
            const pawSpacing = 60; // distance between centers (keeps original spacing)

            // Compute total width spanned by paw centers and center it inside the title panel
            const totalSpan = (pawCount - 1) * pawSpacing; // distance from first center to last center
            let startX = panelX + (titlePanelW - totalSpan) / 2;

            // Clamp so the row never overflows the panel (keep a small 12px margin)
            const minLeft = panelX + 12;
            const maxLeft = panelX + titlePanelW - 12 - totalSpan;
            startX = Math.max(minLeft, Math.min(startX, maxLeft));

            const pawColors = [
                '#FFF5E0', // cream
                '#F6C3A0', // light ginger
                '#F29E4C', // orange ginger
                '#D99A6C', // tan
                '#A66B3A', // brown
                '#6B3E26', // dark brown
                '#CFCFCF', // light gray
                '#8E8E8E', // gray
                '#222222', // black
                '#FFFFFF'  // white
            ];
            for (let i = 0; i < pawCount; i++) {
                coverLayer.add(new window.Konva.Circle({ x: Math.round(startX + i * pawSpacing), y: pawRowY, radius: pawRadius, fill: pawColors[i % pawColors.length] }));
            }

            // Optional cover image (right side clipped in rounded rectangle)
            if (slideImagesResult?.coverImage) {
                const imgObj = new Image();
                imgObj.onload = () => {
                    // size based on stage
                    let imgW = Math.round(sw * 0.28);
                    let imgH = Math.round(sh * 0.42);

                    // Make sure the image fits inside the title panel top area: scale down if too tall
                    const inset = 24; // distance from panel edges
                    const maxTopH = Math.max(40, Math.floor(titlePanelH - inset * 2)); // available height inside panel
                    if (imgH > maxTopH) {
                        const s = maxTopH / imgH;
                        imgH = maxTopH;
                        imgW = Math.round(imgW * s);
                    }

                    // Place the image in the top-right corner of the stage but offset from slide borders
                    const marginRight = 100; // distance from the right edge of the slide
                    const marginTop = 100;   // distance from the top edge of the slide
                    let imgX = sw - imgW - marginRight;
                    let imgY = marginTop;

                    // Keep stage-bound clamping so the image doesn't render off-canvas
                    imgX = Math.max(12, Math.min(imgX, sw - imgW - 12));
                    imgY = Math.max(12, Math.min(imgY, sh - imgH - 12));

                    // Decorative frame (slightly larger than image)
                    coverLayer.add(new window.Konva.Rect({ x: imgX - 16, y: imgY - 16, width: imgW + 32, height: imgH + 32, fill: '#fff8f2', cornerRadius: 34, shadowColor: '#000', shadowBlur: 25, shadowOpacity: 0.25 }));
                    coverLayer.add(new window.Konva.Image({ image: imgObj, x: imgX, y: imgY, width: imgW, height: imgH, cornerRadius: 28, shadowColor: '#000', shadowBlur: 20, shadowOpacity: 0.25, pw_id: SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides) }));
                    coverStage.add(coverLayer); coverStage.draw();
                };
                imgObj.onerror = () => { coverStage.add(coverLayer); coverStage.draw(); };
                imgObj.src = slideImagesResult.coverImage;
            } else {
                coverStage.add(coverLayer); coverStage.draw();
            }

            // ---- Content Slides ----
            const margin = 60;
            for (let i = 1; i < stages.length; i++) {
                const stage = stages[i];
                const layer = new window.Konva.Layer();
                const w = stage.width();
                const h = stage.height();

                // Split soft background
                layer.add(new window.Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: '#fffdf9' }));
                layer.add(new window.Konva.Rect({ x: w * 0.6, y: 0, width: w * 0.4, height: h, fillLinearGradientStartPoint: { x: w * 0.6, y: 0 }, fillLinearGradientEndPoint: { x: w, y: h }, fillLinearGradientColorStops: [0, '#fffbf0', 0.6, '#ffe4e6', 1, '#fde68a'] }));
                layer.add(new window.Konva.Rect({ x: w * 0.6 - 4, y: 0, width: 8, height: h, fill: '#fbcfe8', opacity: 0.5 }));

                // Background paws (faint)
                for (let p = 0; p < 5; p++) {
                    const size = 90 + Math.random() * 60;
                    const group = new window.Konva.Group({ x: Math.random() * w * 0.55 + 40, y: Math.random() * (h - 160) + 120, opacity: 0.08 });
                    const toeR = size * 0.2;
                    [[-size * 0.3, -size * 0.15], [0, -size * 0.2], [size * 0.3, -size * 0.15], [-size * 0.15, 0]].forEach(tp => group.add(new window.Konva.Circle({ x: tp[0], y: tp[1], radius: toeR, fill: '#fb7185' })));
                    group.add(new window.Konva.Ellipse({ x: size * 0.1, y: size * 0.22, width: size * 0.8, height: size * 0.55, fill: '#fb7185', rotation: 8 }));
                    layer.add(group);
                }

                const slideData = parsedSlides.slides[i - 1];
                // Title with overflow fix
                const slideTitle = slideData?.title || `Slide ${i + 1}`;
                let slideTitleFontSize = 44;
                const minSlideTitleFontSize = 20;
                const slideTitleX = margin;
                let slideTitleY = margin;
                const slideTitleWidth = w * 0.5 - margin;
                // Title node with overflow fix
                let slideTitleNode = new window.Konva.Text({
                    x: slideTitleX, y: slideTitleY, width: slideTitleWidth,
                    text: slideTitle,
                    fontSize: slideTitleFontSize,
                    fontFamily: 'Montserrat, Arial',
                    fontStyle: '700',
                    fill: '#5d3c2e'
                    , pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                });
                // Reduce font size and adjust Y position if title does not fit in one line
                while ((slideTitleNode.height() > slideTitleNode.fontSize() * 1.5) && slideTitleFontSize > minSlideTitleFontSize) {
                    slideTitleFontSize -= 2;
                    slideTitleY = margin - (slideTitleNode.height() - slideTitleNode.fontSize() * 1.5) / 2;
                    slideTitleNode = new window.Konva.Text({
                        x: slideTitleX, y: slideTitleY, width: slideTitleWidth,
                        text: slideTitle,
                        fontSize: slideTitleFontSize,
                        fontFamily: 'Montserrat, Arial',
                        fontStyle: '700',
                        fill: '#5d3c2e',
                        pw_id: (slideData && slideData._pw && slideData._pw.titleId) ? slideData._pw.titleId : (slideData && slideData._pw && slideData._pw.id) || undefined
                    });
                }
                layer.add(slideTitleNode);
                // Title underline (multi-color bones)
                const underlineY = slideTitleY + slideTitleNode.height() + 16;
                for (let b = 0; b < 8; b++) {
                    const boneX = margin + b * 70;
                    layer.add(new window.Konva.Rect({ x: boneX, y: underlineY, width: 60, height: 18, fill: ['#fbbf24', '#fb7185', '#34d399', '#60a5fa'][b % 4], cornerRadius: 9 }));
                    layer.add(new window.Konva.Circle({ x: boneX, y: underlineY + 9, radius: 9, fill: ['#fbbf24', '#fb7185', '#34d399', '#60a5fa'][b % 4] }));
                    layer.add(new window.Konva.Circle({ x: boneX + 60, y: underlineY + 9, radius: 9, fill: ['#fbbf24', '#fb7185', '#34d399', '#60a5fa'][b % 4] }));
                }

                // Enhanced bullet overflow fix
                const bulletData = (slideData?.content || []).map(t => t.trim());
                const bulletStartY = underlineY + 30;
                const maxContentY = h - 60; // Reserve space at bottom
                const initialFontSize = 26;
                const minFontSize = 14;
                let bulletFontSize = initialFontSize;
                const bulletLineHeight = 1.25;
                const bulletGap = 12; // gap between bullets
                const bulletTextWidth = w * 0.52 - margin * 1.2;

                // Calculate total space needed and reduce font size if necessary
                const availableSpace = maxContentY - bulletStartY;
                let totalHeight = 0;
                let bulletHeights = [];
                let fits = false;

                while (bulletFontSize >= minFontSize && !fits) {
                    bulletHeights = bulletData.map(txt => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: bulletFontSize,
                            width: bulletTextWidth,
                            lineHeight: bulletLineHeight,
                            fontFamily: 'Montserrat, Arial',
                            pw_id: undefined
                        });
                        return temp.height();
                    });
                    totalHeight = bulletHeights.reduce((a, b) => a + b, 0) + (bulletData.length - 1) * bulletGap;
                    fits = totalHeight <= availableSpace;
                    if (!fits) bulletFontSize -= 2;
                }

                // If still doesn't fit, use minimum font size
                if (!fits) {
                    bulletFontSize = minFontSize;
                    bulletHeights = bulletData.map(txt => {
                        const temp = new window.Konva.Text({
                            text: `   ${txt}`,
                            fontSize: bulletFontSize,
                            width: bulletTextWidth,
                            lineHeight: bulletLineHeight,
                            fontFamily: 'Montserrat, Arial',
                            pw_id: undefined
                        });
                        return temp.height();
                    });
                }

                // Render bullets with calculated font size
                let yCursor = bulletStartY;
                bulletData.forEach((txt, idx) => {
                    // Break if we would exceed available space
                    if (yCursor + bulletHeights[idx] > maxContentY) {
                        return;
                    }

                    layer.add(new window.Konva.Text({
                        text: `   ${txt}`,
                        x: margin,
                        y: yCursor,
                        width: bulletTextWidth,
                        fontSize: bulletFontSize,
                        fontFamily: 'Montserrat, Arial',
                        lineHeight: bulletLineHeight,
                        fill: '#6b463b',
                        pw_id: (slideData?._pw?.contentIds && slideData._pw.contentIds[idx]) ? slideData._pw.contentIds[idx] : undefined
                    }));
                    yCursor += bulletHeights[idx] + bulletGap;
                });

                // Right image frame
                const imgIndex = i - 1;
                const base64 = slideImagesResult?.slideImages?.[imgIndex];
                const frameX = w * 0.6 + 50;
                const frameY = 130;
                const frameW = w - frameX - 70;
                const frameH = h - frameY - 140;
                layer.add(new window.Konva.Rect({ x: frameX - 14, y: frameY - 14, width: frameW + 28, height: frameH + 28, fill: '#fff', cornerRadius: 40, shadowColor: '#000', shadowBlur: 28, shadowOpacity: 0.22 }));
                layer.add(new window.Konva.Rect({ x: frameX, y: frameY, width: frameW, height: frameH, fill: '#fffaf5', cornerRadius: 30 }));
                // Decorative paw top corner
                const pawGroup = new window.Konva.Group({ x: frameX + frameW - 70, y: frameY + 60, opacity: 0.25 });
                const pawSize = 70; const toeR = pawSize * 0.18;
                [[-pawSize * 0.3, -pawSize * 0.15], [0, -pawSize * 0.2], [pawSize * 0.3, -pawSize * 0.15], [-pawSize * 0.15, 0]].forEach(tp => pawGroup.add(new window.Konva.Circle({ x: tp[0], y: tp[1], radius: toeR, fill: '#fb7185' })));
                pawGroup.add(new window.Konva.Ellipse({ x: pawSize * 0.1, y: pawSize * 0.22, width: pawSize * 0.8, height: pawSize * 0.55, fill: '#fb7185', rotation: 8 }));
                layer.add(pawGroup);

                stage.add(layer); stage.draw();
                if (base64) {
                    const imgObj = new Image();
                    promises.push(new Promise(res => {
                        imgObj.onload = () => {
                            // Use a masked/covered image inside the frame so aspect ratio is preserved
                            const framePad = 40; // inner padding used previously (maxW = frameW - 80)
                            const innerW = frameW - framePad * 2;
                            const innerH = frameH - framePad * 2;
                            const innerX = frameX + framePad;
                            const innerY = frameY + framePad;

                            // Decorative glass under the clipped image (slightly larger)
                            const glassPad = 12;
                            const glassX = innerX - glassPad;
                            const glassY = innerY - glassPad;
                            const glassW = innerW + glassPad * 2;
                            const glassH = innerH + glassPad * 2;

                            const glass = new window.Konva.Rect({
                                x: glassX,
                                y: glassY,
                                width: glassW,
                                height: glassH,
                                fillLinearGradientStartPoint: { x: 0, y: 0 },
                                fillLinearGradientEndPoint: { x: glassW, y: glassH },
                                fillLinearGradientColorStops: [0, 'rgba(255,255,255,0.14)', 1, 'rgba(255,255,255,0.06)'],
                                cornerRadius: Math.max(30, 26 + Math.round(glassPad / 2)),
                                shadowColor: 'rgba(0,0,0,0.28)',
                                shadowBlur: 20,
                                shadowOffset: { x: 0, y: 10 },
                                shadowOpacity: 1,
                                stroke: 'rgba(255,255,255,0.18)',
                                strokeWidth: 2
                            });

                            // Clipped group for the visible image area
                            const imgClipRadius = 26;
                            const imgGroup = new window.Konva.Group({
                                x: innerX, y: innerY, clipFunc: function (ctx) {
                                    const fw = innerW, fh = innerH, r = imgClipRadius;
                                    ctx.beginPath();
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(fw - r, 0);
                                    ctx.quadraticCurveTo(fw, 0, fw, r);
                                    ctx.lineTo(fw, fh - r);
                                    ctx.quadraticCurveTo(fw, fh, fw - r, fh);
                                    ctx.lineTo(r, fh);
                                    ctx.quadraticCurveTo(0, fh, 0, fh - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                    ctx.closePath();
                                }
                            });

                            // Cover-scale the image to fill the inner frame
                            const imgW = imgObj.width || 1;
                            const imgH = imgObj.height || 1;
                            const scale = Math.max(innerW / imgW, innerH / imgH);
                            const drawW = Math.round(imgW * scale);
                            const drawH = Math.round(imgH * scale);
                            const imgX = Math.round((innerW - drawW) / 2);
                            const imgY = Math.round((innerH - drawH) / 2);

                            const imageNode = new window.Konva.Image({
                                image: imgObj,
                                x: imgX,
                                y: imgY,
                                width: drawW,
                                height: drawH,
                                opacity: 0.98,
                                shadowColor: '#000', shadowBlur: 20, shadowOpacity: 0.22,
                                pw_id: (typeof slideData !== 'undefined' ? SlideStyles._getImagePwId(slideData, parsedSlides) : SlideStyles._getImagePwId(parsedSlides.cover, parsedSlides))
                            });

                            // Add glass under and clipped image above
                            layer.add(glass);
                            imgGroup.add(imageNode);
                            layer.add(imgGroup);

                            // Ensure paw decoration stays on top
                            if (typeof pawGroup !== 'undefined') layer.add(pawGroup);

                            stage.draw();
                            res();
                        };
                        imgObj.onerror = () => { res(); };
                    }));
                    imgObj.src = base64;
                }

                // Page number (playful)
                layer.add(new window.Konva.Text({ x: w - 140, y: h - 80, text: i.toString(), fontSize: 50, fontFamily: 'Montserrat, Arial', fill: 'rgba(0,0,0,0.18)', pw_id: undefined }));
                stage.draw();
            }

            Promise.all(promises).then(() => resolve());
        });
    }


}

window.SlideStyles = SlideStyles;
