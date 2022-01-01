const jscad = require('@jscad/modeling');
const { translate, rotateY, translateZ } = jscad.transforms;
const { colorize } = jscad.colors;

const {getExtrusion} = require("./parts/extrusions");
const {getCarriage} = require("./prints/carriage");
const { main: v1 } = require("./index");

const vWheelColors = [
	[.8, .8, .8, .9], // wheel
	[.8, .8, .8], // bolt
	// [.7, .7, .7], // spacer
	[.3, .3, .3], // nut
];
const carriageWheelColors = [
	...vWheelColors, // X left bottom v wheel

	...vWheelColors, // X right bottom v wheel
	...vWheelColors, // X middle v wheel

	...vWheelColors, // Z top left v wheel
	...vWheelColors, // Z bottom left v wheel
	...vWheelColors, // Z top right v wheel
	...vWheelColors, // Z bottom right v wheel
];
const carriageColors = [
	...carriageWheelColors,
	[1, .55, .2, .8], // [.7, .7, .7], // carriage
];

const colors = [
	...carriageColors,
	[.15,.15,.15],
	[.15,.15,.15],
];

const main = () => {
	const spacing = 3;
	const axisCenter = 10 + spacing / 2;
	const wheelPositions = [
		{ translation: [-45, -axisCenter, -20], rotation: -1.5707963267948966 },
		{ translation: [45, -axisCenter, -20], rotation: -1.5707963267948966 },
		{ translation: [0, -axisCenter, 20], rotation: -1.5707963267948966 },
		{ translation: [-30, axisCenter, 40], rotation: 1.5707963267948966 },
		{ translation: [-30, axisCenter, -40], rotation: 1.5707963267948966 },
		{ translation: [30, axisCenter, 40], rotation: 1.5707963267948966 },
		{ translation: [30, axisCenter, -40], rotation: 1.5707963267948966 },
	];

	return translateZ(100, [
		...getCarriage(wheelPositions, spacing),
		translate([-50, -axisCenter, 0], rotateY(Math.PI / 2, getExtrusion(100, 20, 20))),
		translate([0, axisCenter, -50], getExtrusion(100, 20, 40)),
	])
	.map((object, index) => {
		return object.color ? object : colorize(colors[index] || [.0, .0, .0,], object)
	});
}

module.exports = { main }
