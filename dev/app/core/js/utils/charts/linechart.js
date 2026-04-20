
(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function normalizeLineChartData(chartData) {
		const hasSimpleFormat = chartData && chartData.data && Array.isArray(chartData.data) && !chartData.series;

		if (!hasSimpleFormat) {
			return chartData;
		}

		return {
			title: chartData.title || 'Line Chart',
			xAxisLabel: 'Categories',
			yAxisLabel: 'Values',
			series: [
				{
					name: chartData.title || Lang.get('datavizDataSeries'),
					data: chartData.data.map(item => ({
						x: item.label,
						y: item.value
					}))
				}
			]
		};
	}

	function buildLineChartLayout(dataViz, chartData) {
		const normalizedChartData = normalizeLineChartData(chartData);
		if (!normalizedChartData || !Array.isArray(normalizedChartData.series) || normalizedChartData.series.length === 0) {
			return null;
		}

		const allXValues = [];
		const allYValues = [];
		const orderedXValues = [];
		const seenXValues = new Set();
		const seriesLayouts = [];
		const theme = chartRenderer.getTheme();
		const seriesCount = normalizedChartData.series.length;

		normalizedChartData.series.forEach((series, seriesIndex) => {
			const color = dataViz.colors[seriesIndex % dataViz.colors.length];
			const points = Array.isArray(series.data)
				? series.data
					.filter(point => point && point.x !== undefined && point.y !== undefined && Number.isFinite(Number(point.y)))
					.map(point => ({
						xLabel: String(point.x),
						yValue: Number(point.y),
						seriesName: series.name || `Series ${seriesIndex + 1}`,
						color
					}))
				: [];

			points.forEach(point => {
				allXValues.push(point.xLabel);
				allYValues.push(point.yValue);
				if (!seenXValues.has(point.xLabel)) {
					seenXValues.add(point.xLabel);
					orderedXValues.push(point.xLabel);
				}
			});

			seriesLayouts.push({
				name: series.name || `Series ${seriesIndex + 1}`,
				color,
				points
			});
		});

		if (!orderedXValues.length || !allYValues.length) {
			return null;
		}

		const rawMinY = Math.min(...allYValues);
		const rawMaxY = Math.max(...allYValues);
		const yRange = rawMaxY - rawMinY;
		const yPadding = yRange === 0 ? Math.max(Math.abs(rawMaxY) * 0.15, 1) : yRange * 0.12;
		const adjustedMinY = rawMinY >= 0 ? Math.max(0, rawMinY - yPadding) : rawMinY - yPadding;
		const adjustedMaxY = rawMaxY + yPadding;
		const chartWidth = Math.max(640, 120 + orderedXValues.length * 68);
		const labelRowHeight = 20;
		const xAxisLabelRows = seriesCount > 1 ? seriesCount : 1;
		const chartHeight = 430 + Math.max(0, xAxisLabelRows - 1) * labelRowHeight;
		const margin = {
			left: 86,
			right: 24,
			top: 32,
			bottom: seriesCount > 1 ? 110 + (seriesCount - 1) * labelRowHeight : 92
		};
		const plot = {
			x: margin.left,
			y: margin.top,
			width: chartWidth - margin.left - margin.right,
			height: chartHeight - margin.top - margin.bottom
		};
		plot.bottom = plot.y + plot.height;
		plot.right = plot.x + plot.width;

		const xDenominator = Math.max(orderedXValues.length - 1, 1);
		const yDenominator = Math.max(adjustedMaxY - adjustedMinY, 1);
		const yTickCount = 5;
		const yTicks = Array.from({ length: yTickCount + 1 }, (_, index) => {
			const ratio = index / yTickCount;
			const value = adjustedMinY + (adjustedMaxY - adjustedMinY) * ratio;
			const y = plot.bottom - ratio * plot.height;
			return {
				value,
				label: String(chartRenderer.roundValue(value)),
				y,
				isBaseline: index === 0 && adjustedMinY >= 0
			};
		});

		seriesLayouts.forEach(series => {
			series.renderPoints = series.points.map(point => {
				const xIndex = orderedXValues.indexOf(point.xLabel);
				const x = plot.x + (xIndex / xDenominator) * plot.width;
				const y = plot.bottom - ((point.yValue - adjustedMinY) / yDenominator) * plot.height;
				return {
					...point,
					x,
					y
				};
			});

			series.pathData = series.renderPoints
				.map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${chartRenderer.roundValue(point.x)} ${chartRenderer.roundValue(point.y)}`)
				.join(' ');
		});

		const singleSeriesLabels = seriesCount === 1
			? orderedXValues.map((label, index) => ({
				label,
				x: plot.x + (index / xDenominator) * plot.width,
				y: plot.bottom + 24
			}))
			: [];

		const multiSeriesRows = seriesCount > 1
			? seriesLayouts.map((series, seriesIndex) => ({
				name: series.name,
				color: series.color,
				y: plot.bottom + 20 + (seriesIndex * labelRowHeight),
				labels: series.renderPoints.map(point => ({
					label: point.xLabel,
					x: point.x
				}))
			}))
			: [];

		const legendItems = seriesLayouts.map(series => ({
			name: series.name,
			color: series.color
		}));

		return {
			title: normalizedChartData.title || Lang.get('datavizLineChart'),
			xAxisLabel: normalizedChartData.xAxisLabel || Lang.get('datavizXValues'),
			yAxisLabel: normalizedChartData.yAxisLabel || Lang.get('datavizYValues'),
			theme,
			series: seriesLayouts,
			legendItems,
			orderedXValues,
			singleSeriesLabels,
			multiSeriesRows,
			yTicks,
			plot,
			chartWidth,
			chartHeight,
			margin,
			modalWidth: Math.min(Math.max(chartWidth + 80, 700), window.innerWidth ? Math.max(window.innerWidth - 32, 700) : 1100),
			yAxisTitleX: 22,
			yAxisTitleY: plot.y + (plot.height / 2),
			xAxisTitleX: plot.x + (plot.width / 2),
			xAxisTitleY: chartHeight - 14
		};
	}

	function renderSvg(layout, dataViz) {
		const chartId = `line-chart-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const yTicksHtml = layout.yTicks.map(tick => `
			<line x1="${layout.plot.x - 6}" y1="${tick.y}" x2="${layout.plot.right}" y2="${tick.y}" stroke="${tick.isBaseline ? layout.theme.axisLine : layout.theme.grid}" stroke-width="${tick.isBaseline ? 1 : 0.75}" stroke-dasharray="${tick.isBaseline ? 'none' : '4,4'}" />
			<text x="${layout.plot.x - 10}" y="${tick.y}" text-anchor="end" dominant-baseline="middle" font-size="11" fill="${layout.theme.axis}">${escapeHtml(tick.label)}</text>
		`).join('');

		const xTicksHtml = layout.orderedXValues.map((_, index) => {
			const x = layout.plot.x + (index / Math.max(layout.orderedXValues.length - 1, 1)) * layout.plot.width;
			return `<line x1="${x}" y1="${layout.plot.bottom}" x2="${x}" y2="${layout.plot.bottom + 6}" stroke="${layout.theme.axisLine}" stroke-width="1" />`;
		}).join('');

		const xLabelsHtml = layout.singleSeriesLabels.map(label => `
			<text x="${label.x}" y="${label.y}" text-anchor="middle" font-size="11" font-weight="700" fill="${layout.theme.axis}">${escapeHtml(label.label)}</text>
		`).join('');

		const multiSeriesRowsHtml = layout.multiSeriesRows.map(row => `
			<text x="${layout.plot.x - 32}" y="${row.y}" text-anchor="end" font-size="11" font-weight="700" fill="${row.color}">${escapeHtml(row.name)}:</text>
			${row.labels.map(label => `<text x="${label.x}" y="${row.y}" text-anchor="middle" font-size="11" font-weight="500" fill="${row.color}">${escapeHtml(label.label)}</text>`).join('')}
		`).join('');

		const seriesHtml = layout.series.map(series => `
			<path d="${series.pathData}" fill="none" stroke="${series.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
			${series.renderPoints.map(point => `
				<circle cx="${point.x}" cy="${point.y}" r="4" fill="${series.color}" stroke="${layout.theme.pointStroke}" stroke-width="1.5" class="dataviz-linechart-point" data-series="${escapeHtml(series.name)}" data-x="${escapeHtml(point.xLabel)}" data-y="${escapeHtml(point.yValue)}" />
			`).join('')}
		`).join('');

		const legendHtml = layout.legendItems.map(item => `
			<div style="display:flex; align-items:center; margin:5px 10px; font-size:13px; color:${layout.theme.text};">
				<span style="display:inline-block; width:15px; height:15px; margin-right:8px; border-radius:2px; border:1px solid rgba(0,0,0,0.2); background:${item.color};"></span>
				<span>${escapeHtml(item.name)}</span>
			</div>
		`).join('');

		return {
			chartId,
			html: `
			<div class="dataviz-linechart-root" data-chart-id="${chartId}" style="display:flex; flex-direction:column; align-items:center; margin:0 auto; max-width:100%; font-family:${layout.theme.fontFamily}; color:${layout.theme.text}; background:${layout.theme.background};">
				<div class="chart-title" style="text-align:center; margin:0 0 16px 0; font-size:18px; font-weight:bold; color:${layout.theme.title};">${escapeHtml(layout.title)}</div>
				<div class="dataviz-linechart-frame line-chart-container" style="position:relative; width:${layout.chartWidth}px; height:${layout.chartHeight}px; overflow:visible; background:${layout.theme.background};">
					<svg width="${layout.chartWidth}" height="${layout.chartHeight}" viewBox="0 0 ${layout.chartWidth} ${layout.chartHeight}" role="img" aria-label="${escapeHtml(layout.title)}">
						<rect x="${layout.plot.x}" y="${layout.plot.y}" width="${layout.plot.width}" height="${layout.plot.height}" fill="${layout.theme.plotBackground}" stroke="${layout.theme.plotBorder}" stroke-width="1" />
						<text x="${layout.yAxisTitleX}" y="${layout.yAxisTitleY}" text-anchor="middle" font-size="12" fill="${layout.theme.axis}" transform="rotate(-90, ${layout.yAxisTitleX}, ${layout.yAxisTitleY})">${escapeHtml(layout.yAxisLabel)}</text>
						${yTicksHtml}
						<line x1="${layout.plot.x}" y1="${layout.plot.y}" x2="${layout.plot.x}" y2="${layout.plot.bottom}" stroke="${layout.theme.axisLine}" stroke-width="1" />
						<line x1="${layout.plot.x}" y1="${layout.plot.bottom}" x2="${layout.plot.right}" y2="${layout.plot.bottom}" stroke="${layout.theme.axisLine}" stroke-width="1" />
						${xTicksHtml}
						${xLabelsHtml}
						${multiSeriesRowsHtml}
						${seriesHtml}
						<text x="${layout.xAxisTitleX}" y="${layout.xAxisTitleY}" text-anchor="middle" font-size="12" fill="${layout.theme.axis}">${escapeHtml(layout.xAxisLabel)}</text>
					</svg>
					<div class="dataviz-linechart-tooltip" style="position:absolute; display:none; pointer-events:none; z-index:10; background:${layout.theme.tooltipBackground}; color:${layout.theme.tooltipText}; padding:6px 10px; border-radius:4px; font-size:12px; box-shadow:0 4px 12px rgba(0,0,0,0.18);"></div>
				</div>
				<div style="display:flex; flex-wrap:wrap; justify-content:center; width:${layout.chartWidth}px; margin-top:12px; padding:8px; border-radius:4px; background:${layout.theme.legendBackground};">${legendHtml}</div>
			</div>
			`
		};
	}

	function attachTooltipBehavior(chartId) {
		const root = document.querySelector(`.dataviz-linechart-root[data-chart-id="${chartId}"]`);
		if (!root) {
			return;
		}

		const tooltip = root.querySelector('.dataviz-linechart-tooltip');
		const frame = root.querySelector('.dataviz-linechart-frame');
		if (!tooltip || !frame) {
			return;
		}

		root.querySelectorAll('.dataviz-linechart-point').forEach(point => {
			point.addEventListener('mouseenter', event => {
				const frameRect = frame.getBoundingClientRect();
				tooltip.innerHTML = '<strong>' + point.getAttribute('data-series') + '</strong><br>' + point.getAttribute('data-x') + ': ' + point.getAttribute('data-y');
				tooltip.style.display = 'block';
				tooltip.style.left = `${event.clientX - frameRect.left + 12}px`;
				tooltip.style.top = `${event.clientY - frameRect.top - 36}px`;
			});

			point.addEventListener('mousemove', event => {
				if (tooltip.style.display === 'none') {
					return;
				}

				const frameRect = frame.getBoundingClientRect();
				tooltip.style.left = `${event.clientX - frameRect.left + 12}px`;
				tooltip.style.top = `${event.clientY - frameRect.top - 36}px`;
			});

			point.addEventListener('mouseleave', () => {
				tooltip.style.display = 'none';
			});
		});
	}

	function renderToCanvas(layout, scale) {
		const exportScale = scale || 2;
		const padding = 20;
		const legendTop = 16;
		const legendLayout = chartRenderer.layoutLegendItems(document.createElement('canvas').getContext('2d'), layout.legendItems, {
			font: `13px ${layout.theme.fontFamily}`,
			containerWidth: layout.chartWidth,
			markerSize: 15,
			markerGap: 8,
			itemGap: 20,
			rowGap: 10,
			paddingX: 8,
			paddingY: 8,
			lineHeight: 15
		});
		const canvas = document.createElement('canvas');
		canvas.width = Math.ceil((layout.chartWidth + padding * 2) * exportScale);
		canvas.height = Math.ceil((layout.chartHeight + padding * 2 + legendTop + legendLayout.height) * exportScale);
		const ctx = canvas.getContext('2d');
		ctx.scale(exportScale, exportScale);

		const originX = padding;
		const originY = padding;
		ctx.fillStyle = layout.theme.background;
		ctx.fillRect(0, 0, canvas.width / exportScale, canvas.height / exportScale);

		ctx.fillStyle = layout.theme.title;
		ctx.font = `bold 18px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(layout.title, originX + layout.chartWidth / 2, originY);

		ctx.fillStyle = layout.theme.plotBackground;
		ctx.fillRect(originX + layout.plot.x, originY + layout.plot.y, layout.plot.width, layout.plot.height);
		ctx.strokeStyle = layout.theme.plotBorder;
		ctx.lineWidth = 1;
		ctx.strokeRect(originX + layout.plot.x, originY + layout.plot.y, layout.plot.width, layout.plot.height);

		ctx.font = `11px ${layout.theme.fontFamily}`;
		layout.yTicks.forEach(tick => {
			ctx.beginPath();
			ctx.moveTo(originX + layout.plot.x - 6, originY + tick.y);
			ctx.lineTo(originX + layout.plot.right, originY + tick.y);
			ctx.strokeStyle = tick.isBaseline ? layout.theme.axisLine : layout.theme.grid;
			ctx.lineWidth = tick.isBaseline ? 1 : 0.75;
			ctx.setLineDash(tick.isBaseline ? [] : [4, 4]);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = layout.theme.axis;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(tick.label, originX + layout.plot.x - 10, originY + tick.y);
		});

		ctx.beginPath();
		ctx.moveTo(originX + layout.plot.x, originY + layout.plot.y);
		ctx.lineTo(originX + layout.plot.x, originY + layout.plot.bottom);
		ctx.lineTo(originX + layout.plot.right, originY + layout.plot.bottom);
		ctx.strokeStyle = layout.theme.axisLine;
		ctx.lineWidth = 1;
		ctx.stroke();

		layout.orderedXValues.forEach((_, index) => {
			const x = originX + layout.plot.x + (index / Math.max(layout.orderedXValues.length - 1, 1)) * layout.plot.width;
			ctx.beginPath();
			ctx.moveTo(x, originY + layout.plot.bottom);
			ctx.lineTo(x, originY + layout.plot.bottom + 6);
			ctx.strokeStyle = layout.theme.axisLine;
			ctx.stroke();
		});

		ctx.fillStyle = layout.theme.axis;
		if (layout.singleSeriesLabels.length) {
			ctx.font = `700 11px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			layout.singleSeriesLabels.forEach(label => {
				ctx.fillText(label.label, originX + label.x, originY + label.y);
			});
		} else {
			layout.multiSeriesRows.forEach(row => {
				ctx.font = `700 11px ${layout.theme.fontFamily}`;
				ctx.fillStyle = row.color;
				ctx.textAlign = 'right';
				ctx.textBaseline = 'middle';
				ctx.fillText(`${row.name}:`, originX + layout.plot.x - 32, originY + row.y);
				ctx.font = `500 11px ${layout.theme.fontFamily}`;
				ctx.textAlign = 'center';
				row.labels.forEach(label => {
					ctx.fillText(label.label, originX + label.x, originY + row.y);
				});
			});
		}

		layout.series.forEach(series => {
			if (!series.renderPoints.length) {
				return;
			}

			ctx.beginPath();
			series.renderPoints.forEach((point, pointIndex) => {
				const canvasX = originX + point.x;
				const canvasY = originY + point.y;
				if (pointIndex === 0) {
					ctx.moveTo(canvasX, canvasY);
				} else {
					ctx.lineTo(canvasX, canvasY);
				}
			});
			ctx.strokeStyle = series.color;
			ctx.lineWidth = 2.5;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.stroke();

			series.renderPoints.forEach(point => {
				ctx.beginPath();
				ctx.arc(originX + point.x, originY + point.y, 4, 0, Math.PI * 2);
				ctx.fillStyle = series.color;
				ctx.fill();
				ctx.strokeStyle = layout.theme.pointStroke;
				ctx.lineWidth = 1.5;
				ctx.stroke();
			});
		});

		ctx.save();
		ctx.translate(originX + layout.yAxisTitleX, originY + layout.yAxisTitleY);
		ctx.rotate(-Math.PI / 2);
		ctx.fillStyle = layout.theme.axis;
		ctx.font = `12px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(layout.yAxisLabel, 0, 0);
		ctx.restore();

		ctx.fillStyle = layout.theme.axis;
		ctx.font = `12px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(layout.xAxisLabel, originX + layout.xAxisTitleX, originY + layout.xAxisTitleY);

		const legendY = originY + layout.chartHeight + legendTop;
		chartRenderer.drawRoundedRect(ctx, originX, legendY, layout.chartWidth, legendLayout.height, 4);
		ctx.fillStyle = layout.theme.legendBackground;
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendY, layout.theme);

		return canvas;
	}

	function renderLineChart(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			 <div class="dataviz-error">
				 <h3>${Lang.get('datavizErrorLineChart')}</h3>
				 <p>${Lang.get('datavizErrorMessage')}</p>
			 </div>
			`);
		}

		const layout = buildLineChartLayout(dataViz, chartData);

		if (!layout) {
			console.error('DataViz: Invalid line chart data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			 <div class="dataviz-error">
				 <h3>${Lang.get('datavizErrorLineChart')}</h3>
				 <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorEmptyData') })}</p>
			 </div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'line',
			layout,
			renderMarkup: renderSvg,
			attachBehavior: renderedChart => attachTooltipBehavior(renderedChart.chartId)
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'line', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'line', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizLineChart = {
		buildLayout: buildLineChartLayout,
		render: renderLineChart,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
