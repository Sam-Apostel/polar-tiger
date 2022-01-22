const jscad = require('@jscad/modeling');
const {nema17dimensions} = require('../parts/electronics/motors');

const {
	translate, translateZ,
	rotateZ, rotateX,
	mirror
} = jscad.transforms;

const { cuboid, cylinder } = jscad.primitives;
const { union, subtract } = jscad.booleans;
const { degToRad } = jscad.utils;

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

const getMotorBracket = (motorPositions, distanceToPSU, zAxisProfile, PSUPlateThickness) => {
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
	const backPlateThickness = 5;
	const PSUBoltPos = {
		x: 215 / 2 - 31.2 - BOLT_TYPES.M4 / 2,
		y: -(distanceToPSU.y + 8 / 2 - (PSUPlateThickness - 4)),
		z: 30 - 16.5 - BOLT_TYPES.M4 / 2 + 1.5
	};

	const getEndStop = () => {
		return [
			cuboid({ size: [6.6, 20, 10.5]}),
			translate([0, -16.5 / 2, 10.5 / 2], rotateX(degToRad(15), cuboid({ size: [4, 16.5, .4], center: [0, 16.5 / 2, 0] })))
		];
	}

	return [
		subtract(
			union(
				motorPlates,
				cuboid({ size: [73, backPlateThickness, nema17dimensions.width], center: [0, 30 - backPlateThickness / 2, motorPositions[0].translation[2]] }),
				cuboid({ size: [34, (30 - backPlateThickness - zAxisProfile.depth / 2), nema17dimensions.width], center: [0, zAxisProfile.depth / 2 + (30 - backPlateThickness - zAxisProfile.depth / 2) / 2, motorPositions[0].translation[2]] }),

				cuboid({ size: [180, PSUPlateThickness, nema17dimensions.width], center: [-distanceToPSU.x, -(distanceToPSU.y - PSUPlateThickness / 2), motorPositions[0].translation[2]] }),
				cuboid({ size: [34, (distanceToPSU.y - PSUPlateThickness - zAxisProfile.depth / 2), nema17dimensions.width], center: [0, -(zAxisProfile.depth / 2 + (distanceToPSU.y - PSUPlateThickness - zAxisProfile.depth / 2) / 2), motorPositions[0].translation[2]] }),

				zAxisProfile.threads.map(({x}) => [1, -1].map(ySide =>
					translate([x, ySide * zAxisProfile.depth / 2, motorPositions[0].translation[2]], rotateZ(Math.PI / 4, cuboid({ size: [6.2, 6.2, nema17dimensions.width] }))),
				)),
			),
			cuboid({ size: [40, 18.5, nema17dimensions.width], center: [0, 0, motorPositions[0].translation[2]] }),

			zAxisProfile.threads.map(({x}) => [boltBottomZ, boltTopZ].map(z => [1, -1].map(rotation =>
				translate([x, 0, z], rotateX(rotation * Math.PI / 2, M5BoltNegative)),
			))),

			[1, -1].map(x =>
				translate(
					[x * PSUBoltPos.x - distanceToPSU.x, PSUBoltPos.y, PSUBoltPos.z],
					rotateX(-Math.PI / 2, M4BoltNegative)
				),
			),
			translate([0, 20, nema17dimensions.width - 15 / 2], cuboid({ size: [6.6 + .4, 20 + .4, 15]}),),
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
		translate([0, 20, nema17dimensions.width - 9.5 / 2], getEndStop()),
	];
};

module.exports = {
	getMotorBracket,
	motorBracketThickness,
}

/*
TODO:
	teardrop holes
	z-axis spacing
	rounding
	motor cable clips
	bed pivot

 */
