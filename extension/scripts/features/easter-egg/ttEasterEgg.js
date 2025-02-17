"use strict";
(async () => {
	const year = new Date().getUTCFullYear();
	const now = Date.now();

	if (Date.UTC(year, 3, 5, 12) > now || Date.UTC(year, 3, 25, 12) < now) return;

	featureManager.registerFeature("Easter Eggs", "event", () => settings.pages.competitions.easterEggs, initialiseDetector, enableDetector, null, null, null);

	const EGG_SELECTOR = "img[src^='competition.php?c=EasterEggs'][src*='step=eggImage'][src*='access_token=']";

	function initialiseDetector() {
		const container = document.find("#mainContainer");

		if (container) {
			new MutationObserver((mutations, observer) => {
				for (const node of mutations.flatMap((mutation) => [...mutation.addedNodes])) {
					if (node.nodeType !== Node.ELEMENT_NODE || !node.find(EGG_SELECTOR)) continue;

					highlightEgg(node.find(EGG_SELECTOR));
					observer.disconnect();
					break;
				}
			}).observe(container, { childList: true });
		}
	}

	function enableDetector() {
		document.body.classList.add("tt-easter-highlight");

		for (const egg of document.findAll(EGG_SELECTOR)) {
			highlightEgg(egg);
		}
	}

	function highlightEgg(egg) {
		// Make sure the egg has been loaded.
		if (!egg.complete) {
			egg.addEventListener("load", () => highlightEgg(egg));
			return;
		}

		if (!isVisible(egg)) {
			console.log("TT detected an hidden egg", egg);
			egg.classList.add("hidden-egg");
			return;
		}

		document.find(".tt-overlay").classList.remove("tt-hidden");

		const locationText = calculateLocation(egg);

		const popup = document.newElement({
			type: "div",
			id: "tt-easter-popup",
			class: "tt-overlay-item",
			events: { click: removePopup },
			children: [
				document.newElement({ type: "div", text: "Detected an easter egg!" }),
				document.newElement({ type: "div", text: `It's located near the ${locationText} of your screen.` }),
				document.newElement({
					type: "div",
					text: "NOTE: Clicking on invisible eggs is a bad idea. It will decrease your spawn rates going forward. We try to detect and ignore them, occasionally one might still be highlighted.",
				}),
				document.newElement({ type: "button", class: "tt-button-link", text: "Close" }),
			],
		});

		document.body.appendChild(popup);

		window.addEventListener("beforeunload", (event) => {
			if (egg.isConnected) {
				event.preventDefault();
				event.returnValue = "Egg present.";
			}
		});

		function removePopup() {
			document.find(".tt-overlay").classList.add("tt-hidden");
			popup.remove();
		}
	}

	function isVisible(egg) {
		const canvas = document.newElement({ type: "canvas", attributes: { width: egg.width, height: egg.height } });
		const context = canvas.getContext("2d");
		context.drawImage(egg, 0, 0);

		const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

		// total pixels 	= 1520
		// 0				= 868
		// not 0			= 652

		// 0 means it's transparent, not having any other pixels means it's completely hidden
		return data.some((d) => d !== 0);
	}

	function calculateLocation(element) {
		const { left, top, width, height } = element.getBoundingClientRect();

		const centerX = left + width / 2;
		const centerY = top + height / 2;

		const innerHeight = window.innerHeight;
		const innerWidth = window.innerWidth;

		const relativeHeight = centerY / innerHeight;
		const relativeWidth = centerX / innerWidth;

		let verticalText, horizontalText;

		if (relativeHeight < 0.25) verticalText = "top";
		else if (relativeHeight > 0.75) verticalText = "bottom";
		else verticalText = "center";

		if (relativeWidth < 0.3) horizontalText = "left";
		else if (relativeWidth > 0.7) horizontalText = "right";
		else horizontalText = "center";

		let text;
		if (verticalText === horizontalText) text = verticalText;
		else text = `${verticalText} ${horizontalText}`;

		if (relativeWidth > 1 || relativeWidth < 0 || relativeHeight > 1 || relativeHeight < 0) text += " (offscreen)";

		return text;
	}
})();
