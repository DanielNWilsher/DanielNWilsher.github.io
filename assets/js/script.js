(function () {
	'use strict';

	var root = document.documentElement;
	var body = document.body;
	var fine = window.matchMedia('(pointer: fine)').matches;
	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---------- theme toggle ---------- */

	var themeToggle = document.getElementById('theme-toggle');
	var storedTheme = localStorage.getItem('theme');
	if (storedTheme) root.setAttribute('data-theme', storedTheme);

	if (themeToggle) {
		themeToggle.addEventListener('click', function () {
			var current = root.getAttribute('data-theme');
			var isLight = current === 'light' || (!current && window.matchMedia('(prefers-color-scheme: light)').matches);
			var next = isLight ? 'dark' : 'light';
			root.setAttribute('data-theme', next);
			localStorage.setItem('theme', next);
		});
	}

	/* ---------- mobile nav ---------- */

	var navToggle = document.getElementById('nav-toggle');
	var navLinks = document.getElementById('nav-links');

	if (navToggle && navLinks) {
		navToggle.addEventListener('click', function () {
			var isOpen = navLinks.classList.toggle('open');
			navToggle.classList.toggle('open', isOpen);
			navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		});

		navLinks.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', function () {
				navLinks.classList.remove('open');
				navToggle.classList.remove('open');
				navToggle.setAttribute('aria-expanded', 'false');
			});
		});
	}

	/* ---------- scrollspy: top nav + margin rail ---------- */

	var sections = document.querySelectorAll('main section[id]');
	var navAnchors = document.querySelectorAll('.nav-links a');
	var railItems = document.querySelectorAll('.rail-item');

	if (sections.length && 'IntersectionObserver' in window) {
		var spyObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var id = entry.target.getAttribute('id');
				navAnchors.forEach(function (a) {
					a.classList.toggle('active', a.getAttribute('href') === '#' + id);
				});
				railItems.forEach(function (r) {
					r.classList.toggle('active', r.getAttribute('data-target') === id);
				});
			});
		}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

		sections.forEach(function (s) { spyObserver.observe(s); });
	}

	/* ---------- reveal on scroll ---------- */

	var revealEls = document.querySelectorAll('.reveal');
	var countEls = document.querySelectorAll('[data-count-to]');

	function runCount(el) {
		var target = parseFloat(el.getAttribute('data-count-to'));
		var suffix = el.getAttribute('data-count-suffix') || '';
		var start = performance.now();
		var duration = 900;

		function tick(now) {
			var p = Math.min((now - start) / duration, 1);
			var eased = 1 - Math.pow(1 - p, 3);
			el.textContent = Math.round(target * eased) + suffix;
			if (p < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	if (revealEls.length && 'IntersectionObserver' in window) {
		var revealObserver = new IntersectionObserver(function (entries, obs) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('in-view');
					entry.target.querySelectorAll('[data-count-to]').forEach(runCount);
					obs.unobserve(entry.target);
				}
			});
		}, { threshold: 0.15 });

		revealEls.forEach(function (el) { revealObserver.observe(el); });
	} else {
		revealEls.forEach(function (el) { el.classList.add('in-view'); });
		countEls.forEach(runCount);
	}

	/* ---------- education card: wolverine walks it in, sits, and writes ---------- */

	var clawStage = document.getElementById('claw-stage');
	var eduCard = document.getElementById('edu-card');
	var wolverine = document.getElementById('wolverine');
	var clawMarks = document.getElementById('claw-marks');

	if (clawStage && eduCard && wolverine && clawMarks) {
		var wolverineTimers = [];

		var playWolverine = function () {
			wolverineTimers.forEach(function (t) { clearTimeout(t); });
			wolverineTimers = [];

			[eduCard, wolverine, clawMarks].forEach(function (el) {
				el.classList.remove('claw-enter', 'is-walking', 'is-sitting', 'cap-on', 'is-writing');
			});
			// force reflow so the animations can restart
			void eduCard.offsetWidth;

			eduCard.classList.add('claw-enter');
			clawMarks.classList.add('claw-enter');
			wolverine.classList.add('is-walking');

			wolverineTimers.push(setTimeout(function () { wolverine.classList.add('is-sitting'); }, 2650));
			wolverineTimers.push(setTimeout(function () { wolverine.classList.add('cap-on'); }, 3500));
			wolverineTimers.push(setTimeout(function () { wolverine.classList.add('is-writing'); }, 4300));
		};

		if ('IntersectionObserver' in window) {
			var clawObserver = new IntersectionObserver(function (entries, obs) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						playWolverine();
						obs.unobserve(entry.target);
					}
				});
			}, { threshold: 0.3 });
			clawObserver.observe(clawStage);
		} else {
			playWolverine();
		}

		eduCard.addEventListener('click', playWolverine);
		eduCard.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				// let native <details>/<summary> toggling happen; only replay when the
				// click/press wasn't on the coursework toggle itself
				if (e.target.closest && e.target.closest('summary')) return;
				e.preventDefault();
				playWolverine();
			}
		});
	}

	/* ---------- custom cursor: a roaming 8-bit dog that chases its bone ---------- */
	/* skipped entirely under prefers-reduced-motion so the real cursor is never hidden without a visible, non-animated replacement */

	if (fine && !reducedMotion) {
		body.classList.add('has-cursor', 'no-cursor');

		var DOG_SVG = '<svg viewBox="0 0 16 10" shape-rendering="crispEdges" overflow="visible">' +
			'<rect class="d-tail" x="1" y="3" width="2" height="2" fill="#8a6a4a" />' +
			'<rect x="4" y="4" width="6" height="3" fill="#8a6a4a" />' +
			'<rect x="9" y="3" width="3" height="3" fill="#8a6a4a" />' +
			'<rect x="9" y="2" width="1" height="1" fill="#8a6a4a" />' +
			'<rect x="12" y="4" width="1" height="1" fill="#2b2620" />' +
			'<rect x="10" y="5" width="2" height="1" fill="#e8dcc0" />' +
			'<g class="d-legs-a">' +
			'<rect x="5" y="7" width="1" height="2" fill="#5e4530" />' +
			'<rect x="6" y="7" width="1" height="1" fill="#5e4530" />' +
			'<rect x="8" y="7" width="1" height="1" fill="#5e4530" />' +
			'<rect x="9" y="7" width="1" height="2" fill="#5e4530" />' +
			'</g>' +
			'<g class="d-legs-b">' +
			'<rect x="5" y="7" width="1" height="1" fill="#5e4530" />' +
			'<rect x="6" y="7" width="1" height="2" fill="#5e4530" />' +
			'<rect x="8" y="7" width="1" height="2" fill="#5e4530" />' +
			'<rect x="9" y="7" width="1" height="1" fill="#5e4530" />' +
			'</g>' +
			'<g class="d-legs-nap">' +
			'<rect x="4" y="7" width="7" height="2" fill="#5e4530" />' +
			'</g>' +
			'<g class="d-legs-dig">' +
			'<rect x="5" y="7" width="1" height="2" fill="#5e4530" />' +
			'<rect x="8" y="6" width="2" height="1" fill="#5e4530" />' +
			'</g>' +
			'</svg>';

		var BONE_SVG = '<svg viewBox="0 0 12 5" shape-rendering="crispEdges" overflow="visible">' +
			'<rect x="0" y="0" width="3" height="2" fill="#f1ede2" />' +
			'<rect x="0" y="3" width="3" height="2" fill="#f1ede2" />' +
			'<rect x="2" y="1" width="8" height="3" fill="#f1ede2" />' +
			'<rect x="9" y="0" width="3" height="2" fill="#f1ede2" />' +
			'<rect x="9" y="3" width="3" height="2" fill="#f1ede2" />' +
			'</svg>';

		var dog = document.createElement('div');
		dog.className = 'dog-sprite';
		dog.innerHTML = DOG_SVG;
		var bone = document.createElement('div');
		bone.className = 'bone-sprite';
		bone.innerHTML = BONE_SVG;
		var dirtKick = document.createElement('div');
		dirtKick.className = 'dirt-kick';
		for (var dk = 0; dk < 5; dk++) {
			var speck = document.createElement('span');
			speck.style.setProperty('--i', dk);
			dirtKick.appendChild(speck);
		}
		var doghouse = document.createElement('div');
		doghouse.className = 'doghouse';
		doghouse.innerHTML = '<svg viewBox="0 0 32 20" shape-rendering="crispEdges" overflow="visible">' +
			'<polygon points="2,8 11,1 20,8" fill="#7a3b2e" />' +
			'<rect x="4" y="8" width="14" height="8" fill="#9a4f3b" />' +
			'<rect x="8" y="11" width="6" height="5" fill="#2b2620" />' +
			'<rect x="14" y="14" width="16" height="5" fill="#6b4a2d" />' +
			'<rect x="16" y="12" width="11" height="3" fill="#7c5733" />' +
			'<rect x="18" y="17" width="2" height="1" fill="#4a3220" />' +
			'<rect x="23" y="18" width="2" height="1" fill="#4a3220" />' +
			'<rect x="26" y="16" width="1" height="1" fill="#4a3220" />' +
			'<g class="mound">' +
			'<rect x="17" y="10" width="10" height="3" fill="#8a6342" />' +
			'<rect x="20" y="9" width="4" height="1" fill="#9a7250" />' +
			'<rect x="21" y="10" width="2" height="1" fill="#f1ede2" />' +
			'</g>' +
			'</svg>';
		body.appendChild(doghouse);
		body.appendChild(dirtKick);
		body.appendChild(dog);
		body.appendChild(bone);

		/* ---- shared cursor state ---- */
		var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
		var lastMoveTime = performance.now();
		var buried = false;
		var IDLE_BURY_MS = 5000;

		/* ---- dog state machine ---- */
		var WALK_SPEED = 70, RUN_SPEED = 480, ARRIVE_DIST = 6, DRAG_DURATION = 1100;
		var dogState = 'wander';
		var dogFacing = 1;
		var dogX = window.innerWidth * 0.2, dogY = window.innerHeight * 0.75;
		var targetX = dogX, targetY = dogY;
		var stateUntil = 0;
		var idleBoneX = 0, idleBoneY = 0;
		var dragToX = 0, dragToY = 0;
		var dragFromX = 0, dragFromY = 0, dragStart = 0;
		var buryStart = 0;
		var BURY_DURATION = 900;
		var lastFrame = performance.now();

		function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

		function margin() { return 40; }

		function randomWanderPoint() {
			var m = margin();
			return {
				x: m + Math.random() * (window.innerWidth - m * 2),
				y: window.innerHeight * 0.2 + Math.random() * (window.innerHeight * 0.7)
			};
		}

		function doghousePos() {
			var r = doghouse.getBoundingClientRect();
			return { x: r.left + r.width * 0.72, y: r.top + r.height * 0.55 };
		}

		function decideNext() {
			var roll = Math.random();
			if (roll < 0.45) {
				dogState = 'wander';
				var t = randomWanderPoint();
				targetX = t.x; targetY = t.y;
			} else if (roll < 0.8) {
				dogState = 'chase';
				stateUntil = performance.now() + 2000 + Math.random() * 1500;
			} else {
				dogState = 'nap';
				stateUntil = performance.now() + 3000 + Math.random() * 3000;
			}
		}

		function stepToward(tx, ty, speed, dt) {
			var dx = tx - dogX, dy = ty - dogY;
			var dist = Math.hypot(dx, dy);
			if (dist < ARRIVE_DIST) return true;
			var step = speed * dt;
			if (step >= dist) { dogX = tx; dogY = ty; } else { dogX += (dx / dist) * step; dogY += (dy / dist) * step; }
			if (Math.abs(dx) > 1) dogFacing = dx < 0 ? -1 : 1;
			return false;
		}

		function spawnDirtKick() {
			dirtKick.style.left = dragToX + 'px';
			dirtKick.style.top = dragToY + 'px';
			dirtKick.classList.remove('is-active');
			void dirtKick.offsetWidth;
			dirtKick.classList.add('is-active');
		}

		function unbury() {
			if (!buried) return;
			buried = false;
			doghouse.classList.remove('is-buried');
			bone.classList.remove('is-hidden');
			bone.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%) rotate(45deg)';
		}

		window.addEventListener('mousemove', function (e) {
			mouseX = e.clientX;
			mouseY = e.clientY;
			lastMoveTime = performance.now();
			if (buried) unbury();
			if (dogState === 'seek') {
				dogState = 'chase';
				stateUntil = performance.now() + 2000;
			}
			if (dogState !== 'drag' && dogState !== 'bury') {
				bone.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%) rotate(45deg)';
			}
		});

		function tick(now) {
			var dt = Math.min((now - lastFrame) / 1000, 0.05);
			lastFrame = now;

			if (!buried && !window.__lawnGamePlaying &&
				(dogState === 'wander' || dogState === 'chase' || dogState === 'nap') &&
				now - lastMoveTime > IDLE_BURY_MS) {
				dogState = 'seek';
				idleBoneX = mouseX;
				idleBoneY = mouseY;
			}

			var arrived;
			switch (dogState) {
				case 'wander':
					if (stepToward(targetX, targetY, WALK_SPEED, dt)) decideNext();
					break;
				case 'chase':
					arrived = stepToward(mouseX, mouseY, WALK_SPEED, dt);
					if (arrived || now > stateUntil) decideNext();
					break;
				case 'nap':
					if (now > stateUntil) decideNext();
					break;
				case 'seek':
					if (stepToward(idleBoneX, idleBoneY, RUN_SPEED, dt)) {
						dogState = 'drag';
						dragFromX = dogX; dragFromY = dogY;
						dragStart = now;
						var hp = doghousePos();
						dragToX = hp.x; dragToY = hp.y;
					}
					break;
				case 'drag':
					var dragT = Math.min((now - dragStart) / DRAG_DURATION, 1);
					var dragE = easeOutQuad(dragT);
					var prevDogX = dogX;
					dogX = dragFromX + (dragToX - dragFromX) * dragE;
					dogY = dragFromY + (dragToY - dragFromY) * dragE;
					if (Math.abs(dogX - prevDogX) > 0.05) dogFacing = dogX < prevDogX ? -1 : 1;
					bone.style.transform = 'translate(' + (dogX - dogFacing * 9) + 'px,' + (dogY + 1) + 'px) translate(-50%,-50%) rotate(' + (dogFacing * 20) + 'deg)';
					if (dragT >= 1) {
						dogState = 'bury';
						buryStart = now;
						spawnDirtKick();
					}
					break;
				case 'bury':
					if (now - buryStart > BURY_DURATION) {
						buried = true;
						bone.classList.add('is-hidden');
						doghouse.classList.add('is-buried');
						dogState = 'flee';
						var t2 = randomWanderPoint();
						targetX = t2.x; targetY = t2.y;
					}
					break;
				case 'flee':
					if (stepToward(targetX, targetY, RUN_SPEED, dt)) decideNext();
					break;
			}

			dog.className = 'dog-sprite is-' + dogState;
			dog.style.transform = 'translate(' + dogX + 'px,' + dogY + 'px) translate(-50%,-50%) scaleX(' + dogFacing + ')';

			requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	}

	/* ---------- magnetic buttons ---------- */

	if (fine) {
		document.querySelectorAll('.magnetic').forEach(function (el) {
			el.addEventListener('mousemove', function (e) {
				var rect = el.getBoundingClientRect();
				var x = e.clientX - rect.left - rect.width / 2;
				var y = e.clientY - rect.top - rect.height / 2;
				el.style.transform = 'translate(' + (x * 0.25) + 'px,' + (y * 0.35) + 'px)';
			});
			el.addEventListener('mouseleave', function () {
				el.style.transform = 'translate(0,0)';
			});
		});
	}

	var yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
