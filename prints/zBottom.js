const jscad = require('@jscad/modeling');
const {nema17dimensions} = require('../parts/electronics/motors');
const {BOLT_TYPES, getBolt} = require('../parts/bolts');

const {
	translate, translateZ,
	rotateZ, rotateX,
	mirror
} = jscad.transforms;

const { cuboid, cylinder } = jscad.primitives;
const { union, subtract } = jscad.booleans;

const motorBracketThickness = 5;

const getMotorPlate = (pulleyPosition, nema17dimensions) => {
	const plateSize = nema17dimensions.width;
	const boltSpread = nema17dimensions.boltSpacing / 2
	const { BOLT_TYPES } = require('../parts/bolts');

	const holes = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
	const thickness = motorBracketThickness;
	const boltSpacing = .3;

	return rotateX(Math.PI / 2,  translateZ(pulleyPosition - (thickness) / 2,
		subtract(
			cuboid({ size: [plateSize + 18, plateSize, thickness], center: [2.63, 0, 0] }),
			union(
				...holes.map(([x,y]) => cylinder({ radius: (BOLT_TYPES.M3 + boltSpacing) / 2, height: thickness, center: [x * boltSpread, y * boltSpread, 0] })),
				cylinder({ radius: 26  / 2, height: thickness }),
			)
		)
	));
}

const getMotorBracket = (motorPositions, distanceToPSU, zAxisProfile) => {
	const { nema17dimensions } = require('../parts/electronics/motors');
	const { getBolt, BOLT_TYPES } = require('../parts/bolts');

	const motorPlate = translate(motorPositions[0].translation, rotateZ( motorPositions[0].rotation, getMotorPlate(motorPositions[0].pulleyPosition, nema17dimensions)));
	const motorPlates = [
		motorPlate,
		mirror({origin: [0, 0, 0], normal: [1, 0, 0]}, motorPlate),
	];

	const boltLength = 12;
	const boltBottomZ = motorPositions[0].translation[2] * 2 / 4;
	const boltTopZ = boltBottomZ * 3;
	const M5BoltNegative = translateZ((zAxisProfile.depth + boltLength) / 2 - 5, getBolt(BOLT_TYPES.M5 + .5, boltLength, { diameter: 9, height: 20 }));
	const M5Bolt = translateZ((zAxisProfile.depth + boltLength) / 2 - 5, getBolt(BOLT_TYPES.M5, boltLength, { diameter: 8.4, height: 5 }));
	const M4Bolt = getBolt(BOLT_TYPES.M4, 8, { height: 4, diameter: 7});
	const M4BoltNegative = getBolt(BOLT_TYPES.M4 + .5, 8, { height: 4, diameter: 7});
	const PSUPlateThickness = 6;
	const backPlateThickness = 5;
	const PSUBoltPos = {
		x: 215 / 2 - 31.2 - BOLT_TYPES.M4 / 2,
		y: -(distanceToPSU.y + 8 / 2 - (PSUPlateThickness - 4)),
		z: 30 - 16.5 - BOLT_TYPES.M4 / 2
	};
	return [
		subtract(
			union(
				motorPlates,
				cuboid({ size: [69.87, backPlateThickness, nema17dimensions.width], center: [0, distanceToPSU.y - backPlateThickness / 2, motorPositions[0].translation[2]] }),
				cuboid({ size: [34, (distanceToPSU.y - backPlateThickness - 10), nema17dimensions.width], center: [0, zAxisProfile.depth / 2 + (distanceToPSU.y - backPlateThickness - zAxisProfile.depth / 2) / 2, motorPositions[0].translation[2]] }),

				cuboid({ size: [180, PSUPlateThickness, nema17dimensions.width], center: [-distanceToPSU.x, -(distanceToPSU.y - PSUPlateThickness / 2), motorPositions[0].translation[2]] }),
				cuboid({ size: [34, (distanceToPSU.y - PSUPlateThickness - zAxisProfile.depth / 2), nema17dimensions.width], center: [0, -(zAxisProfile.depth / 2 + (distanceToPSU.y - PSUPlateThickness - zAxisProfile.depth / 2) / 2), motorPositions[0].translation[2]] }),

				zAxisProfile.threads.map(({x}) => [1, -1].map(ySide =>
					translate([x, ySide * zAxisProfile.depth / 2, motorPositions[0].translation[2]], rotateZ(Math.PI / 4, cuboid({ size: [6.6, 6.6, nema17dimensions.width] }))),
				)),
			),
			cuboid({ size: [40, 18, nema17dimensions.width], center: [0, 0, motorPositions[0].translation[2]] }),

			zAxisProfile.threads.map(({x}) => [boltBottomZ, boltTopZ].map(z => [1, -1].map(rotation =>
				translate([x, 0, z], rotateX(rotation * Math.PI / 2, M5BoltNegative)),
			))),

			[1, -1].map(x =>
				translate(
					[x * PSUBoltPos.x - distanceToPSU.x, PSUBoltPos.y, PSUBoltPos.z],
					rotateX(-Math.PI / 2, M4BoltNegative)
				),
			),
		),

		zAxisProfile.threads.map(({x}) => [boltBottomZ, boltTopZ].map(z => [1, -1].map(rotation =>
			translate([x, 0, z], rotateX(rotation * Math.PI / 2, M5Bolt)),
		))),

		[1, -1].map(x =>
			translate(
				[x * PSUBoltPos.x - distanceToPSU.x, PSUBoltPos.y, PSUBoltPos.z],
				rotateX(-Math.PI / 2, M4Bolt)
			),
		),

		// translate([-(215 / 2 - 31.2 - BOLT_TYPES.M4 / 2), -((115 - 8) / 2 + 8 - 4), 30 / 2 - 16.5 - BOLT_TYPES.M4 / 2], rotateX(-Math.PI / 2, getBolt(BOLT_TYPES.M4, 8, { height: 4, diameter: 7}))),
		// translate([(215 / 2 - 31.2 - BOLT_TYPES.M4 / 2), -((115 - 8) / 2 + 8 - 4), 30 / 2 - 16.5 - BOLT_TYPES.M4 / 2], rotateX(-Math.PI / 2, getBolt(BOLT_TYPES.M4, 8, { height: 4, diameter: 7}))),
	];
};

module.exports = {
	getMotorBracket,
	motorBracketThickness,
}

/*
TODO:
- teardrop holes
- z-axis spacing
- rounding
- motor cable clips
- endstop mount
- psu z-offset
- bed pivot
- pulley set-screw hole
- less angle for more motor tightening room
-

 */
