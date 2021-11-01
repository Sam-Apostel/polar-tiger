const jscad = require('@jscad/modeling');
const {
	translate, translateZ,
	rotateY,
} = jscad.transforms;
const { cuboid, cylinder, cylinderElliptic } = jscad.primitives;
const { union, subtract } = jscad.booleans;
const { colorize } = jscad.colors;

const colors = [
	[1, .55, .2], // nozzle
	[.15, .15, .15], // hotend
	[.15, .15, .15], // cold end
	[.55, .55, .55], // nut
	[.15, .15, .15], // fan
	[.15, .15, .15, .8], // fan blades
];

const main = ({ nutOffset }) => {
	const nozzle = union(
		translateZ(2.74 / 2, cylinderElliptic({ height: 2.74, startRadius: [.35, .35], endRadius: [2.235, 2.235] })),
		translateZ(2.74 + 5 / 2, cylinder({height: 5, radius: 5.054})),
		translateZ(2.74 + (5 + (5 - 4.77)) / 2, cylinder({height: 4.77, radius: 6.65})),
		translateZ(2.74 + 5 + 12.92 / 2, cylinder({height: 12.92, radius: 3.015})),
		translateZ(2.74 + 5 + 12.92 + 22.09 / 2, cylinder({height: 22.09, radius: 1.265})),
	);
	const heaterBlock = union(
		translateZ(8.28 + 12.92 / 2, cylinder({height: 12.92, radius: 8.225})),
	);

	const coldSideHeight = 2.74 + 5 + 12.92 + 3.6;
	const nut = translateZ(coldSideHeight + .76 + 25.29 + .84 + nutOffset + 5.13 / 2, cylinder({height: 5.13, radius: 9.53, segments: 6}));
	const fan = translate([13, 0, coldSideHeight + .76 + 22 / 2], [
		subtract(
			cuboid({size: [5, 22, 22]}),
			rotateY(Math.PI / 2, cylinder({height: 5, radius: 10.3}))
		),
		rotateY(Math.PI / 2, cylinder({height: 5, radius: 10}))
	]);
	const coldSide = union(
		translateZ(coldSideHeight + 26.88 / 2, cylinder({height: 26.88, radius: 3.815})),

		[...new Array(11)].map((_, fin) => translateZ(coldSideHeight + .76 + ((25.29) / 12 * fin) + .84 / 2, cylinder({height: 0.84, radius: 10.485}))),

		translateZ(coldSideHeight + .76 + ((25.29) / 12 * 11) + .84 / 2, cylinder({height: 0.84, radius: 8.065})),
		translateZ(coldSideHeight + .76 + ((25.29) / 12 * 12) + .84 / 2, cylinder({height: 0.84, radius: 8.065})),

		translateZ(coldSideHeight + .76 + 25.29 + .84 + 1.09 / 2, cylinder({height: 1.09, radius: 6})),
		translateZ(coldSideHeight + .76 + 25.29 + .84 + 1.09 + 1.09 / 2, cylinder({height: 1.09, radius: 5.135})),
		translateZ(coldSideHeight + .76 + 25.29 + .84 + 1.09 + 1.09 + 7.64 / 2, cylinder({height: 7.64, radius: 6})),
		translateZ(coldSideHeight + .76 + 25.29 + .84 + 1.09 + 1.09 + 7.64 + 1.09 / 2, cylinder({height: 1.09, radius: 2.19})),
		translateZ(coldSideHeight + .76 + 25.29 + .84 + 1.09 + 1.09 + 7.64 + 1.09 + 1.09 / 2, cylinder({height: 1.09, radius: 3.515})),
	);


	return [
		nozzle,
		heaterBlock,
		coldSide,
		nut,
		...fan,
	].map((object, index) => colorize(colors[index] || [.0, .0, .0,], object));
};

const getParameterDefinitions = () => {
	return [

		{ name: 'nutOffset', type: 'number', initial: 3.7, min: 0, max: 4.6, step: .2, caption: 'Nut position' },
	]
};

module.exports = { revo: { getGeometry: main, colors }, main, getParameterDefinitions }
