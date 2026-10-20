(function () {
	'use strict';

	var boardEl = document.getElementById('game-board');
	if (!boardEl) return;

	var boardWrap = document.getElementById('game-board-wrap');
	var levelEl = document.getElementById('game-level');
	var progressEl = document.getElementById('game-progress');
	var strikesEl = document.getElementById('game-strikes');
	var bestEl = document.getElementById('game-best');
	var findBtn = document.getElementById('game-find');
	var findsEl = document.getElementById('game-finds');
	var resetBtn = document.getElementById('game-reset');
	var actionBtn = document.getElementById('game-action');
	var overlayEl = document.getElementById('game-overlay');
	var overlayTitleEl = document.getElementById('game-overlay-title');
	var overlaySubEl = document.getElementById('game-overlay-sub');

	var WIN_THRESHOLD = 0.8;
	var FINDS_PER_LEVEL = 3;
	var MAX_POOPS_FOUND = 4;
	var BEST_KEY = 'lawnGameBestLevel';

	var level = 1;
	var best = parseInt(localStorage.getItem(BEST_KEY), 10) || 1;
	var rows, cols, mask, poop, mowed, revealedPoop, mower, finds, findArmed, poopsFound, totalLawn, gameState;

	/* ---------- 8-bit mower-man sprite ---------- */

	var SPRITE_PIXELS = [
		[3, 0, 'skin'], [4, 0, 'skin'],
		[3, 1, 'skin'], [4, 1, 'skin'],
		[3, 2, 'shirt'], [4, 2, 'shirt'], [5, 2, 'skin'],
		[6, 2, 'handle'], [7, 2, 'handle'], [8, 2, 'handle'],
		[3, 3, 'shirt'], [4, 3, 'shirt'],
		[2, 4, 'pants'], [4, 4, 'pants'],
		[2, 5, 'pants'], [4, 5, 'pants'],
		[9, 3, 'deck'], [10, 3, 'deck'], [11, 3, 'deck'],
		[9, 4, 'body'], [10, 4, 'body'], [11, 4, 'body'],
		[9, 5, 'body'], [10, 5, 'body'], [11, 5, 'body'],
		[9, 6, 'wheel'], [11, 6, 'wheel']
	];

	var SPRITE_COLORS = {
		skin: '#e7b48a',
		shirt: 'var(--accent)',
		pants: 'var(--ink)',
		handle: 'var(--ink-faint)',
		deck: 'var(--accent)',
		body: 'var(--ink-dim)',
		wheel: 'var(--ink)'
	};

	function mowerSpriteSVG() {
		var rects = SPRITE_PIXELS.map(function (p) {
			return '<rect x="' + p[0] + '" y="' + p[1] + '" width="1" height="1" fill="' + SPRITE_COLORS[p[2]] + '"/>';
		}).join('');
		return '<svg class="g-sprite" viewBox="0 0 13 7" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">' + rects + '</svg>';
	}

	/* ---------- shapes ---------- */

	function shapeRect(r, c) { return true; }

	function shapeDiamond(r, c, rows, cols) {
		var cy = (rows - 1) / 2, cx = (cols - 1) / 2;
		var radius = Math.min(rows, cols) / 2;
		return (Math.abs(r - cy) + Math.abs(c - cx)) <= radius + 0.5;
	}

	function shapePlus(r, c, rows, cols) {
		var bandR = Math.max(2, Math.floor(rows / 3));
		var bandC = Math.max(2, Math.floor(cols / 3));
		var r0 = Math.floor((rows - bandR) / 2), r1 = r0 + bandR;
		var c0 = Math.floor((cols - bandC) / 2), c1 = c0 + bandC;
		return (r >= r0 && r < r1) || (c >= c0 && c < c1);
	}

	function shapeRing(r, c, rows, cols) {
		var cy = (rows - 1) / 2, cx = (cols - 1) / 2;
		var nr = (r - cy) / (rows / 2), nc = (c - cx) / (cols / 2);
		var dist = Math.sqrt(nr * nr + nc * nc);
		return dist <= 1.05 && dist >= 0.42;
	}

	function shapeL(r, c, rows, cols) {
		var cutR = rows - Math.floor(rows / 2);
		var cutC = cols - Math.floor(cols / 2);
		return !(r >= cutR && c >= cutC);
	}

	var SHAPES = [shapeRect, shapeDiamond, shapePlus, shapeL, shapeRing];

	function shuffle(arr) {
		for (var i = arr.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
		}
		return arr;
	}

	function makeGrid(rows, cols, fill) {
		var g = [];
		for (var r = 0; r < rows; r++) {
			var row = [];
			for (var c = 0; c < cols; c++) row.push(fill);
			g.push(row);
		}
		return g;
	}

	function inBounds(r, c) { return r >= 0 && r < rows && c >= 0 && c < cols; }

	function countAdjPoop(r, c) {
		var n = 0;
		for (var dr = -1; dr <= 1; dr++) {
			for (var dc = -1; dc <= 1; dc++) {
				if (dr === 0 && dc === 0) continue;
				var rr = r + dr, cc = c + dc;
				if (inBounds(rr, cc) && mask[rr][cc] && poop[rr][cc]) n++;
			}
		}
		return n;
	}

	/* ---------- level generation ---------- */

	function initLevel(lvl, showStart) {
		level = lvl;
		var size = Math.min(5 + Math.floor((lvl - 1) * 0.8), 10);
		rows = size;
		cols = size;
		var shapeFn = SHAPES[(lvl - 1) % SHAPES.length];

		mask = makeGrid(rows, cols, false);
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) {
				mask[r][c] = shapeFn(r, c, rows, cols);
			}
		}

		var start = null;
		for (var r2 = 0; r2 < rows && !start; r2++) {
			for (var c2 = 0; c2 < cols && !start; c2++) {
				if (mask[r2][c2]) start = { r: r2, c: c2 };
			}
		}
		if (!start) start = { r: 0, c: 0 };

		mower = start;
		mowed = makeGrid(rows, cols, false);
		poop = makeGrid(rows, cols, false);
		revealedPoop = makeGrid(rows, cols, false);

		totalLawn = 0;
		var candidates = [];
		var safe = {};
		safe[start.r + ',' + start.c] = true;
		[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
			safe[(start.r + d[0]) + ',' + (start.c + d[1])] = true;
		});

		for (var r3 = 0; r3 < rows; r3++) {
			for (var c3 = 0; c3 < cols; c3++) {
				if (!mask[r3][c3]) continue;
				totalLawn++;
				if (!safe[r3 + ',' + c3]) candidates.push({ r: r3, c: c3 });
			}
		}

		var density = Math.min(0.12 + lvl * 0.01, 0.22);
		var poopCount = Math.max(totalLawn > 6 ? 1 : 0, Math.round(totalLawn * density));
		shuffle(candidates);
		candidates.slice(0, poopCount).forEach(function (cell) {
			poop[cell.r][cell.c] = true;
		});

		mowed[start.r][start.c] = true;
		finds = FINDS_PER_LEVEL;
		findArmed = false;
		poopsFound = 0;
		gameState = showStart ? 'start' : 'playing';

		levelEl.textContent = level;
		updateFindsUI();
		updateStrikesUI();
		updateProgressUI();
		render();

		if (gameState === 'start') {
			showOverlay('start');
		} else {
			hideOverlay();
			boardWrap.focus();
		}
	}

	/* ---------- rendering ---------- */

	function render() {
		boardEl.style.setProperty('--cols', cols);
		boardEl.innerHTML = '';

		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) {
				var cell = document.createElement('div');

				if (!mask[r][c]) {
					cell.className = 'game-cell empty';
					boardEl.appendChild(cell);
					continue;
				}

				cell.className = 'game-cell';
				cell.setAttribute('role', 'button');
				cell.setAttribute('tabindex', '-1');

				if (poop[r][c] && revealedPoop[r][c]) {
					cell.classList.add('poop');
					cell.textContent = '💩';
				} else if (mowed[r][c]) {
					cell.classList.add('mowed');
					var n = countAdjPoop(r, c);
					if (n > 0) {
						var num = document.createElement('span');
						num.className = 'g-num';
						num.setAttribute('data-n', Math.min(n, 4));
						num.textContent = n;
						cell.appendChild(num);
					}
				} else {
					cell.classList.add('grass');
				}

				if (r === mower.r && c === mower.c) {
					var m = document.createElement('span');
					m.className = 'g-mower';
					m.innerHTML = mowerSpriteSVG();
					cell.appendChild(m);
				}

				(function (rr, cc, el) {
					el.addEventListener('click', function () { attemptMove(rr, cc, el); });
				})(r, c, cell);

				boardEl.appendChild(cell);
			}
		}
	}

	function updateProgressUI() {
		var mowedCount = 0;
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) {
				if (mask[r][c] && mowed[r][c]) mowedCount++;
			}
		}
		var pct = totalLawn ? Math.round((mowedCount / totalLawn) * 100) : 0;
		progressEl.textContent = pct + '%';
		return { mowedCount: mowedCount, pct: pct };
	}

	function updateFindsUI() {
		findsEl.textContent = finds;
		findBtn.disabled = finds <= 0 || gameState !== 'playing';
		findBtn.classList.toggle('is-armed', findArmed);
	}

	function updateStrikesUI() {
		strikesEl.textContent = poopsFound + '/' + MAX_POOPS_FOUND;
	}

	function flashShake(el) {
		if (!el) return;
		el.classList.add('shake');
		setTimeout(function () { el.classList.remove('shake'); }, 300);
	}

	/* ---------- overlay states ---------- */

	function showOverlay(kind, extra) {
		overlayEl.hidden = false;
		if (kind === 'start') {
			overlayTitleEl.textContent = 'Mow the Lawn';
			overlaySubEl.textContent = 'An 8-bit minesweeper. Mow 80% of the lawn — poop blocks your path, and finding 4 ends the game.';
			actionBtn.textContent = 'start mowing';
			actionBtn.onclick = function () { startPlaying(); };
		} else if (kind === 'won') {
			overlayTitleEl.textContent = 'Lawn mowed!';
			overlaySubEl.textContent = 'Level ' + level + ' complete — onward to a trickier lawn.';
			actionBtn.textContent = 'next lawn';
			actionBtn.onclick = function () { initLevel(level + 1); };
		} else if (kind === 'lost') {
			overlayTitleEl.textContent = 'Game over';
			overlaySubEl.textContent = extra || 'The lawn got the better of you.';
			actionBtn.textContent = 'try again';
			actionBtn.onclick = function () { initLevel(level); };
		}
		actionBtn.focus();
	}

	function hideOverlay() { overlayEl.hidden = true; }

	function startPlaying() {
		gameState = 'playing';
		hideOverlay();
		updateFindsUI();
		boardWrap.focus();
	}

	/* ---------- move logic ---------- */

	function buildPath(from, to) {
		var path = [];
		if (from.r === to.r) {
			var step = to.c > from.c ? 1 : -1;
			for (var c = from.c + step; c !== to.c + step; c += step) path.push({ r: from.r, c: c });
		} else {
			var step2 = to.r > from.r ? 1 : -1;
			for (var r = from.r + step2; r !== to.r + step2; r += step2) path.push({ r: r, c: from.c });
		}
		return path;
	}

	function canStillProgress() {
		var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
		for (var d = 0; d < dirs.length; d++) {
			var r = mower.r + dirs[d][0], c = mower.c + dirs[d][1];
			while (inBounds(r, c) && mask[r][c] && mowed[r][c]) {
				r += dirs[d][0];
				c += dirs[d][1];
			}
			if (inBounds(r, c) && mask[r][c]) {
				if (!poop[r][c]) return true;
				if (finds > 0) return true;
			}
		}
		return false;
	}

	function attemptMove(r, c, el) {
		if (gameState !== 'playing') return;
		if (r === mower.r && c === mower.c) return;

		if (r !== mower.r && c !== mower.c) {
			flashShake(el);
			return;
		}

		var path = buildPath(mower, { r: r, c: c });
		var usingFind = findArmed && finds > 0;
		var cleared = 0;
		var newPos = { r: mower.r, c: mower.c };

		for (var i = 0; i < path.length; i++) {
			var cell = path[i];
			if (poop[cell.r][cell.c]) {
				if (usingFind) {
					if (revealedPoop[cell.r][cell.c]) {
						poopsFound = Math.max(0, poopsFound - 1);
						revealedPoop[cell.r][cell.c] = false;
					}
					poop[cell.r][cell.c] = false;
					mowed[cell.r][cell.c] = true;
					cleared++;
					newPos = cell;
					continue;
				} else {
					if (!revealedPoop[cell.r][cell.c]) {
						revealedPoop[cell.r][cell.c] = true;
						poopsFound++;
					}
					break;
				}
			}
			mowed[cell.r][cell.c] = true;
			newPos = cell;
		}

		mower = newPos;

		if (usingFind) {
			if (cleared > 0) finds--;
			findArmed = false;
		}

		updateFindsUI();
		updateStrikesUI();
		render();
		var progress = updateProgressUI();
		evaluateOutcome(progress.pct);
	}

	function evaluateOutcome(pct) {
		if (pct >= WIN_THRESHOLD * 100) {
			win();
			return;
		}
		if (poopsFound >= MAX_POOPS_FOUND) {
			lose('You found ' + MAX_POOPS_FOUND + ' piles of poop. The lawn wins this round.');
			return;
		}
		if (!canStillProgress()) {
			lose('Poop boxed you in — there was no clean path left to 80%.');
		}
	}

	function win() {
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) {
				if (mask[r][c] && !poop[r][c]) mowed[r][c] = true;
			}
		}
		gameState = 'won';
		render();
		updateProgressUI();

		if (level > best) {
			best = level;
			localStorage.setItem(BEST_KEY, String(best));
		}
		bestEl.textContent = best;
		showOverlay('won');
	}

	function lose(reason) {
		gameState = 'lost';
		render();
		showOverlay('lost', reason);
	}

	/* ---------- controls ---------- */

	findBtn.addEventListener('click', function () {
		if (finds <= 0 || gameState !== 'playing') return;
		findArmed = !findArmed;
		updateFindsUI();
	});

	resetBtn.addEventListener('click', function () { initLevel(level); });

	boardWrap.addEventListener('keydown', function (e) {
		if (gameState !== 'playing') return;
		var dir = null;
		if (e.key === 'ArrowUp') dir = [-1, 0];
		else if (e.key === 'ArrowDown') dir = [1, 0];
		else if (e.key === 'ArrowLeft') dir = [0, -1];
		else if (e.key === 'ArrowRight') dir = [0, 1];
		if (!dir) return;

		e.preventDefault();
		var target = { r: mower.r + dir[0], c: mower.c + dir[1] };
		if (!inBounds(target.r, target.c) || !mask[target.r][target.c]) return;
		attemptMove(target.r, target.c, null);
	});

	bestEl.textContent = best;
	initLevel(1, true);
})();
