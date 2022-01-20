const jscad = require('@jscad/modeling');
const {
	translate, translateZ, rotateZ, rotateX
} = jscad.transforms;
const { cuboid } = jscad.primitives;

const mainBoard = require('../../STLs/BTT_octopus_board.stl');
const {getBolt, BOLT_TYPES} = require('../bolts');

const getPSU = () => {
	const mountWallThickness = {
		front: 12.5,
		back: 8
	}
	return [
		translate([215 / 2 - 31.2 - BOLT_TYPES.M4 / 2, (115 - 12) / 2 + mountWallThickness.front - 4, 30 / 2 - 16.5 - BOLT_TYPES.M4 / 2], rotateX(-Math.PI / 2, getBolt(BOLT_TYPES.M4, 12, { height: 4, diameter: 7}))),
		translate([-(215 / 2 - 31.2 - BOLT_TYPES.M4 / 2), (115 - 12) / 2 + mountWallThickness.front - 4, 30 / 2 - 16.5 - BOLT_TYPES.M4 / 2], rotateX(-Math.PI / 2, getBolt(BOLT_TYPES.M4, 12, { height: 4, diameter: 7}))),
		// translate([-(215 / 2 - 31.2 - BOLT_TYPES.M4 / 2), -((115 - 8) / 2 + mountWallThickness.back - 4), 30 / 2 - 16.5 - BOLT_TYPES.M4 / 2], rotateX(Math.PI / 2, getBolt(BOLT_TYPES.M4, 8, { height: 4, diameter: 7}))),
		// translate([(215 / 2 - 31.2 - BOLT_TYPES.M4 / 2), -((115 - 8) / 2 + mountWallThickness.back - 4), 30 / 2 - 16.5 - BOLT_TYPES.M4 / 2], rotateX(Math.PI / 2, getBolt(BOLT_TYPES.M4, 8, { height: 4, diameter: 7}))),
		cuboid({size: [215, 115, 30]}),
	]
}

const getRaspberryPiZeroW = () => {
	return cuboid({size: [30, 65, 1.3]})
}

const getMainBoard = () => {
	// stl is inverted, invert function didn't work, so I did it myself.
	// not all the polygons are inverted, might need to set ranges that need to be inverted, not today though...
	const invertedBoard = {...mainBoard[0], polygons: mainBoard[0].polygons.map(({ vertices }) => ({ vertices: vertices.reverse() }))};
	return translateZ(-2, rotateZ(-Math.PI/2, (invertedBoard)));
};

const getElectronics = (center) => {
	const controlBox = [
		translateZ(30/2, getPSU()),
		translate([0, 7, 30 ], getMainBoard()),
		translate([-50, 0, 68], getRaspberryPiZeroW())
	];
	// return translate([center.x, center.y, 0], rotateZ(Math.PI / 2, controlBox));

	return translate([center.x + (340 - 12.5) - 215 / 2, center.y - (135 - 12.5) + 115 / 2, 0], rotateZ(Math.PI, controlBox));
}
//
// const getElectronics = (center) => {
// 	const controlBox = [
// 		translate([215 / 2 + 115 / 2 + 40, -115 / 2 - 10, 30/2], getPSU()),
// 		rotateZ(Math.PI / 2, [
// 			translate([(215 - 160) / 2, 0, 0 ], getMainBoard()),
// 			translate([-80, 0, 4], getRaspberryPiZeroW())
// 		])
// 	];
// 	return translate([center.x, center.y, 0], controlBox);
// }

module.exports = {
	 getElectronics
};


/*
TODO:
	hot shoe
	heater cartridge
	fan * 2
	thermistor
	distance
	controllers
	stepper drivers ( 5 ) x y z tool rotation
	AC relay ( 1 )
	laser driver ( 1 )
	fan controller ( 3 ) tool part internal
	heater cartridge ( 2 ) bed tool
	sensors
	camera ( 3 ) top bottom birdseye
	thermistor ( 2 ) bed tool
	distance sensor ( 3 ) x y z for closed loop
	ui
	display
	buttons
	rotary encoder
	io
	usb
	lan
	sd card
 */
