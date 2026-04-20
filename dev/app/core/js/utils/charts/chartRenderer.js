(function() {
	const DEFAULT_THEME = {
		background: '#ffffff',
		text: '#333333',
		title: '#333333',
		axis: '#666666',
		grid: '#dee2e6',
		axisLine: '#adb5bd',
		plotBackground: '#f8f9fa',
		plotBorder: '#e9ecef',
		legendBackground: 'rgba(0,0,0,0.02)',
		tooltipBackground: 'rgba(0,0,0,0.8)',
		tooltipText: '#ffffff',
		pointStroke: '#ffffff',
		fontFamily: 'sans-serif'
	};

	function resolveColor(value, fallback) {
		const trimmedValue = String(value || '').trim();
		return trimmedValue || fallback;
	}

	function getTheme() {
		const rootStyles = window.getComputedStyle(document.documentElement);
		const bodyStyles = window.getComputedStyle(document.body || document.documentElement);

		const background = resolveColor(
			rootStyles.getPropertyValue('--chart-bg') || rootStyles.getPropertyValue('--bg-color') || bodyStyles.backgroundColor,
			DEFAULT_THEME.background
		);
		const text = resolveColor(
			rootStyles.getPropertyValue('--chart-text') || rootStyles.getPropertyValue('--text-color') || bodyStyles.color,
			DEFAULT_THEME.text
		);
		const title = resolveColor(
			rootStyles.getPropertyValue('--chart-title') || rootStyles.getPropertyValue('--text-color'),
			text
		);
		const axis = resolveColor(
			rootStyles.getPropertyValue('--chart-axis') || rootStyles.getPropertyValue('--text-secondary'),
			DEFAULT_THEME.axis
		);
		const grid = resolveColor(
			rootStyles.getPropertyValue('--chart-grid') || rootStyles.getPropertyValue('--border-color'),
			DEFAULT_THEME.grid
		);
		const axisLine = resolveColor(
			rootStyles.getPropertyValue('--chart-axis-line') || rootStyles.getPropertyValue('--border-color'),
			DEFAULT_THEME.axisLine
		);
		const plotBackground = resolveColor(
			rootStyles.getPropertyValue('--chart-plot-bg') || rootStyles.getPropertyValue('--background-secondary'),
			DEFAULT_THEME.plotBackground
		);
		const plotBorder = resolveColor(
			rootStyles.getPropertyValue('--chart-plot-border') || rootStyles.getPropertyValue('--border-color'),
			DEFAULT_THEME.plotBorder
		);
		const legendBackground = resolveColor(
			rootStyles.getPropertyValue('--chart-legend-bg') || rootStyles.getPropertyValue('--background-secondary'),
			DEFAULT_THEME.legendBackground
		);
		const tooltipBackground = resolveColor(
			rootStyles.getPropertyValue('--chart-tooltip-bg'),
			DEFAULT_THEME.tooltipBackground
		);
		const tooltipText = resolveColor(
			rootStyles.getPropertyValue('--chart-tooltip-text'),
			DEFAULT_THEME.tooltipText
		);

		return {
			background,
			text,
			title,
			axis,
			grid,
			axisLine,
			plotBackground,
			plotBorder,
			legendBackground,
			tooltipBackground,
			tooltipText,
			pointStroke: background,
			fontFamily: DEFAULT_THEME.fontFamily
		};
	}

	function roundValue(value, decimals) {
		const precision = Number.isInteger(decimals) ? decimals : 2;
		const scale = Math.pow(10, precision);
		return Math.round(Number(value) * scale) / scale;
	}

	function drawRoundedRect(ctx, x, y, width, height, radius) {
		const effectiveRadius = Math.min(radius, width / 2, height / 2);
		ctx.beginPath();
		ctx.moveTo(x + effectiveRadius, y);
		ctx.arcTo(x + width, y, x + width, y + height, effectiveRadius);
		ctx.arcTo(x + width, y + height, x, y + height, effectiveRadius);
		ctx.arcTo(x, y + height, x, y, effectiveRadius);
		ctx.arcTo(x, y, x + width, y, effectiveRadius);
		ctx.closePath();
	}

	function sanitizeFilename(title) {
		return String(title || 'chart')
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.toLowerCase() || 'chart';
	}

	function layoutLegendItems(ctx, items, options) {
		const config = {
			font: options.font,
			containerWidth: options.containerWidth,
			markerSize: options.markerSize || 15,
			markerGap: options.markerGap || 8,
			itemGap: options.itemGap || 20,
			rowGap: options.rowGap || 10,
			paddingX: options.paddingX || 10,
			paddingY: options.paddingY || 8,
			lineHeight: options.lineHeight || 15
		};

		ctx.save();
		ctx.font = config.font;

		const rows = [];
		let currentRow = [];
		let currentWidth = 0;
		const maxRowContentWidth = Math.max(config.containerWidth - (config.paddingX * 2), config.markerSize + config.markerGap + 20);

		items.forEach(item => {
			const itemLabel = String(item.label != null ? item.label : item.name != null ? item.name : '');
			const textWidth = ctx.measureText(itemLabel).width;
			const itemWidth = config.markerSize + config.markerGap + textWidth;
			const nextWidth = currentRow.length ? currentWidth + config.itemGap + itemWidth : itemWidth;

			if (currentRow.length && nextWidth > maxRowContentWidth) {
				rows.push({ items: currentRow, width: currentWidth });
				currentRow = [{ ...item, label: itemLabel, itemWidth }];
				currentWidth = itemWidth;
			} else {
				currentRow.push({ ...item, label: itemLabel, itemWidth });
				currentWidth = nextWidth;
			}
		});

		if (currentRow.length) {
			rows.push({ items: currentRow, width: currentWidth });
		}

		ctx.restore();

		const contentHeight = rows.length
			? rows.length * config.lineHeight + Math.max(rows.length - 1, 0) * config.rowGap
			: config.lineHeight;

		return {
			rows,
			contentHeight,
			height: contentHeight + config.paddingY * 2,
			config
		};
	}

	function renderLegendToCanvas(ctx, legendLayout, x, y, theme) {
		const { rows, config } = legendLayout;
		ctx.save();
		ctx.font = config.font;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';

		rows.forEach((row, rowIndex) => {
			let cursorX = x + config.paddingX + Math.max((config.containerWidth - config.paddingX * 2 - row.width) / 2, 0);
			const centerY = y + config.paddingY + rowIndex * (config.lineHeight + config.rowGap) + config.lineHeight / 2;

			row.items.forEach((item, itemIndex) => {
				ctx.fillStyle = item.color;
				ctx.fillRect(cursorX, centerY - config.markerSize / 2, config.markerSize, config.markerSize);
				ctx.strokeStyle = 'rgba(0,0,0,0.2)';
				ctx.lineWidth = 1;
				ctx.strokeRect(cursorX, centerY - config.markerSize / 2, config.markerSize, config.markerSize);

				ctx.fillStyle = theme.text;
				ctx.fillText(item.label, cursorX + config.markerSize + config.markerGap, centerY);

				cursorX += item.itemWidth;
				if (itemIndex < row.items.length - 1) {
					cursorX += config.itemGap;
				}
			});
		});

		ctx.restore();
	}

	function setCurrentChartState(dataViz, state) {
		if (dataViz) {
			dataViz.currentChartRenderState = state || null;
		}
	}

	function getCurrentLayout(dataViz, type) {
		if (!dataViz || !dataViz.currentChartRenderState) {
			return null;
		}

		if (type && dataViz.currentChartRenderState.type !== type) {
			return null;
		}

		return dataViz.currentChartRenderState.layout || null;
	}

	function showChartInFloatingWindow(config) {
		const dataViz = config.dataViz;
		const layout = config.layout;
		const renderedChart = config.renderMarkup(layout, dataViz);
		dataViz.showFloatingWindow(renderedChart.html);
		setCurrentChartState(dataViz, {
			type: config.type,
			layout,
			title: layout.title
		});

		if (typeof config.attachBehavior === 'function') {
			config.attachBehavior(renderedChart, layout, dataViz);
		}

		const floatingWindow = document.querySelector('.dataviz-floating-window');
		if (floatingWindow && layout.modalWidth) {
			floatingWindow.style.width = `${layout.modalWidth}px`;
			floatingWindow.style.maxWidth = '95vw';
		}

		return layout;
	}

	function exportCurrentChartAsPng(config) {
		const layout = getCurrentLayout(config.dataViz, config.type);
		if (!layout) {
			return false;
		}

		const canvas = config.renderToCanvas(layout, config.scale || 2, config.dataViz);
		config.dataViz.downloadImage(canvas.toDataURL('image/png'), sanitizeFilename(layout.title));
		return true;
	}

	function captureCurrentChartAsDataUrl(config) {
		const layout = getCurrentLayout(config.dataViz, config.type);
		if (!layout) {
			return null;
		}

		return config.renderToCanvas(layout, config.scale || 2, config.dataViz).toDataURL('image/png');
	}

	window.DataVizChartRenderer = {
		getTheme,
		roundValue,
		drawRoundedRect,
		layoutLegendItems,
		renderLegendToCanvas,
		sanitizeFilename,
		setCurrentChartState,
		getCurrentLayout,
		showChartInFloatingWindow,
		exportCurrentChartAsPng,
		captureCurrentChartAsDataUrl
	};
})();
