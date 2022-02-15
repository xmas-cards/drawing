class Drawing {
	constructor(element, settings = {}) {
		this.element = element;
		this.settings = {
			// settings.colors - the colors available in the toolbar
			colors: {
				options:
					settings.colors && settings.colors.options
						? settings.colors.options
						: [
								{ color: "#f03", name: "red" },
								{ color: "#fa0", name: "orange" },
								{ color: "#fe2", name: "yellow" },
								{ color: "#2e0", name: "green" },
								{ color: "#0de", name: "light blue" },
								{ color: "#017", name: "dark blue" },
								{ color: "#c6f", name: "purple" },
								{ color: "#f6c", name: "pink" },
								{ color: "#fff", name: "white" },
								{ color: "#aaa", name: "light grey" },
								{ color: "#555", name: "dark grey" },
								{ color: "#000", name: "black" },
								{ color: "#730", name: "brown" },
						  ],
				default: settings.colors && settings.colors.default ? settings.colors.default : "#0a0a0a",
			}, // settings.thickness - the thickness of the pen available, controls its limits
			thickness: {
				min: settings.thickness && settings.thickness.min ? settings.thickness.min : 1,
				max: settings.thickness && settings.thickness.max ? settings.thickness.max : 100,
				default: settings.thickness && settings.thickness.default ? settings.thickness.default : 20,
			},
			// settings.canvas - the size of the canvas, and its background
			canvas: {
				x: settings.canvas && settings.canvas.x ? settings.canvas.x : 800,
				y: settings.canvas && settings.canvas.y ? settings.canvas.y : 800,
				background: settings.canvas && settings.canvas.background ? settings.canvas.background : "#ffffff",
			},
			// settings.events - events that can happen
			events: {
				draw: settings.events && settings.events.draw ? settings.events.draw : function () {},
				edit: settings.events && settings.events.edit ? settings.events.edit : function () {},
				colorChange: settings.events && settings.events.colorChange ? settings.events.colorChange : function () {},
				thicknessChange: settings.events && settings.events.thicknessChange ? settings.events.thicknessChange : function () {},
			},
		};
		this.currentColor = this.settings.colors.default;
		this.currentThickness = this.settings.thickness.default;
		this.lastMousePosition = {};
		this.history = [];
		this.currentHistoryIndex = -1;
	}

	create() {
		this.element.innerHTML = "";

		var canvas = document.createElement("canvas");
		canvas.width = this.settings.canvas.x;
		canvas.height = this.settings.canvas.y;
		this.element.appendChild(canvas);

		var ctx = canvas.getContext("2d");

		ctx.fillStyle = this.settings.canvas.background;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		canvas.onclick = () => {
			var x = getMouseX(event.clientX),
				y = getMouseY(event.clientY);

			ctx.strokeStyle = this.currentColor;
			ctx.lineWidth = this.currentThickness;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + 0.1, y + 0.1);
			ctx.stroke();

			this.settings.events.edit();
			this.settings.events.draw();

			this.addToHistory();
		};
		canvas.onmousedown = () => {
			canvas.onmousemove = (event) => {
				document.body.style.userSelect = "none"; // prevents click-and-drag selection while drawing

				var newX = getMouseX(event.clientX),
					newY = getMouseY(event.clientY),
					oldX = this.lastMousePosition.x || getMouseX(event.clientX),
					oldY = this.lastMousePosition.y || getMouseY(event.clientY);

				ctx.strokeStyle = this.currentColor;
				ctx.lineWidth = this.currentThickness;
				ctx.lineCap = "round";
				ctx.lineJoin = "round";

				ctx.beginPath();
				ctx.moveTo(oldX, oldY);
				ctx.lineTo(newX, newY);
				ctx.stroke();

				this.lastMousePosition.x = newX;
				this.lastMousePosition.y = newY;
				this.settings.events.draw();
			};
		};
		canvas.onmouseup = () => {
			delete this.lastMousePosition.x;
			delete this.lastMousePosition.y;
			document.body.style.userSelect = "text";
			this.settings.events.edit();
			canvas.onmousemove = function () {};
		};

		this.canvasElement = canvas;
		this.addToHistory();

		function getMouseX(clientX) {
			var viewportOffset = canvas.getBoundingClientRect();
			var pixelsFromLeft = viewportOffset.left;
			var width = viewportOffset.width;
			return ((clientX - pixelsFromLeft) / width) * canvas.width;
		}
		function getMouseY(clientY) {
			var viewportOffset = canvas.getBoundingClientRect();
			var pixelsFromTop = viewportOffset.top;
			var height = viewportOffset.height;
			return ((clientY - pixelsFromTop) / height) * canvas.height;
		}

		this.createToolbar();

		document.body.addEventListener("keyup", (event) => {
			if (event.ctrlKey && event.key == "z") {
				this.undo();
			}
			if (event.ctrlKey && event.key == "y") {
				this.redo();
			}
		});
	}

	addToHistory() {
		if (this.currentHistoryIndex != this.history.length) {
			// remove all undone edits after current
			this.history.length = this.currentHistoryIndex + 1;
		}
		this.history.push(this.export());
		this.currentHistoryIndex++;
	}
	undo() {
		if (this.currentHistoryIndex - 1 >= 0) {
			this.currentHistoryIndex--;
			this.import(this.history[this.currentHistoryIndex], false);
		}
		this.settings.events.edit();
	}
	redo() {
		if (this.currentHistoryIndex + 1 < this.history.length) {
			this.currentHistoryIndex++;
			this.import(this.history[this.currentHistoryIndex], false);
		}
		this.settings.events.edit();
	}

	createToolbar() {
		if (this.element.querySelectorAll(".drawing-toolbar").length === 0) {
			var toolbar = document.createElement("div");
			toolbar.classList.add("drawing-toolbar");
			this.element.appendChild(toolbar);
		} else {
			var toolbar = this.element.querySelector(".drawing-toolbar");
			toolbar.innerHTML = "";
		}

		var optionChoice = document.createElement("div");
		optionChoice.classList.add("drawing-toolbar-options");
		toolbar.appendChild(optionChoice);

		/* Thickness */
		var thicknessLabel = document.createElement("label");
		thicknessLabel.innerText = "Thickness";
		optionChoice.appendChild(thicknessLabel);
		var thicknessSlider = document.createElement("input");
		thicknessSlider.type = "range";
		thicknessSlider.min = this.settings.thickness.min;
		thicknessSlider.max = this.settings.thickness.max;
		thicknessSlider.value = this.settings.thickness.default;
		thicknessSlider.oninput = (event) => {
			this.currentThickness = event.target.value;
			this.settings.events.thicknessChange();
		};
		optionChoice.appendChild(thicknessSlider);

		var colorChoice = document.createElement("div");
		colorChoice.classList.add("drawing-toolbar-colors");
		toolbar.appendChild(colorChoice);

		for (var i = 0; i < this.settings.colors.options.length; i++) {
			var color = this.settings.colors.options[i].color;
			var text = this.settings.colors.options[i].name;
			var button = document.createElement("button");
			button.dataset.color = color;

			if (this.currentColor == color) {
				button.classList.add("drawing-toolbar-color-selected");
			}

			button.onclick = (event) => {
				this.currentColor = event.target.dataset.color;
				this.settings.events.colorChange();

				var buttons = colorChoice.querySelectorAll("button");
				for (var i = 0; i < buttons.length; i++) {
					buttons[i].classList.remove("drawing-toolbar-color-selected");
				}
				event.target.classList.add("drawing-toolbar-color-selected");
			};
			button.classList.add("drawing-toolbar-color");
			button.style.background = color;
			button.innerText = text;
			button.title = text;
			colorChoice.appendChild(button);
		}

		var token = Math.random().toString(36).substr(2, 5);
		var colorInputLabel = document.createElement("label");
		colorInputLabel.setAttribute("for", "drawing-toolbar-color-picker-" + token);
		colorInputLabel.innerText = "Color picker";
		colorChoice.appendChild(colorInputLabel);
		var colorInput = document.createElement("input");
		colorInput.type = "color";
		colorInput.oninput = (event) => {
			this.currentColor = event.target.value;
			this.settings.events.colorChange();

			var buttons = colorChoice.querySelectorAll("button");
			for (var i = 0; i < buttons.length; i++) {
				buttons[i].classList.remove("drawing-toolbar-color-selected");
			}
			event.target.classList.add("drawing-toolbar-color-selected");
		};
		colorInput.classList.add("drawing-toolbar-color", "drawing-toolbar-color-picker");
		colorInput.title = "Custom colour";
		colorInput.id = "drawing-toolbar-color-picker-" + token;
		colorChoice.appendChild(colorInput);
	}

	import(url, addToHistory = true) {
		var ctx = this.canvasElement.getContext("2d");
		var image = new Image();
		image.src = url;
		image.onload = () => {
			ctx.drawImage(image, 0, 0, this.settings.canvas.x, this.settings.canvas.y);
			this.settings.events.edit();
			if (addToHistory) {
				this.addToHistory();
			}
		};
	}

	export() {
		return this.canvasElement.toDataURL();
	}
}
