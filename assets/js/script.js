(function () {
	'use strict';

	var root = document.documentElement;
	var body = document.body;
	var fine = window.matchMedia('(pointer: fine)').matches;

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

	/* ---------- education card: claw drag-in ---------- */

	var clawStage = document.getElementById('claw-stage');
	var eduCard = document.getElementById('edu-card');
	var clawHand = document.getElementById('claw-hand');
	var clawMarks = document.getElementById('claw-marks');

	if (clawStage && eduCard && clawHand && clawMarks) {
		var clawEls = [eduCard, clawHand, clawMarks];

		var playClaw = function () {
			clawEls.forEach(function (el) { el.classList.remove('claw-enter'); });
			// force reflow so the animation can restart
			void eduCard.offsetWidth;
			clawEls.forEach(function (el) { el.classList.add('claw-enter'); });
		};

		if ('IntersectionObserver' in window) {
			var clawObserver = new IntersectionObserver(function (entries, obs) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						playClaw();
						obs.unobserve(entry.target);
					}
				});
			}, { threshold: 0.3 });
			clawObserver.observe(clawStage);
		} else {
			playClaw();
		}

		eduCard.addEventListener('click', playClaw);
		eduCard.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ' ') {
				// let native <details>/<summary> toggling happen; only replay when the
				// click/press wasn't on the coursework toggle itself
				if (e.target.closest && e.target.closest('summary')) return;
				e.preventDefault();
				playClaw();
			}
		});
	}

	/* ---------- custom cursor: a dog chasing a bone (pointer: fine only) ---------- */

	if (fine) {
		body.classList.add('has-cursor', 'no-cursor');

		var ring = document.createElement('div');
		ring.className = 'cursor';
		ring.textContent = '🐕'; // 🐕
		var dot = document.createElement('div');
		dot.className = 'cursor-dot';
		dot.textContent = '🦴'; // 🦴
		body.appendChild(ring);
		body.appendChild(dot);

		var mouseX = -100, mouseY = -100;
		var ringX = -100, ringY = -100;
		var facing = 1;

		window.addEventListener('mousemove', function (e) {
			mouseX = e.clientX;
			mouseY = e.clientY;
			dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%) rotate(45deg)';
		});

		function animateRing() {
			var dx = mouseX - ringX;
			ringX += dx * 0.14;
			ringY += (mouseY - ringY) * 0.14;
			if (Math.abs(dx) > 1.5) facing = dx < 0 ? 1 : -1;
			ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%) scaleX(' + facing + ')';
			requestAnimationFrame(animateRing);
		}
		requestAnimationFrame(animateRing);

		var hoverTargets = document.querySelectorAll('a, button, .bracket-card, .tag, summary, .game-cell');
		hoverTargets.forEach(function (el) {
			el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
			el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
		});
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
