(function() {
	const chartRenderer = window.DataVizChartRenderer;

	function toFillColor(baseColor, alpha) {
		const value = String(baseColor || '').trim();
		const opacity = Number.isFinite(alpha) ? alpha : 0.5;

		if (value.startsWith('#')) {
			let hex = value.slice(1);
			if (hex.length === 3) {
				hex = hex.split('').map(char => char + char).join('');
			}

			if (hex.length === 6) {
				const r = parseInt(hex.slice(0, 2), 16);
				const g = parseInt(hex.slice(2, 4), 16);
				const b = parseInt(hex.slice(4, 6), 16);
				return `rgba(${r}, ${g}, ${b}, ${opacity})`;
			}
		}

		if (value.startsWith('rgba(')) {
			return value.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[^)]+\)/, `rgba($1, $2, $3, ${opacity})`);
		}

		if (value.startsWith('rgb(')) {
			return value.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
		}

		return value;
	}

	function parseColor(color) {
		const value = String(color || '').trim();

		if (value.startsWith('#')) {
			let hex = value.slice(1);
			if (hex.length === 3) {
				hex = hex.split('').map(char => char + char).join('');
			}

			if (hex.length === 6) {
				return {
					r: parseInt(hex.slice(0, 2), 16),
					g: parseInt(hex.slice(2, 4), 16),
					b: parseInt(hex.slice(4, 6), 16),
					a: 1
				};
			}
		}

		const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
		if (rgbMatch) {
			return {
				r: parseInt(rgbMatch[1], 10),
				g: parseInt(rgbMatch[2], 10),
				b: parseInt(rgbMatch[3], 10),
				a: rgbMatch[4] !== undefined ? Math.max(0, Math.min(1, Number(rgbMatch[4]) || 0)) : 1
			};
		}

		return { r: 0, g: 0, b: 0, a: 1 };
	}

	function blendColors(foregroundColor, backgroundColor) {
		const foreground = parseColor(foregroundColor);
		const background = parseColor(backgroundColor);
		const alpha = foreground.a;

		return {
			r: Math.round((foreground.r * alpha) + (background.r * (1 - alpha))),
			g: Math.round((foreground.g * alpha) + (background.g * (1 - alpha))),
			b: Math.round((foreground.b * alpha) + (background.b * (1 - alpha)))
		};
	}

	function getBubbleLabelColor(fillColor, backgroundColor) {
		const blended = blendColors(fillColor, backgroundColor);
		const r = blended.r / 255;
		const g = blended.g / 255;
		const b = blended.b / 255;

		const normalizedR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
		const normalizedG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
		const normalizedB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
		const luminance = 0.2126 * normalizedR + 0.7152 * normalizedG + 0.0722 * normalizedB;

		return luminance < 0.42 ? '#ffffff' : '#333333';
	}

	function formatTick(value) {
		return Number.isInteger(value) ? String(value) : String(Number(value).toFixed(1));
	}

	function buildBubbleChartLayout(dataViz, chartData) {
		if (!chartRenderer) {
			return null;
		}

		if (!chartData || !Array.isArray(chartData.series) || chartData.series.length === 0) {
			return null;
		}

		const theme = chartRenderer.getTheme();
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;
		let minSize = Infinity;
		let maxSize = -Infinity;
		let hasLabels = false;
		let pointCount = 0;

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
				const size = Number(point.size) || 1;
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
				minSize = Math.min(minSize, size);
				maxSize = Math.max(maxSize, size);
				pointCount += 1;
				if (point.label) {
					hasLabels = true;
				}
			});
		});

		if (!pointCount) {
			return null;
		}

		const xPadding = Math.max(0.1, (maxX - minX) * 0.1);
		const yPadding = Math.max(0.1, (maxY - minY) * 0.1);
		const adjustedMinX = Math.max(0, minX - xPadding);
		const adjustedMaxX = maxX + xPadding;
		const adjustedMinY = Math.max(0, minY - yPadding);
		const adjustedMaxY = maxY + yPadding;

		const chartWidth = 700;
		const chartHeight = 450;
		const yAxisWidth = 60;
		const xAxisHeight = 60;
		const plotWidth = chartWidth - yAxisWidth - 20;
		const plotHeight = chartHeight - xAxisHeight - 20;
		const topPadding = 20;
		const minRadius = 5;
		const maxRadius = 40;

		const sizeScale = size => {
			if (maxSize === minSize) {
				return (minRadius + maxRadius) / 2;
			}

			return minRadius + ((size - minSize) / (maxSize - minSize)) * (maxRadius - minRadius);
		};

		const legendItems = [];
		const seriesLayouts = chartData.series.map((series, seriesIndex) => {
			const strokeColor = series.color || dataViz.colors[seriesIndex % dataViz.colors.length];
			const fillColor = toFillColor(strokeColor, 0.5);
			legendItems.push({
				name: series.name || `Series ${seriesIndex + 1}`,
				color: fillColor,
				strokeColor
			});

			const points = Array.isArray(series.data)
				? series.data.filter(Boolean).map((point, pointIndex) => {
					const x = Number(point.x) || 0;
					const y = Number(point.y) || 0;
					const size = Number(point.size) || 1;
					const radius = sizeScale(size);
					const xPos = yAxisWidth + ((x - adjustedMinX) / (adjustedMaxX - adjustedMinX || 1)) * plotWidth;
					const yPos = topPadding + ((adjustedMaxY - y) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;
					const label = point.label || '';
					const insideLabelColor = getBubbleLabelColor(fillColor, theme.plotBackground);
					return {
						id: `bubble-${seriesIndex}-${pointIndex}`,
						x,
						y,
						size,
						label,
						radius,
						xPos,
						yPos,
						insideLabelColor,
						showInsideLabel: Boolean(label) && radius > 20,
						showOutsideLabel: Boolean(label) && radius <= 20
					};
				})
				: [];

			return {
				name: series.name || `Series ${seriesIndex + 1}`,
				fillColor,
				strokeColor,
				points
			};
		});

		const yAxisTicks = Array.from({ length: 6 }, (_, index) => {
			const value = adjustedMinY + (adjustedMaxY - adjustedMinY) * (index / 5);
			const y = topPadding + ((adjustedMaxY - value) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;
			return {
				value,
				label: formatTick(value),
				y,
				isBaseline: index === 0
			};
		});

		const xAxisTicks = Array.from({ length: 6 }, (_, index) => {
			const value = adjustedMinX + (adjustedMaxX - adjustedMinX) * (index / 5);
			const x = yAxisWidth + (index / 5) * plotWidth;
			return {
				value,
				label: formatTick(value),
				x
			};
		});

		return {
			type: 'bubble',
			title: chartData.title || Lang.get('datavizBubbleChart'),
			theme,
			modalWidth: 750,
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
				fill="${layout.theme.plotBackground}"
				stroke="${layout.theme.plotBorder}"
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
				y="${layout.topPadding + layout.plotHeight + 20}"
				text-anchor="middle"
				class="axis-label"
			>
				${escapeHtml(tick.label)}
			</text>
		`).join('');

		const bubblesHtml = layout.series.map(series => {
			const pointsHtml = series.points.map(point => `
				<circle
					cx="${point.xPos}"
					cy="${point.yPos}"
					r="${point.radius}"
					fill="${series.fillColor}"
					stroke="${series.strokeColor}"
					stroke-width="1"
					class="bubble"
					data-series="${escapeHtml(series.name)}"
					data-x="${escapeHtml(point.x)}"
					data-y="${escapeHtml(point.y)}"
					data-size="${escapeHtml(point.size)}"
					data-label="${escapeHtml(point.label)}"
				/>
			`).join('');

			const labelHtml = series.points.map(point => {
				if (point.showInsideLabel) {
					return `
						<text
							x="${point.xPos}"
							y="${point.yPos}"
							text-anchor="middle"
							dominant-baseline="middle"
							class="bubble-label"
							fill="${point.insideLabelColor}"
							font-size="${Math.min(point.radius * 0.8, 12)}px"
						>
							${escapeHtml(point.label)}
						</text>
					`;
				}

				if (point.showOutsideLabel) {
					return `
						<text
							x="${point.xPos}"
							y="${point.yPos + point.radius + 10}"
							text-anchor="middle"
							dominant-baseline="hanging"
							class="bubble-label outside-label"
							fill="${layout.theme.text}"
							font-size="11px"
							stroke="${layout.theme.background}"
							stroke-width="1.5"
							paint-order="stroke"
						>
							${escapeHtml(point.label)}
						</text>
					`;
				}

				return '';
			}).join('');

			return pointsHtml + labelHtml;
		}).join('');

		const legendHtml = layout.legendItems.map(item => `
			<div class="legend-item">
				<span class="color-box" style="background-color:${item.strokeColor}; opacity:0.5;"></span>
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
				.bubble-chart-container {
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
				.bubble {
					cursor:pointer;
					transition:opacity 0.2s ease;
				}
				.bubble:hover {
					opacity:0.9;
					stroke-width:2;
				}
				.bubble-label {
					pointer-events:none;
					user-select:none;
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
					left:0;
					top:${layout.topPadding + layout.plotHeight / 2}px;
					transform-origin:left center;
					transform:rotate(-90deg) translateX(-50%);
					font-size:12px;
					color:${layout.theme.axis};
					white-space:nowrap;
					width:auto;
					text-align:center;
				}
				.x-axis-title {
					position:absolute;
					bottom:5px;
					left:${layout.yAxisWidth + layout.plotWidth / 2}px;
					transform:translateX(-50%);
					font-size:12px;
					color:${layout.theme.axis};
				}
			</style>
			<div class="chart-container">
				<div class="chart-title">${escapeHtml(layout.title)}</div>
				<div class="bubble-chart-container">
					<div class="y-axis-title">${escapeHtml(layout.yAxisLabel)}</div>
					<svg width="${layout.chartWidth}" height="${layout.chartHeight}" viewBox="0 0 ${layout.chartWidth} ${layout.chartHeight}">
						${backgroundRect}
						${yAxisTicksHtml}
						<line x1="${layout.yAxisWidth}" y1="${layout.topPadding}" x2="${layout.yAxisWidth}" y2="${layout.topPadding + layout.plotHeight}" stroke="${layout.theme.axisLine}" stroke-width="1" />
						<line x1="${layout.yAxisWidth}" y1="${layout.topPadding + layout.plotHeight}" x2="${layout.yAxisWidth + layout.plotWidth}" y2="${layout.topPadding + layout.plotHeight}" stroke="${layout.theme.axisLine}" stroke-width="1" />
						${xAxisTicksHtml}
						${bubblesHtml}
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
		const container = document.querySelector('.dataviz-floating-window .bubble-chart-container');
		if (!container) {
			return;
		}

		const tooltip = container.querySelector('.tooltip');
		if (!tooltip) {
			return;
		}

		container.querySelectorAll('.bubble').forEach(bubble => {
			bubble.addEventListener('mouseover', event => {
				const series = bubble.getAttribute('data-series');
				const x = bubble.getAttribute('data-x');
				const y = bubble.getAttribute('data-y');
				const size = bubble.getAttribute('data-size');
				const label = bubble.getAttribute('data-label');

				let tooltipContent = `<strong>${series}</strong><br>`;
				tooltipContent += `X: ${x}, Y: ${y}<br>`;
				tooltipContent += `Size: ${size}`;

				if (label) {
					tooltipContent += `<br>${label}`;
				}

				tooltip.innerHTML = tooltipContent;
				tooltip.style.left = `${event.pageX + 10}px`;
				tooltip.style.top = `${event.pageY - 30}px`;
				tooltip.style.display = 'block';
			});

			bubble.addEventListener('mouseout', () => {
				tooltip.style.display = 'none';
			});
		});
	}

	function renderToCanvas(layout, scale) {
		const exportScale = scale || 2;
		const padding = 20;
		const titleHeight = 36;
		const legendGap = 14;
		const legendMeasureCanvas = document.createElement('canvas');
		const legendMeasureCtx = legendMeasureCanvas.getContext('2d');
		const legendLayout = chartRenderer.layoutLegendItems(legendMeasureCtx, layout.legendItems, {
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

		const totalWidth = padding * 2 + layout.chartWidth;
		const totalHeight = padding * 2 + titleHeight + layout.chartHeight + legendGap + legendLayout.height;
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
		ctx.fillText(layout.title, originX + layout.chartWidth / 2, padding);

		ctx.fillStyle = layout.theme.plotBackground;
		ctx.fillRect(originX + layout.yAxisWidth, originY + layout.topPadding, layout.plotWidth, layout.plotHeight);
		ctx.strokeStyle = layout.theme.plotBorder;
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

			ctx.fillStyle = layout.theme.axis;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(tick.label, originX + tick.x, originY + layout.topPadding + layout.plotHeight + 20);
		});

		layout.series.forEach(series => {
			series.points.forEach(point => {
				ctx.beginPath();
				ctx.arc(originX + point.xPos, originY + point.yPos, point.radius, 0, Math.PI * 2);
				ctx.fillStyle = series.fillColor;
				ctx.fill();
				ctx.strokeStyle = series.strokeColor;
				ctx.lineWidth = 1;
				ctx.stroke();

				if (point.showInsideLabel) {
					ctx.fillStyle = point.insideLabelColor;
					ctx.font = `${Math.min(point.radius * 0.8, 12)}px ${layout.theme.fontFamily}`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(point.label, originX + point.xPos, originY + point.yPos);
				} else if (point.showOutsideLabel) {
					ctx.strokeStyle = layout.theme.background;
					ctx.lineWidth = 3;
					ctx.font = `11px ${layout.theme.fontFamily}`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'top';
					ctx.strokeText(point.label, originX + point.xPos, originY + point.yPos + point.radius + 10);
					ctx.fillStyle = layout.theme.text;
					ctx.fillText(point.label, originX + point.xPos, originY + point.yPos + point.radius + 10);
				}
			});
		});

		ctx.save();
		ctx.translate(originX + 12, originY + layout.topPadding + layout.plotHeight / 2);
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
		ctx.fillStyle = layout.theme.legendBackground;
		chartRenderer.drawRoundedRect(ctx, originX, legendY, layout.chartWidth, legendLayout.height, 4);
		ctx.fill();
		chartRenderer.renderLegendToCanvas(ctx, legendLayout, originX, legendY, layout.theme);

		return canvas;
	}

	function renderBubbleChart(dataViz, chartData) {
		if (!chartRenderer) {
			console.error('DataViz: Shared chart renderer is not available');
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorBubbleChart')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
			`);
		}

		const layout = buildBubbleChartLayout(dataViz, chartData);
		if (!layout) {
			console.error('DataViz: Invalid bubble chart data structure');
			chartRenderer.setCurrentChartState(dataViz, null);
			return dataViz.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorBubbleChart')}</h3>
				<p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorBubbleRequirement') })}</p>
			</div>
			`);
		}

		return chartRenderer.showChartInFloatingWindow({
			dataViz,
			type: 'bubble',
			layout,
			renderMarkup,
			attachBehavior: attachTooltipBehavior
		});
	}

	function exportPng(dataViz) {
		return chartRenderer
			? chartRenderer.exportCurrentChartAsPng({ dataViz, type: 'bubble', renderToCanvas, scale: 2 })
			: false;
	}

	function captureDataUrl(dataViz) {
		return chartRenderer
			? chartRenderer.captureCurrentChartAsDataUrl({ dataViz, type: 'bubble', renderToCanvas, scale: 2 })
			: null;
	}

	window.DataVizBubbleChart = {
		buildLayout: buildBubbleChartLayout,
		render: renderBubbleChart,
		renderToCanvas: renderToCanvas,
		exportPng,
		captureDataUrl
	};
})();
