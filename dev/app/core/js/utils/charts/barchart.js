(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function normalizeBarChartData(chartData) {
		const hasSimpleFormat = chartData && chartData.data && Array.isArray(chartData.data) && !chartData.series;
		if (hasSimpleFormat) {
			return {
				title: chartData.title || Lang.get('datavizBarChart'),
				mode: 'single',
				categories: chartData.data
					.map(item => ({
						label: String(item && item.label !== undefined ? item.label : ''),
						value: Number(item && item.value),
						color: item && typeof item.color === 'string' ? item.color : null
					}))
					.filter(item => item.label && Number.isFinite(item.value))
			};
		}

		if (chartData && Array.isArray(chartData.series)) {
			return {
				title: chartData.title || Lang.get('datavizBarChart'),
				mode: 'multi',
				series: chartData.series
					.map(series => ({
						name: String(series && series.name !== undefined ? series.name : ''),
						color: series && typeof series.color === 'string' ? series.color : null,
						data: Array.isArray(series && series.data)
							? series.data
								.map(item => ({
									label: String(item && item.label !== undefined ? item.label : ''),
									value: Number(item && item.value),
									color: item && typeof item.color === 'string' ? item.color : null
								}))
								.filter(item => item.label && Number.isFinite(item.value))
							: []
					}))
					.filter(series => series.data.length)
			};
		}

		return null;
	}

	function buildSeriesColors(dataViz, normalizedChartData) {
		if (normalizedChartData.mode === 'single') {
			return normalizedChartData.categories.map((item, index) => item.color || dataViz.colors[index % dataViz.colors.length]);
		}

		if (
			normalizedChartData.series.length > 1 &&
			normalizedChartData.series[0].name === 'Browser Market Share' &&
			normalizedChartData.series[1].name === 'Phone Use' &&
			!normalizedChartData.series[0].color &&
			!normalizedChartData.series[1].color
		) {
			return normalizedChartData.series.map((_, index) => (index === 0 ? '#ef4444' : '#047857'));
		}

		return normalizedChartData.series.map((series, index) => series.color || dataViz.colors[index % dataViz.colors.length]);
	}

	function buildBarChartLayout(dataViz, chartData) {
		if (!chartRenderer) {
			return null;
		}

		const normalizedChartData = normalizeBarChartData(chartData);
		if (!normalizedChartData) {
			return null;
		}

		const theme = chartRenderer.getTheme();
		const title = normalizedChartData.title || Lang.get('datavizBarChart');

		if (normalizedChartData.mode === 'single' || (normalizedChartData.mode === 'multi' && normalizedChartData.series.length === 1)) {
			const categories = normalizedChartData.mode === 'single'
				? normalizedChartData.categories
				: normalizedChartData.series[0].data;
			if (!categories.length) {
				return null;
			}

			const colors = buildSeriesColors(dataViz, normalizedChartData);
			const maxValue = Math.max(...categories.map(item => item.value), 0) || 1;
			const chartWidth = Math.max(640, categories.length * 86 + 80);
			const chartHeight = 350;
			const plotHeight = 240;
			const barWidth = 50;
			const gap = Math.max(22, Math.floor((chartWidth - categories.length * barWidth) / (categories.length + 1)));
			const bars = categories.map((item, index) => {
				const height = Math.max(4, (item.value / maxValue) * 156);
				return {
					label: item.label,
					value: item.value,
					color: item.color || colors[index % colors.length],
					x: gap + index * (barWidth + gap),
					width: barWidth,
					height
				};
			});

			return {
				type: 'bar',
				variant: 'single',
				title,
				theme,
				chartWidth,
				chartHeight,
				plotHeight,
				modalWidth: Math.min(Math.max(chartWidth + 80, 700), window.innerWidth ? Math.max(window.innerWidth - 32, 700) : 1100),
				bars,
				legendItems: bars.map(bar => ({ name: bar.label, color: bar.color }))
			};
		}

		const seriesColors = buildSeriesColors(dataViz, normalizedChartData);
		const labels = [];
		const seenLabels = new Set();
		normalizedChartData.series.forEach(series => {
			series.data.forEach(item => {
				if (!seenLabels.has(item.label)) {
					seenLabels.add(item.label);
					labels.push(item.label);
				}
			});
		});
		if (!labels.length) {
			return null;
		}

		let maxValue = 0;
		normalizedChartData.series.forEach(series => {
			series.data.forEach(item => {
				maxValue = Math.max(maxValue, item.value);
			});
		});
		maxValue = maxValue || 1;

		const totalSeries = normalizedChartData.series.length;
		const barWidth = Math.max(60, Math.min(80, 150 / (labels.length * totalSeries || 1)));
		const groupWidth = (barWidth * totalSeries) + 60;
		const chartWidth = Math.max(760, labels.length * (groupWidth + 30) + 100);
		const chartHeight = 350;
		const plotHeight = 240;
		const groups = labels.map((label, labelIndex) => {
			const groupX = 40 + labelIndex * (groupWidth + 30);
			const bars = normalizedChartData.series.map((series, seriesIndex) => {
				const item = series.data.find(entry => entry.label === label);
				const value = item ? item.value : 0;
				const height = item ? Math.min(156, Math.max(4, (value / maxValue) * 156)) : 0;
				return {
					seriesName: series.name || `Series ${seriesIndex + 1}`,
					value,
					color: item && item.color ? item.color : seriesColors[seriesIndex],
					x: groupX + seriesIndex * (barWidth + 6),
					width: barWidth,
					height,
					isEmpty: !item
				};
			});

			return {
				label,
				x: groupX,
				width: groupWidth,
				bars
			};
		});

		return {
			type: 'bar',
			variant: 'multi',
			title,
			theme,
			chartWidth,
			chartHeight,
			plotHeight,
			modalWidth: Math.min(Math.max(chartWidth + 80, 780), window.innerWidth ? Math.max(window.innerWidth - 32, 780) : 1200),
			groups,
			legendItems: normalizedChartData.series.map((series, index) => ({
				name: series.name || `Series ${index + 1}`,
				color: seriesColors[index]
			}))
		};
	}

	function renderSingleMarkup(layout, dataViz) {
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const baselineBottom = 28;
		const barsMarkup = layout.bars.map(bar => `
			<div class="bar" style="height:${bar.height}px; background-color:${bar.color}; width:${bar.width}px; min-height:4px; position:absolute; left:${bar.x}px; bottom:${baselineBottom + 7}px; border-radius:4px 4px 0 0; border:1px solid rgba(0,0,0,0.2); border-bottom:2px solid rgba(0,0,0,0.3); box-shadow:0 2px 4px rgba(0,0,0,0.15); background-clip:padding-box; box-sizing:border-box;">
				<div class="bar-value" style="position:absolute; top:-30px; width:100%; text-align:center; font-size:12px; font-weight:bold; color:${layout.theme.text}; background:${layout.theme.background}; padding:3px 0; border-radius:3px; box-shadow:0 0 3px rgba(0,0,0,0.1);">${escapeHtml(bar.value)}</div>
				<div class="bar-label" style="position:absolute; bottom:-30px; width:100%; text-align:center; font-size:11px; white-space:nowrap; color:${layout.theme.text};">${escapeHtml(bar.label)}</div>
			</div>
		`).join('');
		const legendMarkup = layout.legendItems.map(item => `
			<div class="legend-item" style="display:flex; align-items:center; margin:6px 12px; font-size:13px; min-width:120px; color:${layout.theme.text};">
				<span class="color-box" style="width:16px; height:16px; min-width:16px; margin-right:8px; border-radius:3px; border:1px solid rgba(0,0,0,0.2); background:${item.color};"></span>
				<span class="legend-label" style="font-size:13px; color:${layout.theme.text}; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.name)}</span>
			</div>
		`).join('');

		return {
			html: `
			<div class="chart-container" style="display:flex; flex-direction:column; align-items:center; margin:0 auto; max-width:100%; font-family:${layout.theme.fontFamily}; position:relative; color:${layout.theme.text}; background:${layout.theme.background};">
				<div class="chart-title" style="text-align:center; margin-bottom:5px; font-size:18px; font-weight:bold; color:${layout.theme.title};">${escapeHtml(layout.title)}</div>
				<div class="bar-chart-container" style="width:100%; height:${layout.chartHeight}px; display:flex; align-items:flex-end; justify-content:center; margin:0 0 20px 0; position:relative; overflow-x:auto;">
					<div style="position:absolute; left:0; right:0; bottom:${baselineBottom}px; border-bottom:1px solid ${layout.theme.plotBorder};"></div>
					<div class="bar-groups-container" style="position:relative; height:100%; min-height:200px; width:${layout.chartWidth}px; min-width:${layout.chartWidth}px;">
						${barsMarkup}
					</div>
				</div>
				<div class="legend-container" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:center; margin-top:20px; width:100%; padding:12px 8px; background:${layout.theme.legendBackground}; border-radius:4px;">
					${legendMarkup}
				</div>
			</div>
			`
		};
	}

	function renderMultiMarkup(layout, dataViz) {
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const baselineBottom = 28;
		const groupsMarkup = layout.groups.map(group => `
			<div class="bar-group" style="width:${group.width}px; min-height:250px; margin:0 15px; display:flex; align-items:flex-end; justify-content:center; position:relative; height:100%; padding-bottom:25px; outline:1px dashed rgba(0,0,0,0.05);">
				${group.bars.map(bar => bar.isEmpty
					? `<div class="bar empty-bar" style="width:${bar.width}px; height:0 !important; border:none !important; min-height:0 !important; box-shadow:none !important;"></div>`
					: `
						<div class="bar" style="height:${bar.height}px !important; background-color:${bar.color}; width:${bar.width}px; min-height:4px; margin:0 3px !important; position:relative; border-radius:4px 4px 0 0; border:1px solid rgba(0,0,0,0.2); border-bottom:2px solid rgba(0,0,0,0.3); box-shadow:0 2px 4px rgba(0,0,0,0.15); background-clip:padding-box; align-self:flex-end;">
							<div class="bar-value" style="position:absolute; top:-30px; width:100%; text-align:center; font-size:12px; font-weight:bold; color:${layout.theme.text}; background:${layout.theme.background}; padding:3px 0; border-radius:3px; box-shadow:0 0 3px rgba(0,0,0,0.1);">${escapeHtml(bar.value)}</div>
						</div>`).join('')}
				<div class="bar-group-label" style="position:absolute; bottom:-20px; left:50%; transform:translateX(-50%); text-align:center; font-size:11px; white-space:nowrap; max-width:100%; color:${layout.theme.text}; font-weight:bold;">${escapeHtml(group.label)}</div>
			</div>
		`).join('');

		const legendMarkup = layout.legendItems.map(item => `
			<div class="legend-item" style="display:flex; align-items:center; margin:6px 12px; font-size:13px; min-width:120px; color:${layout.theme.text};">
				<span class="color-box" style="width:16px; height:16px; min-width:16px; margin-right:8px; border-radius:3px; border:1px solid rgba(0,0,0,0.2); background:${item.color};"></span>
				<span class="legend-label" style="font-size:13px; color:${layout.theme.text}; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.name)}</span>
			</div>
		`).join('');

		return {
			html: `
			<div class="chart-container" style="display:flex; flex-direction:column; align-items:center; margin:0 auto; max-width:100%; font-family:${layout.theme.fontFamily}; position:relative; color:${layout.theme.text}; background:${layout.theme.background};">
				<div class="chart-title" style="text-align:center; margin-bottom:5px; font-size:18px; font-weight:bold; color:${layout.theme.title};">${escapeHtml(layout.title)}</div>
				<div class="bar-chart-container" style="width:100%; height:${layout.chartHeight}px; display:flex; align-items:flex-end; justify-content:center; margin:0 0 20px 0; position:relative; padding-bottom:35px; overflow-x:auto;">
					<div style="position:absolute; left:0; right:0; bottom:${baselineBottom}px; border-bottom:1px solid ${layout.theme.plotBorder};"></div>
					<div class="bar-groups-container" style="display:flex; align-items:flex-end; justify-content:center; height:100%; min-height:200px; padding:0 10px; width:100%;">
						${groupsMarkup}
					</div>
				</div>
				<div class="legend-container" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:center; margin-top:20px; width:100%; padding:12px 8px; background:${layout.theme.legendBackground}; border-radius:4px;">
					${legendMarkup}
				</div>
			</div>
			`
		};
	}

	function renderMarkup(layout, dataViz) {
		return layout.variant === 'multi'
			? renderMultiMarkup(layout, dataViz)
			: renderSingleMarkup(layout, dataViz);
	}

	function renderSingleToCanvas(ctx, layout, originX, originY) {
		const barBottom = originY + layout.plotHeight + 45;
		const baselineY = barBottom + 7;

		layout.bars.forEach(bar => {
			const x = originX + bar.x;
			const y = barBottom - bar.height;
			ctx.fillStyle = bar.color;
			ctx.fillRect(x, y, bar.width, bar.height);
			ctx.strokeStyle = 'rgba(0,0,0,0.2)';
			ctx.lineWidth = 1;
			ctx.strokeRect(x, y, bar.width, bar.height);

			ctx.fillStyle = layout.theme.text;
			ctx.font = `bold 12px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(bar.value), x + bar.width / 2, y - 12);

			ctx.font = `11px ${layout.theme.fontFamily}`;
			ctx.fillText(bar.label, x + bar.width / 2, baselineY + 11);
		});

		return baselineY;
	}

	function renderMultiToCanvas(ctx, layout, originX, originY) {
		const barBottom = originY + layout.plotHeight + 45;
		const baselineY = barBottom + 7;

		layout.groups.forEach(group => {
			group.bars.forEach(bar => {
				if (bar.isEmpty) {
					return;
				}

				const x = originX + bar.x;
				const y = barBottom - bar.height;
				ctx.fillStyle = bar.color;
				ctx.fillRect(x, y, bar.width, bar.height);
				ctx.strokeStyle = 'rgba(0,0,0,0.2)';
				ctx.lineWidth = 1;
				ctx.strokeRect(x, y, bar.width, bar.height);

				ctx.fillStyle = layout.theme.text;
				ctx.font = `bold 12px ${layout.theme.fontFamily}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(String(bar.value), x + bar.width / 2, y - 12);
			});

			ctx.fillStyle = layout.theme.text;
			ctx.font = `bold 11px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(group.label, originX + group.x + group.width / 2, baselineY + 11);
		});

		return baselineY;
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
			paddingY: 12,
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

		let baselineY;
		if (layout.variant === 'multi') {
			baselineY = renderMultiToCanvas(ctx, layout, originX, originY + 30);
		} else {
			baselineY = renderSingleToCanvas(ctx, layout, originX, originY + 30);
		}

		ctx.strokeStyle = layout.theme.plotBorder;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(originX, baselineY);
		ctx.lineTo(originX + layout.chartWidth, baselineY);
		ctx.stroke();

		const legendY = originY + layout.chartHeight + legendTop;
		chartRenderer.drawRoundedRect(ctx, originX, legendY, layout.chartWidth, legendLayout.height, 4);
		ctx.fillStyle = layout.theme.legendBackground;
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendY, layout.theme);

		return canvas;
	}

	function renderBarChart(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			 <div class="dataviz-error">
				 <h3>${Lang.get('datavizErrorBarChart')}</h3>
				 <p>${Lang.get('datavizErrorMessage')}</p>
			 </div>
			`);
		}

		const layout = buildBarChartLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid chart data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorBarChart')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorMissingData') })}</p>
			</div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'bar',
			layout,
			renderMarkup
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'bar', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'bar', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizBarChart = {
		buildLayout: buildBarChartLayout,
		render: renderBarChart,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
