(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function normalizeAreaChartData(chartData) {
		const hasSimpleFormat = chartData && chartData.data && Array.isArray(chartData.data) && !chartData.series;

		if (!hasSimpleFormat) {
			return chartData;
		}

		return {
			title: chartData.title || Lang.get('datavizAreaChart'),
			xAxisLabel: 'Categories',
			yAxisLabel: 'Values',
			series: [
				{
					name: chartData.title || 'Data Series',
					data: chartData.data.map(item => ({
						x: item.label,
						y: item.value
					}))
				}
			]
		};
	}

	function cloneAreaChartData(chartData) {
		return {
			...chartData,
			series: Array.isArray(chartData.series)
				? chartData.series.map(series => ({
					...series,
					data: Array.isArray(series.data)
						? series.data.map(point => ({ ...point }))
						: []
				}))
				: []
		};
	}

	function resolveAreaFillColor(baseColor) {
		if (baseColor.includes('rgba') || (baseColor.includes('#') && baseColor.length > 7)) {
			return baseColor;
		}

		if (baseColor.startsWith('#')) {
			return `${baseColor}80`;
		}

		return baseColor.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
	}

	function buildAreaChartLayout(dataViz, rawChartData) {
		if (!chartRenderer) {
			return null;
		}

		const normalizedChartData = normalizeAreaChartData(rawChartData);
		if (!normalizedChartData || !Array.isArray(normalizedChartData.series) || normalizedChartData.series.length === 0) {
			return null;
		}

		const chartData = cloneAreaChartData(normalizedChartData);
		const isStacked = chartData.stacked === true;
		const isPercentage = chartData.percentage === true;
		const theme = chartRenderer.getTheme();
		let allXValues = [];
		let allYValues = [];
		const stackedYValues = {};

		chartData.series.forEach(series => {
			if (!Array.isArray(series.data)) {
				return;
			}

			series.data.forEach(point => {
				if (!point || point.x === undefined || point.y === undefined) {
					return;
				}

				allXValues.push(point.x);
				if (isStacked) {
					if (!stackedYValues[point.x]) {
						stackedYValues[point.x] = 0;
					}
					stackedYValues[point.x] += Number(point.y) || 0;
					allYValues.push(stackedYValues[point.x]);
				} else {
					allYValues.push(Number(point.y) || 0);
				}
			});
		});

		allXValues = [...new Set(allXValues)].sort();

		if (isPercentage && isStacked) {
			const totals = {};
			allXValues.forEach(x => {
				totals[x] = 0;
				chartData.series.forEach(series => {
					const point = series.data.find(item => item.x === x);
					if (point) {
						totals[x] += Number(point.y) || 0;
					}
				});
			});

			chartData.series.forEach(series => {
				series.data.forEach(point => {
					if (totals[point.x] > 0) {
						point.originalY = point.y;
						point.y = (point.y / totals[point.x]) * 100;
					}
				});
			});

			allYValues = isStacked ? [100] : allYValues.map(value => Math.min(100, value));
		}

		const minY = Math.min(...allYValues, 0);
		const maxY = Math.max(...allYValues);
		let adjustedMinY;
		let adjustedMaxY;

		if (isPercentage) {
			adjustedMinY = 0;
			adjustedMaxY = 100;
		} else {
			const yPadding = (maxY - minY) * 0.1;
			adjustedMinY = Math.max(0, minY - yPadding);
			adjustedMaxY = maxY + yPadding;
		}

		const chartWidth = 650;
		const chartHeight = 400;
		const yAxisWidth = 70;
		const xAxisHeight = 60;
		const plotWidth = chartWidth - yAxisWidth - 20;
		const plotHeight = chartHeight - xAxisHeight - 20;
		const topPadding = 20;
		const rotation = allXValues.length > 7 ? -45 : 0;
		const xTickYOffset = rotation !== 0 ? 15 : 20;
		const xTickTextAnchor = rotation !== 0 ? 'end' : 'middle';

		const seriesFillColors = chartData.series.map((series, index) => {
			const baseColor = series.fillColor || dataViz.colors[index % dataViz.colors.length];
			return resolveAreaFillColor(baseColor);
		});
		const seriesStrokeColors = chartData.series.map((series, index) => series.fillColor || dataViz.colors[index % dataViz.colors.length]);

		let legendItems = [];
		let seriesLayouts = [];
		const seriesToProcess = isStacked ? [...chartData.series].reverse() : chartData.series;

		seriesToProcess.forEach((series, seriesIndex) => {
			const actualIndex = isStacked ? chartData.series.length - 1 - seriesIndex : seriesIndex;
			const color = seriesFillColors[actualIndex];
			const strokeColor = seriesStrokeColors[actualIndex];

			legendItems = [{
				name: series.name || `Series ${actualIndex + 1}`,
				color: strokeColor
			}].concat(legendItems);

			if (!Array.isArray(series.data) || series.data.length === 0) {
				return;
			}

			const sortedData = [...series.data].sort((a, b) => allXValues.indexOf(a.x) - allXValues.indexOf(b.x));
			const stackedValues = {};

			if (isStacked && actualIndex < chartData.series.length - 1) {
				for (let i = actualIndex + 1; i < chartData.series.length; i += 1) {
					const previousSeries = chartData.series[i];
					previousSeries.data.forEach(point => {
						if (!stackedValues[point.x]) {
							stackedValues[point.x] = 0;
						}
						stackedValues[point.x] += Number(point.y) || 0;
					});
				}
			}

			const topPoints = [];
			const basePoints = [];
			const points = [];

			sortedData.forEach(point => {
				const x = point.x;
				const y = Number(point.y) || 0;
				const stackedY = (isStacked && stackedValues[x]) ? y + stackedValues[x] : y;
				const xPos = yAxisWidth + (allXValues.indexOf(x) / (allXValues.length - 1 || 1)) * plotWidth;
				const yPos = topPadding + ((adjustedMaxY - stackedY) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;
				const baselineValue = isStacked && stackedValues[x] ? stackedValues[x] : adjustedMinY;
				const baseYPos = topPadding + ((adjustedMaxY - baselineValue) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;

				topPoints.push({ x: xPos, y: yPos });
				basePoints.push({ x: xPos, y: baseYPos });
				points.push({
					xLabel: x,
					x: xPos,
					y: yPos,
					value: isPercentage && point.originalY ? point.originalY : y,
					stackedY,
					isPercentage,
					seriesName: series.name || `Series ${actualIndex + 1}`
				});
			});

			let pathData = '';
			if (topPoints.length) {
				pathData = topPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
			}

			let areaPathData = '';
			if (topPoints.length) {
				const polygonPoints = topPoints.concat([...basePoints].reverse());
				areaPathData = `M ${polygonPoints[0].x} ${polygonPoints[0].y}`;
				polygonPoints.slice(1).forEach(point => {
					areaPathData += ` L ${point.x} ${point.y}`;
				});
				areaPathData += ' Z';
			}

			seriesLayouts.push({
				name: series.name || `Series ${actualIndex + 1}`,
				color,
				strokeColor,
				points,
				topPoints,
				basePoints,
				pathData,
				areaPathData,
				zIndex: isStacked ? actualIndex : 0
			});
		});

		seriesLayouts.sort((a, b) => a.zIndex - b.zIndex);

		const yAxisTicks = Array.from({ length: 6 }, (_, index) => {
			const value = adjustedMinY + (adjustedMaxY - adjustedMinY) * (index / 5);
			const yPos = topPadding + ((adjustedMaxY - value) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;
			return {
				value,
				label: isPercentage ? `${Math.round(value)}%` : String(Math.round(value * 10) / 10),
				y: yPos,
				isBaseline: index === 0
			};
		});

		const xAxisTicks = allXValues.map((value, index) => ({
			value,
			x: yAxisWidth + (index / (allXValues.length - 1 || 1)) * plotWidth,
			rotation,
			yOffset: xTickYOffset,
			textAnchor: xTickTextAnchor
		}));

		return {
			type: 'area',
			title: chartData.title || Lang.get('datavizAreaChart'),
			theme,
			modalWidth: 700,
			chartWidth,
			chartHeight,
			yAxisWidth,
			xAxisHeight,
			plotWidth,
			plotHeight,
			topPadding,
			xAxisLabel: chartData.xAxisLabel || Lang.get('datavizXValues'),
			yAxisLabel: chartData.yAxisLabel || '',
			legendItems,
			series: seriesLayouts,
			yAxisTicks,
			xAxisTicks,
			isStacked,
			isPercentage,
			chartTypeLabel: isStacked ? `${isPercentage ? Lang.get('datavizPercentageAreaChart') : Lang.get('datavizStackedAreaChart')} ${Lang.get('datavizAreaChart')}` : ''
		};
	}

	function renderMarkup(layout, dataViz) {
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const backgroundRect = `
			<rect
				x="${layout.yAxisWidth}"
				y="${layout.topPadding}"
				width="${layout.plotWidth}"
				height="${layout.plotHeight}"
				fill="${layout.theme.plotBackground || '#f8f9fa'}"
				stroke="${layout.theme.plotBorder || '#e9ecef'}"
				stroke-width="1"
			/>
		`;

		const yAxisTicksHtml = layout.yAxisTicks.map(tick => `
			<line
				x1="${layout.yAxisWidth - 5}"
				y1="${tick.y}"
				x2="${layout.yAxisWidth + layout.plotWidth}"
				y2="${tick.y}"
				stroke="${tick.isBaseline ? layout.theme.axisLine : layout.theme.grid}"
				stroke-dasharray="${tick.isBaseline ? 'none' : '3,3'}"
				stroke-width="${tick.isBaseline ? 1 : 0.5}"
			/>
			<text
				x="${layout.yAxisWidth - 10}"
				y="${tick.y}"
				text-anchor="end"
				dominant-baseline="middle"
				class="axis-label"
			>
				${escapeHtml(tick.label)}
			</text>
		`).join('');

		const xAxisTicksHtml = layout.xAxisTicks.map(tick => `
			<line
				x1="${tick.x}"
				y1="${layout.topPadding + layout.plotHeight}"
				x2="${tick.x}"
				y2="${layout.topPadding + layout.plotHeight + 5}"
				stroke="${layout.theme.axisLine}"
				stroke-width="1"
			/>
			<text
				x="${tick.x}"
				y="${layout.topPadding + layout.plotHeight + tick.yOffset}"
				text-anchor="${tick.textAnchor}"
				transform="rotate(${tick.rotation}, ${tick.x}, ${layout.topPadding + layout.plotHeight + tick.yOffset})"
				class="axis-label"
			>
				${escapeHtml(tick.value)}
			</text>
		`).join('');

		const legendHtml = layout.legendItems.map(item => `
			<div class="legend-item">
				<span class="color-box" style="background-color:${item.color}"></span>
				<span class="legend-label">${escapeHtml(item.name)}</span>
			</div>
		`).join('');

		const seriesAreaPaths = layout.series.map(series => `
			<path
				d="${series.areaPathData}"
				fill="${series.color}"
				class="area-path"
			/>
		`).join('');

		const seriesLinePaths = layout.series.map(series => `
			<path
				d="${series.pathData}"
				stroke="${series.strokeColor}"
				class="line-path"
			/>
		`).join('');

		const pointCircles = layout.series.map(series => series.points.map(point => `
			<circle
				cx="${point.x}"
				cy="${point.y}"
				r="3.5"
				fill="white"
				stroke="${series.strokeColor}"
				stroke-width="1.5"
				class="data-point"
				data-series="${escapeHtml(point.seriesName)}"
				data-x="${escapeHtml(point.xLabel)}"
				data-y="${escapeHtml(point.value)}"
				data-stacked-y="${escapeHtml(point.stackedY)}"
				data-percent="${point.isPercentage ? 'true' : 'false'}"
			/>
		`).join('')).join('');

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
					color:${layout.theme.text};
				}
				.area-chart-container {
					width:${layout.chartWidth}px;
					height:${layout.chartHeight}px;
					position:relative;
					margin:20px auto;
					overflow:visible;
				}
				.axis-label {
					font-size:11px;
					fill:${layout.theme.axis};
				}
				.legend-container {
					display:flex;
					flex-direction:row;
					flex-wrap:wrap;
					justify-content:center;
					margin-top:10px;
					width:100%;
					padding:8px;
					background:${layout.theme.legendBackground};
					border-radius:4px;
				}
				.legend-item {
					display:flex;
					align-items:center;
					margin:5px 10px;
					font-size:13px;
					color:${layout.theme.text};
				}
				.color-box {
					width:15px;
					height:15px;
					margin-right:8px;
					border-radius:2px;
					border:1px solid rgba(0,0,0,0.2);
				}
				.chart-title {
					text-align:center;
					margin-bottom:15px;
					font-size:18px;
					font-weight:bold;
					color:${layout.theme.title};
				}
				.area-path {
					stroke:none;
				}
				.line-path {
					fill:none;
					stroke-width:2;
					stroke-linecap:round;
					stroke-linejoin:round;
				}
				.data-point {
					cursor:pointer;
					transition:r 0.2s ease;
				}
				.data-point:hover {
					r:5;
				}
				.tooltip {
					position:absolute;
					background:${layout.theme.tooltipBackground};
					color:${layout.theme.tooltipText};
					padding:5px 10px;
					border-radius:3px;
					font-size:12px;
					pointer-events:none;
					z-index:10;
					display:none;
				}
				.y-axis-title {
					position:absolute;
					left:-60px;
					top:${layout.topPadding + layout.plotHeight / 2}px;
					transform:translateY(-50%) rotate(-90deg);
					font-size:12px;
					color:${layout.theme.axis};
				}
				.x-axis-title {
					position:absolute;
					bottom:0;
					left:${layout.yAxisWidth + layout.plotWidth / 2}px;
					transform:translateX(-60%);
					font-size:12px;
					color:${layout.theme.axis};
				}
				.chart-type-indicator {
					position:absolute;
					top:5px;
					right:10px;
					font-size:11px;
					color:${layout.theme.axis};
					background:rgba(255,255,255,0.7);
					padding:2px 6px;
					border-radius:3px;
				}
			</style>
			<div class="chart-container">
				<div class="chart-title">${escapeHtml(layout.title)}</div>
				<div class="area-chart-container">
					<div class="y-axis-title">${escapeHtml(layout.yAxisLabel)}</div>
					<svg width="${layout.chartWidth}" height="${layout.chartHeight}" viewBox="0 0 ${layout.chartWidth} ${layout.chartHeight}">
						${backgroundRect}
						${yAxisTicksHtml}
						<line x1="${layout.yAxisWidth}" y1="${layout.topPadding}" x2="${layout.yAxisWidth}" y2="${layout.topPadding + layout.plotHeight}" stroke="${layout.theme.axisLine}" stroke-width="1" />
						<line x1="${layout.yAxisWidth}" y1="${layout.topPadding + layout.plotHeight}" x2="${layout.yAxisWidth + layout.plotWidth}" y2="${layout.topPadding + layout.plotHeight}" stroke="${layout.theme.axisLine}" stroke-width="1" />
						${xAxisTicksHtml}
						${seriesAreaPaths}
						${seriesLinePaths}
						${pointCircles}
					</svg>
					<div class="x-axis-title">${escapeHtml(layout.xAxisLabel)}</div>
					<div class="tooltip"></div>
					${layout.chartTypeLabel ? `<div class="chart-type-indicator">${escapeHtml(layout.chartTypeLabel)}</div>` : ''}
				</div>
				<div class="legend-container">${legendHtml}</div>
			</div>
			`
		};
	}

	function attachTooltipBehavior() {
		const container = document.querySelector('.dataviz-floating-window .area-chart-container');
		if (!container) {
			return;
		}

		const tooltip = container.querySelector('.tooltip');
		if (!tooltip) {
			return;
		}

		container.querySelectorAll('.data-point').forEach(point => {
			point.addEventListener('mouseover', event => {
				const series = point.getAttribute('data-series');
				const x = point.getAttribute('data-x');
				const y = point.getAttribute('data-y');
				const stackedY = point.getAttribute('data-stacked-y');
				const isPercent = point.getAttribute('data-percent') === 'true';

				const yValue = isPercent
					? `${y} (${parseFloat(stackedY).toFixed(1)}%)`
					: `${y}${stackedY !== y ? ` (Total: ${stackedY})` : ''}`;

				tooltip.innerHTML = `<strong>${series}</strong><br>${x}: ${yValue}`;
				tooltip.style.left = `${event.pageX + 10}px`;
				tooltip.style.top = `${event.pageY - 30}px`;
				tooltip.style.display = 'block';
			});

			point.addEventListener('mouseout', () => {
				tooltip.style.display = 'none';
			});
		});
	}

	function renderToCanvas(layout, scale) {
		const exportScale = scale || 2;
		const padding = 20;
		const chartTop = 30;
		const legendGap = 14;
		const yAxisTitleSpace = 70;
		const rightSpace = 20;
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

		const totalWidth = padding * 2 + yAxisTitleSpace + layout.chartWidth + rightSpace;
		const totalHeight = padding * 2 + chartTop + layout.chartHeight + legendGap + legendLayout.height;
		const canvas = document.createElement('canvas');
		canvas.width = Math.ceil(totalWidth * exportScale);
		canvas.height = Math.ceil(totalHeight * exportScale);
		const ctx = canvas.getContext('2d');
		ctx.scale(exportScale, exportScale);

		ctx.fillStyle = layout.theme.background;
		ctx.fillRect(0, 0, totalWidth, totalHeight);

		const originX = padding + yAxisTitleSpace;
		const originY = padding + chartTop;

		ctx.fillStyle = layout.theme.title;
		ctx.font = `bold 18px ${layout.theme.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(layout.title, originX + layout.chartWidth / 2, padding);

		ctx.fillStyle = layout.theme.plotBackground || '#f8f9fa';
		ctx.fillRect(originX + layout.yAxisWidth, originY + layout.topPadding, layout.plotWidth, layout.plotHeight);
		ctx.strokeStyle = layout.theme.plotBorder || '#e9ecef';
		ctx.lineWidth = 1;
		ctx.strokeRect(originX + layout.yAxisWidth, originY + layout.topPadding, layout.plotWidth, layout.plotHeight);

		ctx.font = `11px ${layout.theme.fontFamily}`;
		layout.yAxisTicks.forEach(tick => {
			ctx.beginPath();
			ctx.moveTo(originX + layout.yAxisWidth - 5, originY + tick.y);
			ctx.lineTo(originX + layout.yAxisWidth + layout.plotWidth, originY + tick.y);
			ctx.strokeStyle = tick.isBaseline ? layout.theme.axisLine : layout.theme.grid;
			ctx.lineWidth = tick.isBaseline ? 1 : 0.5;
			if (!tick.isBaseline) {
				ctx.setLineDash([3, 3]);
			}
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = layout.theme.axis;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(tick.label, originX + layout.yAxisWidth - 10, originY + tick.y);
		});

		ctx.beginPath();
		ctx.moveTo(originX + layout.yAxisWidth, originY + layout.topPadding);
		ctx.lineTo(originX + layout.yAxisWidth, originY + layout.topPadding + layout.plotHeight);
		ctx.lineTo(originX + layout.yAxisWidth + layout.plotWidth, originY + layout.topPadding + layout.plotHeight);
		ctx.strokeStyle = layout.theme.axisLine;
		ctx.lineWidth = 1;
		ctx.stroke();

		layout.xAxisTicks.forEach(tick => {
			ctx.beginPath();
			ctx.moveTo(originX + tick.x, originY + layout.topPadding + layout.plotHeight);
			ctx.lineTo(originX + tick.x, originY + layout.topPadding + layout.plotHeight + 5);
			ctx.strokeStyle = layout.theme.axisLine;
			ctx.lineWidth = 1;
			ctx.stroke();

			ctx.save();
			ctx.translate(originX + tick.x, originY + layout.topPadding + layout.plotHeight + tick.yOffset);
			ctx.rotate((tick.rotation * Math.PI) / 180);
			ctx.fillStyle = layout.theme.axis;
			ctx.textAlign = tick.textAnchor;
			ctx.textBaseline = 'middle';
			ctx.fillText(String(tick.value), 0, 0);
			ctx.restore();
		});

		layout.series.forEach(series => {
			if (!series.topPoints.length) {
				return;
			}

			const polygonPoints = series.topPoints.concat([...series.basePoints].reverse());
			ctx.beginPath();
			ctx.moveTo(originX + polygonPoints[0].x, originY + polygonPoints[0].y);
			polygonPoints.slice(1).forEach(point => {
				ctx.lineTo(originX + point.x, originY + point.y);
			});
			ctx.closePath();
			ctx.fillStyle = series.color;
			ctx.fill();

			ctx.beginPath();
			series.topPoints.forEach((point, index) => {
				if (index === 0) {
					ctx.moveTo(originX + point.x, originY + point.y);
				} else {
					ctx.lineTo(originX + point.x, originY + point.y);
				}
			});
			ctx.strokeStyle = series.strokeColor;
			ctx.lineWidth = 2;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.stroke();

			series.points.forEach(point => {
				ctx.beginPath();
				ctx.arc(originX + point.x, originY + point.y, 3.5, 0, Math.PI * 2);
				ctx.fillStyle = '#ffffff';
				ctx.fill();
				ctx.strokeStyle = series.strokeColor;
				ctx.lineWidth = 1.5;
				ctx.stroke();
			});
		});

		ctx.save();
		ctx.translate(originX - 42, originY + layout.topPadding + layout.plotHeight / 2);
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
		ctx.fillText(layout.xAxisLabel, originX + layout.yAxisWidth + layout.plotWidth / 2, originY + layout.chartHeight - 12);

		if (layout.chartTypeLabel) {
			ctx.fillStyle = layout.theme.axis;
			ctx.font = `11px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'top';
			ctx.fillText(layout.chartTypeLabel, originX + layout.chartWidth - 10, originY + 5);
		}

		const legendY = originY + layout.chartHeight + legendGap;
		chartRenderer.drawRoundedRect(ctx, originX, legendY, layout.chartWidth, legendLayout.height, 4);
		ctx.fillStyle = layout.theme.legendBackground;
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendY, layout.theme);

		return canvas;
	}

	function renderAreaChart(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorAreaChart')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
			`);
		}

		const layout = buildAreaChartLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid area chart data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorAreaChart')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorEmptyData') })}</p>
			</div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'area',
			layout,
			renderMarkup,
			attachBehavior: attachTooltipBehavior
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'area', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'area', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizAreaChart = {
		buildLayout: buildAreaChartLayout,
		render: renderAreaChart,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
