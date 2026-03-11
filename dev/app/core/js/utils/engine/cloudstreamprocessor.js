class CloudStreamProcessor extends StreamProcessor {
	constructor() {
		super();
		this._pendingChunkBuffer = '';
		this._bufferFlushTimer = null;
		this._bufferFlushDelayMs = 14;
		this._maxBufferedChars = 320;
		this._minBufferedChars = 24;
		this._lastFlushAt = 0;
		this._flushHardLimitMs = 42;
		this._renderQueue = [];
		this._renderTimer = null;
		this._renderCadenceMs = 14;
		this._debug = window.cloudStreamDebug === true;
		console.info('[CloudStreamProcessor] Initialized for stream display');
	}

	_log(reason, extra = {}) {
		if (!this._debug) {
			return;
		}
		try {
			console.info('[CloudStreamProcessor]', reason, extra);
		} catch (_err) {
			// Logging must never interfere with streaming.
		}
	}

	_shouldFlushImmediately(buffer) {
		if (!buffer) {
			return false;
		}

		if (buffer.length >= this._maxBufferedChars) {
			return true;
		}

		// Structural boundaries should always flush quickly.
		if (
			buffer.includes('\n') ||
			buffer.includes('```') ||
			buffer.includes('</think>') ||
			buffer.includes('<think>')
		) {
			return true;
		}

		// If a sentence likely finished, flush now for a natural typing feel.
		if (/[.!?]\s$/.test(buffer) || /[:;]\s$/.test(buffer)) {
			return true;
		}

		return false;
	}

	_findNextStructuralMarker(buffer) {
		const markers = ['```', '</think>', '<think>', '\n'];
		let best = null;

		for (const marker of markers) {
			const idx = buffer.indexOf(marker);
			if (idx === -1) {
				continue;
			}
			if (!best || idx < best.index) {
				best = { marker, index: idx };
			}
		}

		return best;
	}

	_extractWordUnit(text, force) {
		if (!text) {
			return null;
		}

		const wsMatch = text.match(/^(\s+)/);
		if (wsMatch) {
			return wsMatch[1];
		}

		const wordWithSpace = text.match(/^([^\s]+)(\s+)/);
		if (wordWithSpace) {
			return wordWithSpace[1] + wordWithSpace[2];
		}

		const looksCjk = /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
		if (looksCjk && text.length > 0) {
			return text[0];
		}

		if (/[.!?,;:]$/.test(text)) {
			return text;
		}

		if (force) {
			return text;
		}

		return null;
	}

	_enqueueUnits(force = false) {
		let guard = 0;
		while (this._pendingChunkBuffer && guard < 256) {
			guard += 1;
			const markerData = this._findNextStructuralMarker(this._pendingChunkBuffer);

			if (markerData && markerData.index === 0) {
				const structuralUnit = markerData.marker;
				this._renderQueue.push(structuralUnit);
				this._pendingChunkBuffer = this._pendingChunkBuffer.slice(structuralUnit.length);
				continue;
			}

			if (markerData && markerData.index > 0) {
				const prefix = this._pendingChunkBuffer.slice(0, markerData.index);
				const unit = this._extractWordUnit(prefix, force);
				if (!unit) {
					if (force) {
						this._renderQueue.push(prefix);
						this._pendingChunkBuffer = this._pendingChunkBuffer.slice(prefix.length);
					}
					break;
				}

				this._renderQueue.push(unit);
				this._pendingChunkBuffer = this._pendingChunkBuffer.slice(unit.length);
				continue;
			}

			const unit = this._extractWordUnit(this._pendingChunkBuffer, force);
			if (!unit) {
				break;
			}

			this._renderQueue.push(unit);
			this._pendingChunkBuffer = this._pendingChunkBuffer.slice(unit.length);
		}
	}

	_startRenderPump() {
		if (this._renderTimer) {
			return;
		}

		this._renderTimer = setInterval(() => {
			if (!this._renderQueue.length) {
				clearInterval(this._renderTimer);
				this._renderTimer = null;
				return;
			}

			const nextUnit = this._renderQueue.shift();
			this._lastFlushAt = Date.now();
			this._log('render-unit', {
				length: nextUnit ? nextUnit.length : 0,
				remainingQueue: this._renderQueue.length
			});
			super.processChunk(nextUnit);
		}, this._renderCadenceMs);
	}

	_scheduleFlush() {
		if (this._bufferFlushTimer) {
			return;
		}

		this._bufferFlushTimer = setTimeout(() => {
			this._bufferFlushTimer = null;
			this.flushPendingChunks('timer', true);
		}, this._bufferFlushDelayMs);
	}

	processChunk(chunk) {
		if (chunk === null || chunk === undefined) {
			return;
		}

		const incoming = String(chunk);
		this._pendingChunkBuffer += incoming;

		const now = Date.now();
		const timeSinceLastFlush = this._lastFlushAt ? (now - this._lastFlushAt) : Number.MAX_SAFE_INTEGER;

		const shouldFlushNow = this._shouldFlushImmediately(this._pendingChunkBuffer);

		if (shouldFlushNow) {
			this.flushPendingChunks('boundary', true);
			return;
		}

		if (
			this._pendingChunkBuffer.length >= this._minBufferedChars &&
			timeSinceLastFlush >= this._flushHardLimitMs
		) {
			this.flushPendingChunks('hard-limit', false);
			return;
		}

		this._scheduleFlush();
	}

	flushPendingChunks(reason = 'manual', force = false) {
		if (!this._pendingChunkBuffer && !this._renderQueue.length) {
			return;
		}

		this._enqueueUnits(force);

		if (force && this._pendingChunkBuffer) {
			this._renderQueue.push(this._pendingChunkBuffer);
			this._pendingChunkBuffer = '';
		}

		this._log('flush', {
			reason,
			force,
			queueSize: this._renderQueue.length,
			pendingChars: this._pendingChunkBuffer.length
		});

		this._startRenderPump();
	}

	finishResponse() {
		if (this._bufferFlushTimer) {
			clearTimeout(this._bufferFlushTimer);
			this._bufferFlushTimer = null;
		}

		if (this._renderTimer) {
			clearInterval(this._renderTimer);
			this._renderTimer = null;
		}

		this.flushPendingChunks('finish', true);

		while (this._renderQueue.length) {
			super.processChunk(this._renderQueue.shift());
		}

		super.finishResponse();
	}
}

window.CloudStreamProcessor = CloudStreamProcessor;
