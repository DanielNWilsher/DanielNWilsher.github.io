(function () {
	'use strict';

	var root = document.documentElement;
	var themeToggle = document.getElementById('theme-toggle');
	var storedTheme = localStorage.getItem('theme');
	if (storedTheme) {
		root.setAttribute('data-theme', storedTheme);
	}

	if (themeToggle) {
		themeToggle.addEventListener('click', function () {
			var current = root.getAttribute('data-theme');
			var isLight = current === 'light' || (!current && window.matchMedia('(prefers-color-scheme: light)').matches);
			var next = isLight ? 'dark' : 'light';
			root.setAttribute('data-theme', next);
			localStorage.setItem('theme', next);
		});
	}

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

	var sections = document.querySelectorAll('main section[id]');
	var navAnchors = document.querySelectorAll('.nav-links a');

	if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
		var spyObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					var id = entry.target.getAttribute('id');
					navAnchors.forEach(function (a) {
						a.classList.toggle('active', a.getAttribute('href') === '#' + id);
					});
				}
			});
		}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

		sections.forEach(function (s) { spyObserver.observe(s); });
	}

	var revealEls = document.querySelectorAll('.reveal');

	if (revealEls.length && 'IntersectionObserver' in window) {
		var revealObserver = new IntersectionObserver(function (entries, obs) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('in-view');
					obs.unobserve(entry.target);
				}
			});
		}, { threshold: 0.15 });

		revealEls.forEach(function (el) { revealObserver.observe(el); });
	} else {
		revealEls.forEach(function (el) { el.classList.add('in-view'); });
	}

	var yearEl = document.getElementById('year');
	if (yearEl) {
		yearEl.textContent = new Date().getFullYear();
	}
})();
