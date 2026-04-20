(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function parseColor(color) {
		const value = String(color || '').trim();

		if (value.startsWith('#')) {
			const hex = value.slice(1);
			if (hex.length === 6) {
				return {
					r: parseInt(hex.slice(0, 2), 16),
					g: parseInt(hex.slice(2, 4), 16),
					b: parseInt(hex.slice(4, 6), 16)
				};
			}
		}

		if (value.startsWith('rgb')) {
			const match = value.match(/(\d+),\s*(\d+),\s*(\d+)/);
			if (match) {
				return {
					r: parseInt(match[1], 10),
					g: parseInt(match[2], 10),
					b: parseInt(match[3], 10)
				};
			}
		}

		return { r: 0, g: 0, b: 0 };
	}

	function interpolateColor(color1, color2, factor) {
		const start = parseColor(color1);
		const end = parseColor(color2);
		const ratio = Math.max(0, Math.min(1, Number(factor) || 0));

		const r = Math.round(start.r + ratio * (end.r - start.r));
		const g = Math.round(start.g + ratio * (end.g - start.g));
		const b = Math.round(start.b + ratio * (end.b - start.b));

		return `rgb(${r}, ${g}, ${b})`;
	}

	function getBestTextColorStyle(backgroundColor) {
		const rgb = parseColor(backgroundColor);
		const r = rgb.r / 255;
		const g = rgb.g / 255;
		const b = rgb.b / 255;

		const normalizedR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
		const normalizedG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
		const normalizedB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

		const luminance = 0.2126 * normalizedR + 0.7152 * normalizedG + 0.0722 * normalizedB;
		return luminance < 0.5
			? 'fill:#ffffff !important; -webkit-text-fill-color:#ffffff !important; color:#ffffff !important;'
			: 'fill:#000000 !important; -webkit-text-fill-color:#000000 !important; color:#000000 !important;';
	}

	function buildHeatMapLayout(dataViz, chartData) {
		if (!chartRenderer) {
			return null;
		}

		if (!chartData
			|| !Array.isArray(chartData.xLabels)
			|| !Array.isArray(chartData.yLabels)
			|| !Array.isArray(chartData.data)) {
			return { error: 'structure' };
		}

		const allRowsValid = chartData.data.every(row => Array.isArray(row) && row.length === chartData.xLabels.length);
		if (!allRowsValid || chartData.data.length !== chartData.yLabels.length) {
			return { error: 'dimensions' };
		}

		const theme = chartRenderer.getTheme();
		const colorScale = {
			min: chartData.colorScale && chartData.colorScale.min !== undefined ? chartData.colorScale.min : null,
			max: chartData.colorScale && chartData.colorScale.max !== undefined ? chartData.colorScale.max : null,
			minColor: (chartData.colorScale && chartData.colorScale.minColor) || '#f7fbff',
			maxColor: (chartData.colorScale && chartData.colorScale.maxColor) || '#08306b'
		};

		if (colorScale.min === null || colorScale.max === null) {
			let minValue = Infinity;
			let maxValue = -Infinity;

			chartData.data.forEach(row => {
				row.forEach(value => {
					minValue = Math.min(minValue, value);
					maxValue = Math.max(maxValue, value);
				});
			});

			colorScale.min = colorScale.min === null ? minValue : colorScale.min;
			colorScale.max = colorScale.max === null ? maxValue : colorScale.max;
		}

		const cellSize = Math.min(
			Math.max(15, 600 / Math.max(chartData.xLabels.length, 1)),
			Math.max(15, 500 / Math.max(chartData.yLabels.length, 1))
		);
		const fontSize = Math.max(9, Math.min(12, cellSize / 3));
		const maxXLabelLength = Math.max(...chartData.xLabels.map(label => String(label).length), 0);
		const maxYLabelLength = Math.max(...chartData.yLabels.map(label => String(label).length), 0);
		const leftMargin = Math.max(50, maxYLabelLength * 7);
		const bottomMargin = Math.max(100, maxXLabelLength * 5);
		const topMargin = 30;
		const width = leftMargin + (chartData.xLabels.length * cellSize);
		const height = topMargin + (chartData.yLabels.length * cellSize) + bottomMargin;
		const legendWidth = 200;
		const legendHeight = 20;
		const legendX = width / 2 - legendWidth / 2;
		const legendY = 10;

		const cells = [];
		chartData.data.forEach((row, rowIndex) => {
			row.forEach((value, columnIndex) => {
				const x = leftMargin + (columnIndex * cellSize);
				const y = topMargin + (rowIndex * cellSize);
				const ratio = Math.max(0, Math.min(1, (value - colorScale.min) / (colorScale.max - colorScale.min || 1)));
				const fill = interpolateColor(colorScale.minColor, colorScale.maxColor, ratio);
				cells.push({
					x,
					y,
					width: cellSize,
					height: cellSize,
					fill,
					value,
					xLabel: chartData.xLabels[columnIndex],
					yLabel: chartData.yLabels[rowIndex],
					textStyle: getBestTextColorStyle(fill)
				});
			});
		});

		const xAxisLabels = chartData.xLabels.map((label, index) => ({
			label,
			x: leftMargin + (index * cellSize) + (cellSize / 2),
			y: topMargin + (chartData.yLabels.length * cellSize) + 20
		}));

		const yAxisLabels = chartData.yLabels.map((label, index) => ({
			label,
			x: leftMargin - 10,
			y: topMargin + (index * cellSize) + (cellSize / 2)
		}));

		return {
			type: 'heatmap',
			title: chartData.title || Lang.get('datavizHeatMap'),
			theme,
			modalWidth: 700,
			width,
			height,
			cellSize,
			fontSize,
			leftMargin,
			bottomMargin,
			topMargin,
			legendWidth,
			legendHeight,
			legendX,
			legendY,
			colorScale,
			cells,
			xAxisLabels,
			yAxisLabels
		};
	}

	function renderMarkup(layout, dataViz) {
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const cellsHtml = layout.cells.map(cell => `
			<rect
				x="${cell.x}"
				y="${cell.y}"
				width="${cell.width}"
				height="${cell.height}"
				fill="${cell.fill}"
				stroke="#fff"
				stroke-width="1"
				class="heat-cell"
			/>
			<text
				x="${cell.x + cell.width / 2}"
				y="${cell.y + cell.height / 2}"
				dominant-baseline="middle"
				text-anchor="middle"
				style="${cell.textStyle}"
				font-size="${layout.fontSize}px"
				class="cell-text heat-map-cell-text"
			>
				${escapeHtml(cell.value)}
			</text>
		`).join('');

		const xAxisLabelsHtml = layout.xAxisLabels.map(label => `
			<text
				x="${label.x}"
				y="${label.y}"
				text-anchor="middle"
				transform="rotate(45, ${label.x}, ${label.y})"
				class="axis-label x-label"
			>
				${escapeHtml(label.label)}
			</text>
		`).join('');

		const yAxisLabelsHtml = layout.yAxisLabels.map(label => `
			<text
				x="${label.x}"
				y="${label.y}"
				text-anchor="end"
				dominant-baseline="middle"
				class="axis-label y-label"
			>
				${escapeHtml(label.label)}
			</text>
		`).join('');

		const gradientId = `heat-gradient-${Date.now()}`;
		const legendHtml = `
			<defs>
				<linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stop-color="${layout.colorScale.minColor}" />
					<stop offset="100%" stop-color="${layout.colorScale.maxColor}" />
				</linearGradient>
			</defs>
			<text
				x="${layout.legendX + layout.legendWidth / 2}"
				y="${layout.legendY - 50}"
				text-anchor="middle"
				class="legend-title"
			>
				${escapeHtml(Lang.get('datavizValueScale'))}
			</text>
			<rect
				x="${layout.legendX}"
				y="${layout.legendY - 25}"
				width="${layout.legendWidth}"
				height="${layout.legendHeight}"
				fill="url(#${gradientId})"
				stroke="${layout.theme.plotBorder}"
				stroke-width="1"
			/>
			<text x="${layout.legendX}" y="${layout.legendY + 10}" text-anchor="start" class="legend-label">${escapeHtml(layout.colorScale.min)}</text>
			<text x="${layout.legendX + layout.legendWidth}" y="${layout.legendY + 10}" text-anchor="end" class="legend-label">${escapeHtml(layout.colorScale.max)}</text>
		`;

		return {
			html: `
			<style>
				.chart-container {
					display:flex;
					flex-direction:column;
					align-items:center;
					margin:0 auto;
					max-width:100%;
					font-family:${layout.theme.fontFamily};
					overflow-x:auto;
					color:${layout.theme.text};
				}
				.chart-title {
					text-align:center;
					margin-bottom:5px;
					font-size:18px;
					font-weight:bold;
					color:${layout.theme.title};
				}
				.axis-label {
					font-size:11px;
					fill:${layout.theme.text};
				}
				.x-label {
					font-size:10px;
				}
				.legend-label {
					font-size:10px;
					fill:${layout.theme.axis};
				}
				.legend-title {
					font-size:12px;
					fill:${layout.theme.title};
					font-weight:500;
				}
				.cell-text {
					user-select:none;
					pointer-events:none;
				}
				.heat-map-cell-text {
					--chart-text:unset !important;
					--text-color:unset !important;
					fill:currentColor !important;
				}
			</style>
			<div class="chart-container">
				<div class="chart-title">${escapeHtml(layout.title)}</div>
				<div class="heat-map-container">
					<svg width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
						${legendHtml}
						${cellsHtml}
						${xAxisLabelsHtml}
						${yAxisLabelsHtml}
					</svg>
				</div>
			</div>
			`
		};
	}

	function renderToCanvas(layout, scale) {
		const exportScale = scale || 2;
		const padding = 20;
		const titleHeight = 36;
		const totalWidth = padding * 2 + layout.width;
		const totalHeight = padding * 2 + titleHeight + layout.height;
		const canvas = document.createElement('canvas');
		canvas.width = Math.ceil(totalWidth * exportScale);
		canvas.height = Math.ceil(totalHeight * exportScale);
		const ctx = canvas.getContext('2d');
		ctx.scale(exportScale, exportScale);

		ctx.fillStyle = layout.theme.background;
		ctx.fillRect(0, 0, totalWidth, totalHeight);

		const originX = padding;
		const originY = padding + titleHeight;

		ctx.fillStyle = layout.theme.title;
		ctx.font = `bold 18px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(layout.title, originX + layout.width / 2, padding);

		const gradient = ctx.createLinearGradient(originX + layout.legendX, 0, originX + layout.legendX + layout.legendWidth, 0);
		gradient.addColorStop(0, layout.colorScale.minColor);
		gradient.addColorStop(1, layout.colorScale.maxColor);
		ctx.fillStyle = layout.theme.title;
		ctx.font = `500 12px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(Lang.get('datavizValueScale'), originX + layout.legendX + layout.legendWidth / 2, originY + layout.legendY - 50);
		ctx.fillStyle = gradient;
		ctx.fillRect(originX + layout.legendX, originY + layout.legendY - 25, layout.legendWidth, layout.legendHeight);
		ctx.strokeStyle = layout.theme.plotBorder;
		ctx.lineWidth = 1;
		ctx.strokeRect(originX + layout.legendX, originY + layout.legendY - 25, layout.legendWidth, layout.legendHeight);
		ctx.fillStyle = layout.theme.axis;
		ctx.font = `10px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'start';
		ctx.fillText(String(layout.colorScale.min), originX + layout.legendX, originY + layout.legendY + 10);
		ctx.textAlign = 'end';
		ctx.fillText(String(layout.colorScale.max), originX + layout.legendX + layout.legendWidth, originY + layout.legendY + 10);

		layout.cells.forEach(cell => {
			ctx.fillStyle = cell.fill;
			ctx.fillRect(originX + cell.x, originY + cell.y, cell.width, cell.height);
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 1;
			ctx.strokeRect(originX + cell.x, originY + cell.y, cell.width, cell.height);

			const darkText = cell.textStyle.includes('#000000');
			ctx.fillStyle = darkText ? '#000000' : '#ffffff';
			ctx.font = `${layout.fontSize}px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(cell.value), originX + cell.x + cell.width / 2, originY + cell.y + cell.height / 2);
		});

		ctx.fillStyle = layout.theme.text;
		ctx.font = `11px ${layout.theme.fontFamily}`;
		layout.xAxisLabels.forEach(label => {
			ctx.save();
			ctx.translate(originX + label.x, originY + label.y);
			ctx.rotate(Math.PI / 4);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(label.label), 0, 0);
			ctx.restore();
		});

		layout.yAxisLabels.forEach(label => {
			ctx.fillStyle = layout.theme.text;
			ctx.font = `11px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(label.label), originX + label.x, originY + label.y);
		});

		return canvas;
	}

	function renderHeatMap(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorHeatMap')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
			`);
		}

		const layout = buildHeatMapLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid heat map data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorHeatMap')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorHeatMapRequirement') })}</p>
			</div>
			`);
		}

		if (layout.error === 'dimensions') {
			console.error('DataViz: Heat map data dimensions mismatch');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorHeatMap')}</h3>
				<p>${Lang.get('datavizErrorHeatMapDimensions')}</p>
			</div>
			`);
		}

		if (layout.error === 'structure') {
			console.error('DataViz: Invalid heat map data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorHeatMap')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorHeatMapRequirement') })}</p>
			</div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'heatmap',
			layout,
			renderMarkup
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'heatmap', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'heatmap', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizHeatMapChart = {
		buildLayout: buildHeatMapLayout,
		render: renderHeatMap,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
