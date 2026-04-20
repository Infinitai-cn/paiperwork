(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function normalizePieChartData(chartData) {
		if (!chartData || !Array.isArray(chartData.data)) {
			return null;
		}

		const slices = chartData.data
			.map(item => ({
				label: String(item && item.label !== undefined ? item.label : ''),
				value: Number(item && item.value)
			}))
			.filter(item => item.label && Number.isFinite(item.value) && item.value >= 0);

		if (!slices.length) {
			return null;
		}

		return {
			title: chartData.title || Lang.get('datavizPieChart'),
			data: slices
		};
	}

	function buildPieChartLayout(dataViz, chartData) {
		if (!chartRenderer) {
			return null;
		}

		const normalizedChartData = normalizePieChartData(chartData);
		if (!normalizedChartData) {
			return null;
		}

		const total = normalizedChartData.data.reduce((sum, item) => sum + item.value, 0);
		if (!total) {
			return null;
		}

		const theme = chartRenderer.getTheme();
		const chartSize = 250;
		const chartRadius = 110;
		const center = chartSize / 2;
		let currentAngle = -Math.PI / 2;

		const slices = normalizedChartData.data.map((item, index) => {
			const percentage = item.value / total;
			const sweepAngle = percentage * Math.PI * 2;
			const startAngle = currentAngle;
			const endAngle = currentAngle + sweepAngle;
			const color = dataViz.colors[index % dataViz.colors.length];
			currentAngle = endAngle;

			return {
				label: item.label,
				value: item.value,
				percentage,
				percentageLabel: `${chartRenderer.roundValue(percentage * 100, 1).toFixed(1)}%`,
				startAngle,
				endAngle,
				color
			};
		});

		return {
			title: normalizedChartData.title,
			theme,
			total,
			slices,
			chartSize,
			chartRadius,
			center,
			legendWidth: 470,
			modalWidth: 550
		};
	}

	function describeSlicePath(layout, slice) {
		const startX = layout.center + layout.chartRadius * Math.cos(slice.startAngle);
		const startY = layout.center + layout.chartRadius * Math.sin(slice.startAngle);
		const endX = layout.center + layout.chartRadius * Math.cos(slice.endAngle);
		const endY = layout.center + layout.chartRadius * Math.sin(slice.endAngle);
		const largeArcFlag = slice.endAngle - slice.startAngle > Math.PI ? 1 : 0;

		return [
			`M ${layout.center} ${layout.center}`,
			`L ${startX} ${startY}`,
			`A ${layout.chartRadius} ${layout.chartRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
			'Z'
		].join(' ');
	}

	function renderSvg(layout, dataViz) {
		const chartId = `pie-chart-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const sliceMarkup = layout.slices.map(slice => `
			<path d="${describeSlicePath(layout, slice)}" fill="${slice.color}" class="pie-slice" />
		`).join('');

		const legendMarkup = layout.slices.map(slice => `
			<div class="legend-item" style="display:flex; align-items:center; margin:5px 10px; font-size:13px; color:${layout.theme.text};">
				<span class="color-box" style="display:inline-block; width:15px; height:15px; margin-right:8px; border-radius:2px; border:1px solid rgba(0,0,0,0.2); background:${slice.color}; flex-shrink:0;"></span>
				<span class="legend-label">${escapeHtml(slice.label)}: ${escapeHtml(slice.value)} (${escapeHtml(slice.percentageLabel)})</span>
			</div>
		`).join('');

		return {
			chartId,
			html: `
			<div class="chart-container dataviz-piechart-root" data-chart-id="${chartId}" style="display:flex; flex-direction:column; align-items:center; margin:0 auto; max-width:100%; font-family:${layout.theme.fontFamily}; color:${layout.theme.text}; background:${layout.theme.background};">
				<div class="chart-title" style="text-align:center; margin-bottom:5px; font-size:18px; font-weight:bold; color:${layout.theme.title};">${escapeHtml(layout.title)}</div>
				<div class="pie-container" style="width:${layout.chartSize}px; height:${layout.chartSize}px; position:relative; margin:0 auto;">
					<svg class="pie-chart" width="${layout.chartSize}" height="${layout.chartSize}" viewBox="0 0 ${layout.chartSize} ${layout.chartSize}" style="filter:drop-shadow(0 0 10px rgba(0, 0, 0, 0.1)); border-radius:50%;">
						${sliceMarkup}
					</svg>
				</div>
				<div class="legend-container" style="display:flex; flex-direction:row; flex-wrap:wrap; justify-content:center; margin-top:20px; width:${layout.legendWidth}px; max-width:100%; padding:10px; background:${layout.theme.legendBackground}; border-radius:4px;">
					${legendMarkup}
				</div>
			</div>
			`
		};
	}

	function renderToCanvas(layout, scale) {
		const exportScale = scale || 2;
		const padding = 20;
		const legendItems = layout.slices.map(slice => ({
			color: slice.color,
			label: `${slice.label}: ${slice.value} (${slice.percentageLabel})`
		}));
		const canvas = document.createElement('canvas');
		const probeContext = canvas.getContext('2d');
		const legendLayout = chartRenderer.layoutLegendItems(probeContext, legendItems, {
			font: `13px ${layout.theme.fontFamily}`,
			containerWidth: layout.legendWidth,
			markerSize: 15,
			markerGap: 8,
			itemGap: 20,
			rowGap: 10,
			paddingX: 10,
			paddingY: 10,
			lineHeight: 15
		});
		canvas.width = Math.ceil((layout.legendWidth + padding * 2) * exportScale);
		canvas.height = Math.ceil((layout.chartSize + padding * 2 + 30 + 20 + legendLayout.height) * exportScale);
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
		ctx.fillText(layout.title, originX + layout.legendWidth / 2, originY);

		const pieOriginY = originY + 30;
		const pieOriginX = originX + (layout.legendWidth - layout.chartSize) / 2;
		layout.slices.forEach(slice => {
			ctx.beginPath();
			ctx.moveTo(pieOriginX + layout.center, pieOriginY + layout.center);
			ctx.arc(
				pieOriginX + layout.center,
				pieOriginY + layout.center,
				layout.chartRadius,
				slice.startAngle,
				slice.endAngle
			);
			ctx.closePath();
			ctx.fillStyle = slice.color;
			ctx.fill();
			ctx.strokeStyle = layout.theme.background;
			ctx.lineWidth = 1;
			ctx.stroke();
		});

		const legendTop = pieOriginY + layout.chartSize + 20;
		chartRenderer.drawRoundedRect(ctx, originX, legendTop, layout.legendWidth, legendLayout.height, 4);
		ctx.fillStyle = layout.theme.legendBackground;
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendTop, layout.theme);

		return canvas;
	}

	function renderPieChart(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			 <div class="dataviz-error">
				 <h3>${Lang.get('datavizErrorPieChart')}</h3>
				 <p>${Lang.get('datavizErrorMessage')}</p>
			 </div>
			`);
		}

		const layout = buildPieChartLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid pie chart data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			 <div class="dataviz-error">
				 <h3>${Lang.get('datavizErrorPieChart')}</h3>
				 <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorMissingData') })}</p>
			 </div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'pie',
			layout,
			renderMarkup: renderSvg
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'pie', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'pie', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizPieChart = {
		buildLayout: buildPieChartLayout,
		render: renderPieChart,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
