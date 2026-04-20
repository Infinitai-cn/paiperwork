(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function buildRadarChartLayout(dataViz, chartData) {
		if (!chartRenderer) {
			return null;
		}

		if (!chartData
			|| !Array.isArray(chartData.categories)
			|| chartData.categories.length < 3
			|| !Array.isArray(chartData.series)
			|| chartData.series.length === 0) {
			return null;
		}

		const theme = chartRenderer.getTheme();
		const size = 690;
		const centerX = size / 2;
		const centerY = size / 2;
		const radius = size * 0.35;
		const categoryCount = chartData.categories.length;
		const rings = 5;
		const angleStep = (Math.PI * 2) / categoryCount;
		const seriesColors = chartData.series.map((series, index) => series.color || dataViz.colors[index % dataViz.colors.length]);

		let maxValue = Number(chartData.maxValue) || 0;
		if (!maxValue) {
			chartData.series.forEach(series => {
				if (!Array.isArray(series.data)) {
					return;
				}

				const seriesMax = Math.max(...series.data.map(value => Number(value) || 0), 0);
				maxValue = Math.max(maxValue, seriesMax);
			});
			maxValue = maxValue > 0 ? Math.ceil(maxValue / 10) * 10 : 10;
		}

		const webRings = Array.from({ length: rings }, (_, index) => ({
			radius: ((index + 1) / rings) * radius,
			isOuter: index === rings - 1
		}));

		const axes = chartData.categories.map((category, index) => {
			const angle = index * angleStep - Math.PI / 2;
			const axisX = centerX + Math.cos(angle) * radius;
			const axisY = centerY + Math.sin(angle) * radius;
			const labelPadding = 25;
			const labelX = centerX + Math.cos(angle) * (radius + labelPadding);
			const labelY = centerY + Math.sin(angle) * (radius + labelPadding);
			let textAnchor = 'middle';

			if (Math.abs(Math.cos(angle)) > 0.7) {
				textAnchor = Math.cos(angle) > 0 ? 'start' : 'end';
			}

			return {
				category,
				angle,
				axisX,
				axisY,
				labelX,
				labelY,
				textAnchor
			};
		});

		const valueMarkers = Array.from({ length: rings }, (_, index) => ({
			value: Math.round(((index + 1) / rings) * maxValue),
			x: centerX,
			y: centerY - ((index + 1) / rings) * radius - 5
		}));

		const legendItems = [];
		const seriesLayouts = [];

		chartData.series.forEach((series, seriesIndex) => {
			const color = seriesColors[seriesIndex];
			legendItems.push({
				name: series.name || `Series ${seriesIndex + 1}`,
				color
			});

			if (!Array.isArray(series.data) || series.data.length !== categoryCount) {
				return;
			}

			const points = series.data.map((rawValue, pointIndex) => {
				const value = Number(rawValue) || 0;
				const ratio = Math.min(value / maxValue, 1);
				const angle = pointIndex * angleStep - Math.PI / 2;
				const x = centerX + Math.cos(angle) * radius * ratio;
				const y = centerY + Math.sin(angle) * radius * ratio;

				return {
					category: chartData.categories[pointIndex],
					value,
					x,
					y
				};
			});

			seriesLayouts.push({
				name: series.name || `Series ${seriesIndex + 1}`,
				color,
				points
			});
		});

		if (!seriesLayouts.length) {
			return null;
		}

		return {
			type: 'radar',
			title: chartData.title || Lang.get('datavizRadarChart'),
			theme,
			modalWidth: 720,
			size,
			centerX,
			centerY,
			radius,
			rings,
			maxValue,
			legendItems,
			axes,
			valueMarkers,
			series: seriesLayouts
		};
	}

	function renderMarkup(layout, dataViz) {
		const escapeHtml = value => dataViz.escapeHtml(String(value == null ? '' : value));
		const webRings = layout.webRings || layout.axes.map(() => null);

		const ringHtml = layout.valueMarkers.map((marker, index) => `
			<circle
				cx="${layout.centerX}"
				cy="${layout.centerY}"
				r="${((index + 1) / layout.rings) * layout.radius}"
				fill="none"
				stroke="${layout.theme.grid}"
				stroke-width="1"
				stroke-dasharray="${index === layout.rings - 1 ? 'none' : '2,2'}"
			/>
		`).join('');

		const axesHtml = layout.axes.map(axis => `
			<line
				x1="${layout.centerX}"
				y1="${layout.centerY}"
				x2="${axis.axisX}"
				y2="${axis.axisY}"
				stroke="${layout.theme.grid}"
				stroke-width="1"
			/>
			<text
				x="${axis.labelX}"
				y="${axis.labelY}"
				text-anchor="${axis.textAnchor}"
				dominant-baseline="central"
				class="category-label"
			>
				${escapeHtml(axis.category)}
			</text>
		`).join('');

		const valueMarkerHtml = layout.valueMarkers.map(marker => `
			<text
				x="${marker.x}"
				y="${marker.y}"
				text-anchor="middle"
				class="value-marker"
			>
				${escapeHtml(marker.value)}
			</text>
		`).join('');

		const polygonHtml = layout.series.map(series => {
			const polygonPoints = series.points.map(point => `${point.x},${point.y}`).join(' ');
			return `
				<polygon
					points="${polygonPoints}"
					stroke="${series.color}"
					fill="${series.color}"
					class="series-polygon"
				/>
			`;
		}).join('');

		const pointHtml = layout.series.map(series => series.points.map(point => `
			<circle
				cx="${point.x}"
				cy="${point.y}"
				r="4"
				fill="white"
				stroke="${series.color}"
				stroke-width="2"
				class="data-point"
				data-series="${escapeHtml(series.name)}"
				data-category="${escapeHtml(point.category)}"
				data-value="${escapeHtml(point.value)}"
			/>
		`).join('')).join('');

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
					display:flex;
					flex-direction:column;
					align-items:center;
					margin:0 auto;
					max-width:100%;
					font-family:${layout.theme.fontFamily};
					color:${layout.theme.text};
				}
				.radar-chart-container {
					width:${layout.size}px;
					height:${layout.size}px;
					position:relative;
					margin:0 auto;
				}
				.chart-title {
					text-align:center;
					margin-bottom:0;
					font-size:18px;
					font-weight:bold;
					color:${layout.theme.title};
				}
				.category-label {
					font-size:12px;
					fill:${layout.theme.axis};
					font-weight:500;
				}
				.value-marker {
					font-size:10px;
					fill:${layout.theme.axis};
				}
				.legend-container {
					display:flex;
					flex-direction:row;
					flex-wrap:wrap;
					justify-content:center;
					margin-top:0;
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
				.series-polygon {
					stroke-width:2;
					stroke-linejoin:round;
					fill-opacity:0.25;
					transition:fill-opacity 0.2s;
				}
				.series-polygon:hover {
					fill-opacity:0.4;
				}
				.data-point {
					cursor:pointer;
					transition:r 0.2s ease;
				}
				.data-point:hover {
					r:6;
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
			</style>
			<div class="chart-container">
				<div class="chart-title">${escapeHtml(layout.title)}</div>
				<div class="radar-chart-container">
					<svg width="${layout.size}" height="${layout.size}" viewBox="0 0 ${layout.size} ${layout.size}">
						${ringHtml}
						${axesHtml}
						${valueMarkerHtml}
						${polygonHtml}
						${pointHtml}
					</svg>
					<div class="tooltip"></div>
				</div>
				<div class="legend-container">${legendHtml}</div>
			</div>
			`
		};
	}

	function attachTooltipBehavior() {
		const container = document.querySelector('.dataviz-floating-window .radar-chart-container');
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
				const category = point.getAttribute('data-category');
				const value = point.getAttribute('data-value');

				tooltip.innerHTML = `<strong>${series}</strong><br>${category}: ${value}`;
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
		const titleHeight = 30;
		const legendGap = 14;
		const legendMeasureCanvas = document.createElement('canvas');
		const legendMeasureCtx = legendMeasureCanvas.getContext('2d');
		const legendLayout = chartRenderer.layoutLegendItems(legendMeasureCtx, layout.legendItems, {
			font: `13px ${layout.theme.fontFamily}`,
			containerWidth: layout.size,
			markerSize: 15,
			markerGap: 8,
			itemGap: 20,
			rowGap: 10,
			paddingX: 8,
			paddingY: 8,
			lineHeight: 15
		});

		const totalWidth = padding * 2 + layout.size;
		const totalHeight = padding * 2 + titleHeight + layout.size + legendGap + legendLayout.height;
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
		ctx.fillText(layout.title, originX + layout.size / 2, padding);

		layout.valueMarkers.forEach((marker, index) => {
			ctx.beginPath();
			ctx.arc(originX + layout.centerX, originY + layout.centerY, ((index + 1) / layout.rings) * layout.radius, 0, Math.PI * 2);
			ctx.strokeStyle = layout.theme.grid;
			ctx.lineWidth = 1;
			if (index !== layout.rings - 1) {
				ctx.setLineDash([2, 2]);
			}
			ctx.stroke();
			ctx.setLineDash([]);
		});

		layout.axes.forEach(axis => {
			ctx.beginPath();
			ctx.moveTo(originX + layout.centerX, originY + layout.centerY);
			ctx.lineTo(originX + axis.axisX, originY + axis.axisY);
			ctx.strokeStyle = layout.theme.grid;
			ctx.lineWidth = 1;
			ctx.stroke();

			ctx.fillStyle = layout.theme.axis;
			ctx.font = `500 12px ${layout.theme.fontFamily}`;
			ctx.textBaseline = 'middle';
			ctx.textAlign = axis.textAnchor;
			ctx.fillText(axis.category, originX + axis.labelX, originY + axis.labelY);
		});

		layout.valueMarkers.forEach(marker => {
			ctx.fillStyle = layout.theme.axis;
			ctx.font = `10px ${layout.theme.fontFamily}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(marker.value), originX + marker.x, originY + marker.y);
		});

		layout.series.forEach(series => {
			if (!series.points.length) {
				return;
			}

			ctx.beginPath();
			series.points.forEach((point, index) => {
				if (index === 0) {
					ctx.moveTo(originX + point.x, originY + point.y);
				} else {
					ctx.lineTo(originX + point.x, originY + point.y);
				}
			});
			ctx.closePath();
			ctx.save();
			ctx.globalAlpha = 0.25;
			ctx.fillStyle = series.color;
			ctx.fill();
			ctx.restore();
			ctx.strokeStyle = series.color;
			ctx.lineWidth = 2;
			ctx.lineJoin = 'round';
			ctx.stroke();

			series.points.forEach(point => {
				ctx.beginPath();
				ctx.arc(originX + point.x, originY + point.y, 4, 0, Math.PI * 2);
				ctx.fillStyle = '#ffffff';
				ctx.fill();
				ctx.strokeStyle = series.color;
				ctx.lineWidth = 2;
				ctx.stroke();
			});
		});

		const legendY = originY + layout.size + legendGap;
		chartRenderer.drawRoundedRect(ctx, originX, legendY, layout.size, legendLayout.height, 4);
		ctx.fillStyle = layout.theme.legendBackground;
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendY, layout.theme);

		return canvas;
	}

	function renderRadarChart(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorRadarChart')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
			`);
		}

		const layout = buildRadarChartLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid radar chart data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorRadarChart')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorRadarRequirement') })}</p>
			</div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'radar',
			layout,
			renderMarkup,
			attachBehavior: attachTooltipBehavior
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'radar', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'radar', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizRadarChart = {
		buildLayout: buildRadarChartLayout,
		render: renderRadarChart,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
