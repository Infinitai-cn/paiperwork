(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function normalizeScatterPlotData(chartData) {
		const hasSimpleFormat = chartData && chartData.data && Array.isArray(chartData.data) && !chartData.series;

		if (!hasSimpleFormat) {
			return chartData;
		}

		return {
			title: chartData.title || Lang.get('datavizScatterPlot'),
			xAxisLabel: chartData.xAxisLabel || Lang.get('datavizXValues'),
			yAxisLabel: chartData.yAxisLabel || Lang.get('datavizYValues'),
			series: [
				{
					name: chartData.title || Lang.get('datavizDataPoints'),
					data: chartData.data.map(item => ({
						x: item && item.x !== undefined ? item.x : 0,
						y: item && item.y !== undefined ? item.y : 0,
						label: item && item.label ? item.label : ''
					}))
				}
			]
		};
	}

	function transformCategoricalScatterData(chartData) {
		const hasTwoCategoricalDatasets = chartData.series.length === 2
			&& chartData.series[0].data?.some(point => point.y === 0)
			&& chartData.series[1].data?.some(point => point.x === 0);

		if (!hasTwoCategoricalDatasets) {
			return {
				chartData,
				hasTwoCategoricalDatasets: false
			};
		}

		const xSeriesName = chartData.series[0].name || 'Series 1';
		const ySeriesName = chartData.series[1].name || 'Series 2';
		const combinedData = [];
		const xLabels = chartData.series[0].data
			.filter(point => point && point.label)
			.map(point => point.label);
		const yLabels = chartData.series[1].data
			.filter(point => point && point.label)
			.map(point => point.label);

		xLabels.forEach(xLabel => {
			const xPoint = chartData.series[0].data.find(point => point.label === xLabel);
			const xValue = xPoint ? Number(xPoint.x) : 0;

			if (xValue > 0) {
				yLabels.forEach(yLabel => {
					const yPoint = chartData.series[1].data.find(point => point.label === yLabel);
					const yValue = yPoint ? Number(yPoint.y) : 0;

					if (yValue > 0) {
						combinedData.push({
							x: xValue,
							y: yValue,
							label: `${xLabel} / ${yLabel}`,
							xLabel,
							yLabel
						});
					}
				});
			}
		});

		return {
			chartData: {
				title: `${xSeriesName} vs ${ySeriesName}`,
				xAxisLabel: xSeriesName,
				yAxisLabel: ySeriesName,
				series: [
					{
						name: Lang.get('datavizCombinedData'),
						data: combinedData
					}
				]
			},
			hasTwoCategoricalDatasets: true
		};
	}

	function buildScatterPlotLayout(dataViz, rawChartData) {
		if (!chartRenderer) {
			return null;
		}

		let chartData = normalizeScatterPlotData(rawChartData);
		if (!chartData || !Array.isArray(chartData.series) || chartData.series.length === 0) {
			return null;
		}

		const transformed = transformCategoricalScatterData(chartData);
		chartData = transformed.chartData;
		const theme = chartRenderer.getTheme();
		let hasLabels = false;
		const allXValues = [];
		const allYValues = [];

		chartData.series.forEach(series => {
			if (!Array.isArray(series.data)) {
				return;
			}

			series.data.forEach(point => {
				if (!point) {
					return;
				}

				const x = Number(point.x) || 0;
				const y = Number(point.y) || 0;
				allXValues.push(x);
				allYValues.push(y);
				if (point.label) {
					hasLabels = true;
				}
			});
		});

		if (!allXValues.length || !allYValues.length) {
			return null;
		}

		const uniqueOrderedXValues = [];
		const uniqueOrderedYValues = [];
		const seenXValues = new Set();
		const seenYValues = new Set();

		allXValues.forEach(value => {
			if (!seenXValues.has(value)) {
				seenXValues.add(value);
				uniqueOrderedXValues.push(value);
			}
		});

		allYValues.forEach(value => {
			if (!seenYValues.has(value)) {
				seenYValues.add(value);
				uniqueOrderedYValues.push(value);
			}
		});

		const minX = Math.min(...uniqueOrderedXValues);
		const maxX = Math.max(...uniqueOrderedXValues);
		const minY = Math.min(...uniqueOrderedYValues);
		const maxY = Math.max(...uniqueOrderedYValues);
		const xPadding = Math.max(0.1, (maxX - minX) * 0.1);
		const yPadding = Math.max(0.1, (maxY - minY) * 0.1);
		const adjustedMinX = Math.max(0, minX - xPadding);
		const adjustedMaxX = maxX + xPadding;
		const adjustedMinY = Math.max(0, minY - yPadding);
		const adjustedMaxY = maxY + yPadding;

		const chartWidth = 650;
		const chartHeight = 400;
		const yAxisWidth = 60;
		const xAxisHeight = 60;
		const plotWidth = chartWidth - yAxisWidth - 20;
		const plotHeight = chartHeight - xAxisHeight - 20;
		const topPadding = 20;
		const usePercentageSuffix = transformed.hasTwoCategoricalDatasets;
		const seriesColors = chartData.series.map((series, index) => series.color || dataViz.colors[index % dataViz.colors.length]);

		const legendItems = chartData.series.map((series, index) => ({
			name: series.name || `Series ${index + 1}`,
			color: seriesColors[index]
		}));

		const seriesLayouts = chartData.series.map((series, seriesIndex) => {
			const color = seriesColors[seriesIndex];
			const useVariablePointSizes = usePercentageSuffix || series.data.some(point => point && point.xLabel && point.yLabel);
			const minPointRadius = 4;
			const maxPointRadius = 12;
			const points = Array.isArray(series.data)
				? series.data.filter(Boolean).map((point, pointIndex) => {
					const x = Number(point.x) || 0;
					const y = Number(point.y) || 0;
					const xPos = yAxisWidth + ((x - adjustedMinX) / (adjustedMaxX - adjustedMinX)) * plotWidth;
					const yPos = topPadding + (1 - ((y - adjustedMinY) / (adjustedMaxY - adjustedMinY))) * plotHeight;
					let pointRadius = minPointRadius;

					if (useVariablePointSizes) {
						const scaleFactor = Math.min((x + y) / 100, 1);
						pointRadius = minPointRadius + (maxPointRadius - minPointRadius) * scaleFactor;
					}

					return {
						id: `scatter-${seriesIndex}-${pointIndex}`,
						x,
						y,
						xPos,
						yPos,
						label: point.label || '',
						xLabel: point.xLabel || '',
						yLabel: point.yLabel || '',
						radius: pointRadius,
						showTextLabel: useVariablePointSizes && (x > maxX * 0.7 || y > maxY * 0.7),
						textLabel: point.xLabel || point.yLabel || point.label || ''
					};
				})
				: [];

			return {
				name: series.name || `Series ${seriesIndex + 1}`,
				color,
				points
			};
		});

		const yAxisTicks = Array.from({ length: 6 }, (_, index) => {
			const value = adjustedMinY + (adjustedMaxY - adjustedMinY) * (index / 5);
			const yPos = topPadding + ((adjustedMaxY - value) / (adjustedMaxY - adjustedMinY)) * plotHeight;
			return {
				value,
				label: `${Number.isInteger(value) ? value : value.toFixed(1)}${usePercentageSuffix ? '%' : ''}`,
				y: yPos,
				isBaseline: index === 0
			};
		});

		const xAxisTicks = Array.from({ length: 6 }, (_, index) => {
			const value = adjustedMinX + (adjustedMaxX - adjustedMinX) * (index / 5);
			const xPos = yAxisWidth + (index / 5) * plotWidth;
			return {
				value,
				label: `${Number.isInteger(value) ? value : value.toFixed(1)}${usePercentageSuffix ? '%' : ''}`,
				x: xPos
			};
		});

		return {
			type: 'scatter',
			title: chartData.title || Lang.get('datavizScatterPlot'),
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
			yAxisLabel: chartData.yAxisLabel || Lang.get('datavizYValues'),
			legendItems,
			series: seriesLayouts,
			yAxisTicks,
			xAxisTicks,
			hasLabels
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
				stroke="#e9ecef"
				stroke-width="1"
			/>
		`;

		const yAxisTicksHtml = layout.yAxisTicks.map(tick => `
			<line
				x1="${layout.yAxisWidth - 5}"
				y1="${tick.y}"
				x2="${layout.yAxisWidth + layout.plotWidth}"
				y2="${tick.y}"
				stroke="${tick.isBaseline ? '#adb5bd' : '#dee2e6'}"
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
				stroke="#adb5bd"
				stroke-width="1"
			/>
			<text
				x="${tick.x}"
				y="${layout.topPadding + layout.plotHeight + 20}"
				text-anchor="middle"
				class="axis-label"
			>
				${escapeHtml(tick.label)}
			</text>
		`).join('');

		const pointsHtml = layout.series.map(series => {
			const circles = series.points.map(point => `
				<circle
					cx="${point.xPos}"
					cy="${point.yPos}"
					r="${point.radius}"
					fill="${series.color}"
					fill-opacity="0.7"
					stroke="${series.color}"
					stroke-width="1.5"
					class="data-point"
					data-series="${escapeHtml(series.name)}"
					data-x="${escapeHtml(point.x)}"
					data-y="${escapeHtml(point.y)}"
					data-label="${escapeHtml(point.label)}"
					data-x-label="${escapeHtml(point.xLabel)}"
					data-y-label="${escapeHtml(point.yLabel)}"
				/>
			`).join('');

			const labels = series.points.filter(point => point.showTextLabel && point.textLabel).map(point => `
				<text
					x="${point.xPos}"
					y="${point.yPos - point.radius - 5}"
					text-anchor="middle"
					class="point-label"
					font-size="11"
					fill="${layout.theme.text}"
				>
					${escapeHtml(point.textLabel)}
				</text>
			`).join('');

			return circles + labels;
		}).join('');

		const legendHtml = layout.legendItems.map(item => `
			<div class="legend-item">
				<span class="color-box" style="background-color:${item.color}"></span>
				<span class="legend-label">${escapeHtml(item.name)}</span>
			</div>
		`).join('');

		return {
			html: `
			<style>
				.chart-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin: 0 auto;
					max-width: 100%;
					font-family: ${layout.theme.fontFamily};
					color: ${layout.theme.text};
				}

				.scatter-plot-container {
					width: ${layout.chartWidth}px;
					height: ${layout.chartHeight}px;
					position: relative;
					margin: 20px auto;
					overflow: visible;
				}

				.axis-label {
					font-size: 11px;
					fill: ${layout.theme.mutedText || '#666'};
				}

				.legend-container {
					display: flex;
					flex-direction: row;
					flex-wrap: wrap;
					justify-content: center;
					margin-top: 10px;
					width: 100%;
					padding: 8px;
					background: ${layout.theme.legendBackground};
					border-radius: 4px;
				}

				.legend-item {
					display: flex;
					align-items: center;
					margin: 5px 10px;
					font-size: 13px;
					color: ${layout.theme.text};
				}

				.color-box {
					width: 15px;
					height: 15px;
					margin-right: 8px;
					border-radius: 2px;
					border: 1px solid rgba(0,0,0,0.2);
				}

				.chart-title {
					text-align: center;
					margin-bottom: 15px;
					font-size: 18px;
					font-weight: bold;
					color: ${layout.theme.title};
				}

				.data-point {
					cursor: pointer;
					transition: r 0.2s ease;
				}

				.data-point:hover {
					stroke-width: 2;
					fill-opacity: 0.9;
				}

				.tooltip {
					position: absolute;
					background: rgba(0,0,0,0.8);
					color: white;
					padding: 5px 10px;
					border-radius: 3px;
					font-size: 12px;
					pointer-events: none;
					z-index: 10;
					display: none;
				}

				.y-axis-title {
					position: absolute;
					left: -60px;
					top: ${layout.topPadding + layout.plotHeight / 2}px;
					transform: translateY(-50%) rotate(-90deg);
					font-size: 12px;
					color: ${layout.theme.mutedText || '#666'};
				}

				.x-axis-title {
					position: absolute;
					bottom: 5px;
					left: ${layout.yAxisWidth + layout.plotWidth / 2}px;
					transform: translateX(-50%);
					font-size: 12px;
					color: ${layout.theme.mutedText || '#666'};
				}

				.point-label {
					pointer-events: none;
					text-shadow: 0 0 2px white, 0 0 2px white, 0 0 2px white, 0 0 2px white;
				}
			</style>

			<div class="chart-container">
				<div class="chart-title">${escapeHtml(layout.title)}</div>
				<div class="scatter-plot-container">
					<div class="y-axis-title">${escapeHtml(layout.yAxisLabel)}</div>
					<svg width="${layout.chartWidth}" height="${layout.chartHeight}" viewBox="0 0 ${layout.chartWidth} ${layout.chartHeight}">
						${backgroundRect}
						${yAxisTicksHtml}
						<line x1="${layout.yAxisWidth}" y1="${layout.topPadding}" x2="${layout.yAxisWidth}" y2="${layout.topPadding + layout.plotHeight}" stroke="#adb5bd" stroke-width="1" />
						<line x1="${layout.yAxisWidth}" y1="${layout.topPadding + layout.plotHeight}" x2="${layout.yAxisWidth + layout.plotWidth}" y2="${layout.topPadding + layout.plotHeight}" stroke="#adb5bd" stroke-width="1" />
						${xAxisTicksHtml}
						${pointsHtml}
					</svg>
					<div class="x-axis-title">${escapeHtml(layout.xAxisLabel)}</div>
					<div class="tooltip"></div>
				</div>
				<div class="legend-container">
					${legendHtml}
				</div>
			</div>
			`
		};
	}

	function attachTooltipBehavior() {
		const container = document.querySelector('.dataviz-floating-window .scatter-plot-container');
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
				const label = point.getAttribute('data-label');
				const xLabel = point.getAttribute('data-x-label');
				const yLabel = point.getAttribute('data-y-label');

				let tooltipContent = `<strong>${series}</strong><br>`;
				if (xLabel && yLabel) {
					tooltipContent += `${xLabel}: ${x}%, ${yLabel}: ${y}%`;
				} else {
					tooltipContent += `X: ${x}, Y: ${y}`;
				}

				if (label && label !== xLabel && label !== yLabel) {
					tooltipContent += `<br>${label}`;
				}

				tooltip.innerHTML = tooltipContent;
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
		ctx.strokeStyle = '#e9ecef';
		ctx.lineWidth = 1;
		ctx.strokeRect(originX + layout.yAxisWidth, originY + layout.topPadding, layout.plotWidth, layout.plotHeight);

		ctx.font = `11px ${layout.theme.fontFamily}`;
		layout.yAxisTicks.forEach(tick => {
			ctx.beginPath();
			ctx.moveTo(originX + layout.yAxisWidth - 5, originY + tick.y);
			ctx.lineTo(originX + layout.yAxisWidth + layout.plotWidth, originY + tick.y);
			ctx.strokeStyle = tick.isBaseline ? '#adb5bd' : '#dee2e6';
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
		ctx.strokeStyle = '#adb5bd';
		ctx.lineWidth = 1;
		ctx.stroke();

		layout.xAxisTicks.forEach(tick => {
			ctx.beginPath();
			ctx.moveTo(originX + tick.x, originY + layout.topPadding + layout.plotHeight);
			ctx.lineTo(originX + tick.x, originY + layout.topPadding + layout.plotHeight + 5);
			ctx.strokeStyle = '#adb5bd';
			ctx.lineWidth = 1;
			ctx.stroke();

			ctx.fillStyle = layout.theme.axis;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(tick.label, originX + tick.x, originY + layout.topPadding + layout.plotHeight + 20);
		});

		layout.series.forEach(series => {
			series.points.forEach(point => {
				ctx.beginPath();
				ctx.arc(originX + point.xPos, originY + point.yPos, point.radius, 0, Math.PI * 2);
				ctx.globalAlpha = 0.7;
				ctx.fillStyle = series.color;
				ctx.fill();
				ctx.globalAlpha = 1;
				ctx.strokeStyle = series.color;
				ctx.lineWidth = 1.5;
				ctx.stroke();

				if (point.showTextLabel && point.textLabel) {
					ctx.fillStyle = layout.theme.text;
					ctx.font = `11px ${layout.theme.fontFamily}`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(point.textLabel, originX + point.xPos, originY + point.yPos - point.radius - 5);
				}
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
		ctx.fillText(layout.xAxisLabel, originX + layout.yAxisWidth + layout.plotWidth / 2, originY + layout.chartHeight - 10);

		const legendY = originY + layout.chartHeight + legendGap;
		chartRenderer.drawRoundedRect(ctx, originX, legendY, layout.chartWidth, legendLayout.height, 4);
		ctx.fillStyle = layout.theme.legendBackground;
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendY, layout.theme);

		return canvas;
	}

	function renderScatterPlot(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorScatterPlot')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
			`);
		}

		const layout = buildScatterPlotLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid scatter plot data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorScatterPlot')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorEmptyData') })}</p>
			</div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'scatter',
			layout,
			renderMarkup,
			attachBehavior: attachTooltipBehavior
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'scatter', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'scatter', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizScatterPlotChart = {
		buildLayout: buildScatterPlotLayout,
		render: renderScatterPlot,
		renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
