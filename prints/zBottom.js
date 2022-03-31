const jscad = require('@jscad/modeling');

const {
	translate, translateZ,
	rotateZ, rotateX, rotateY,
	mirror
} = jscad.transforms;

const { cuboid, cylinder, sphere } = jscad.primitives;
const { union, subtract, intersect } = jscad.booleans;
const { degToRad } = jscad.utils;

const motorBracketThickness = 5;
const m5ThreadedInsertRadius = 6.4 / 2;
const m3ThreadedInsertRadius = 4.1 / 2;

const getMotorPlate = (pulleyPosition, nema17dimensions, extraWidth, angle) => {
	const plateSize = nema17dimensions.width;
	const motorBoltSpread = nema17dimensions.boltSpacing / 2;
	const attachmentBoltSpread = nema17dimensions.width / 2 + extraWidth / 4;
	const { BOLT_TYPES } = require('../parts/bolts');

	const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
	const thickness = motorBracketThickness;
	const boltSpacing = .7;

	return rotateX(Math.PI / 2,  translateZ(pulleyPosition - thickness / 2,
		subtract(
			cuboid({ size: [plateSize + extraWidth, plateSize, thickness], center: [0, 0, 0] }),
			union(
				...corners.map(([x,y]) => cylinder({ radius: (BOLT_TYPES.M3 + boltSpacing) / 2, height: thickness, center: [x * motorBoltSpread, y * motorBoltSpread, 0] })),
				cylinder({ radius: 26  / 2, height: thickness }),
				...corners.map(([x,y]) => translate([x * attachmentBoltSpread, y * motorBoltSpread, 0], rotateY(x < 0 ? angle : 0, union(
					cylinder({ radius: (BOLT_TYPES.M3 + boltSpacing) / 2, height: 10 })
				)))),
			),
			translate([-(plateSize + extraWidth / 2) / 2, 0, thickness - 0.4], rotateY(angle, cuboid({ size: [extraWidth / 2, plateSize, thickness]})))
		)
	));
}

const getMotorPlateBoltCutter = (pulleyPosition, nema17dimensions, extraWidth, angle) => {
	const motorBoltSpread = nema17dimensions.boltSpacing / 2;
	const attachmentBoltSpread = nema17dimensions.width / 2 + extraWidth / 4;

	const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
	const thickness = motorBracketThickness;

	return rotateX(Math.PI / 2,  translateZ(pulleyPosition - thickness / 2,
		corners.map(([x,y]) => translate([x * attachmentBoltSpread, y * motorBoltSpread, 0], rotateY(x < 0 ? angle : 0,
			cylinder({ radius: m3ThreadedInsertRadius, height: 15, center: [0, 0, -(thickness + 9.5) / 2] }),
		)))
	));
}


const getMotorBracket = (motorPositions, distanceToPSU, zAxisProfile, PSUPlateThickness, bedCenter) => {
	const { nema17dimensions } = require('../parts/electronics/motors');
	const { getBolt, BOLT_TYPES } = require('../parts/bolts');

	const motorPlate = translate(motorPositions[0].translation, rotateZ( motorPositions[0].rotation, getMotorPlate(motorPositions[0].pulleyPosition, nema17dimensions, 19, -motorPositions[0].rotation - Math.PI / 2)));
	const motorPlates = intersect(
		union(
			motorPlate,
			mirror({origin: [0, 0, 0], normal: [1, 0, 0]}, motorPlate),
		),
		cuboid({ size: [200, (distanceToPSU.y - PSUPlateThickness) + 30, nema17dimensions.width], center: [0, -((distanceToPSU.y - PSUPlateThickness) + 30) / 2 + 30, motorPositions[0].translation[2]] }),
	);

	const boltLength = 12;
	const boltBottomZ = motorPositions[0].translation[2] * 2 / 4;
	const boltTopZ = boltBottomZ * 3;
	const M5BoltNegative = translateZ((zAxisProfile.depth + boltLength) / 2 - 5, getBolt(BOLT_TYPES.M5 + .5, boltLength, { diameter: 9.8, height: 20 }));
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

	const endstopNegative = translate([0, 20, nema17dimensions.width - 15 / 2],
		subtract(
			cuboid({ size: [6.6 + .4, 20 + .4, 15]}),
			sphere({ radius: 2.5 / 2 - .2, center: [(6.6 + .4 + .8) / 2, 20 / 2 - 3.85, 15 / 2 - 7.75] }),
			sphere({ radius: 2.5 / 2 - .2, center: [(6.6 + .4 + .8) / 2, -(20 / 2 - 3.85), 15 / 2 - 7.75] }),
			sphere({ radius: 2.5 / 2 - .2, center: [-(6.6 + .4 + .8) / 2, 20 / 2 - 3.85, 15 / 2 - 7.75] }),
			sphere({ radius: 2.5 / 2 - .2, center: [-(6.6 + .4 + .8) / 2, -(20 / 2 - 3.85), 15 / 2 - 7.75] }),
		)
	);




	const bedMount = subtract(
		cylinder({ radius:  12.5 / 2, height: nema17dimensions.width + zAxisProfile.bottomClearance, center: [bedCenter[0] + 135 - 12.5 / 2, bedCenter[1], motorPositions[0].translation[2] + zAxisProfile.bottomClearance / 2] }),
		cylinder({ radius: (BOLT_TYPES.M5 + .8) / 2, height: 30 - 8, center: [bedCenter[0] + 135 - 12.5 / 2, bedCenter[1],  nema17dimensions.width + zAxisProfile.bottomClearance - (30 - 8) / 2] }),
		cylinder({ radius: m5ThreadedInsertRadius, height: 10, center: [bedCenter[0] + 135 - 12.5 / 2, bedCenter[1],  nema17dimensions.width + zAxisProfile.bottomClearance - (30 - 8) + 10 / 2] }),
		cylinder({ radius: m5ThreadedInsertRadius + 1, height: nema17dimensions.width + zAxisProfile.bottomClearance - (30 - 8), center: [bedCenter[0] + 135 - 12.5 / 2, bedCenter[1], (nema17dimensions.width + zAxisProfile.bottomClearance - (30 - 8)) / 2] }),
	);

	const negativeMotorPlate = (() => {
		const motorPlate = translate(motorPositions[0].translation, rotateZ( motorPositions[0].rotation, getMotorPlate(motorPositions[0].pulleyPosition, nema17dimensions, 19, -motorPositions[0].rotation - Math.PI / 2)));
		const boltCutter = translate(motorPositions[0].translation, rotateZ( motorPositions[0].rotation, getMotorPlateBoltCutter(motorPositions[0].pulleyPosition, nema17dimensions, 19, -motorPositions[0].rotation - Math.PI / 2)));
		const doubleMirror = geom => union(geom, mirror({origin: [0, 0, 0], normal: [1, 0, 0]}, geom));
		return union(
			intersect(
				doubleMirror(motorPlate),
				cuboid({ size: [200, (distanceToPSU.y - PSUPlateThickness) + 30, nema17dimensions.width], center: [0, -((distanceToPSU.y - PSUPlateThickness) + 30) / 2 + 30, motorPositions[0].translation[2]] }),
			),
			doubleMirror(boltCutter)
		);
	})();

	const endstopPlate = subtract(
		union(
			cuboid({ size: [72, backPlateThickness, nema17dimensions.width], center: [0, 30 - backPlateThickness / 2, motorPositions[0].translation[2]] }),
			cuboid({ size: [12, 2.5, nema17dimensions.width], center: [(72 - 12) / 2, 30 - 2.5 / 2 - backPlateThickness, motorPositions[0].translation[2]] }),
			cuboid({ size: [12, 2.5, nema17dimensions.width], center: [-(72 - 12) / 2, 30 - 2.5 / 2 - backPlateThickness, motorPositions[0].translation[2]] }),
			cuboid({ size: [34, (30 - backPlateThickness - zAxisProfile.depth / 2), nema17dimensions.width], center: [0, zAxisProfile.depth / 2 + (30 - backPlateThickness - zAxisProfile.depth / 2) / 2, motorPositions[0].translation[2]] }),

			// extrusion flanges
			zAxisProfile.threads.map(({x}) => translate([x, 1 * zAxisProfile.depth / 2, motorPositions[0].translation[2]], rotateZ(Math.PI / 4,
				cuboid({ size: [6.2, 6.2, nema17dimensions.width] })
			))),
		),

		// cut off extrusion flanges
		cuboid({ size: [40, 18.5, nema17dimensions.width], center: [0, 0, motorPositions[0].translation[2]] }),

		// extrusion bolt holes
		zAxisProfile.threads.map(({x}) => [boltBottomZ, boltTopZ].map(z =>
			translate([x, 0, z], rotateX( Math.PI / -2, M5BoltNegative)),
		)),
		// endstop
		endstopNegative,

		negativeMotorPlate
	);

	const PSUPlate = subtract(
		union(
			cuboid({ size: [180, PSUPlateThickness, nema17dimensions.width], center: [-distanceToPSU.x, -(distanceToPSU.y - PSUPlateThickness / 2), motorPositions[0].translation[2]] }),

			translate(
				[motorPositions[0].translation[0], 0, motorPositions[0].translation[2]],
				rotateZ(
					motorPositions[0].rotation - Math.PI / 2,
					cuboid({
						size: [21, 6, nema17dimensions.width],
						center: [motorPositions[0].pulleyPosition - motorBracketThickness - 21 / 2, 27.5, 0]
					})
				)
			),

			translate(
				[motorPositions[1].translation[0], 0, motorPositions[1].translation[2]],
				rotateZ(
					motorPositions[1].rotation + Math.PI / 2,
					cuboid({
						size: [21, 6, nema17dimensions.width],
						center: [-(motorPositions[1].pulleyPosition - motorBracketThickness - 21 / 2), 27.5, 0]
					})
				)
			),

			cuboid({ size: [34, (distanceToPSU.y - PSUPlateThickness - zAxisProfile.depth / 2), nema17dimensions.width], center: [0, -(zAxisProfile.depth / 2 + (distanceToPSU.y - PSUPlateThickness - zAxisProfile.depth / 2) / 2), motorPositions[0].translation[2]] }),

			zAxisProfile.threads.map(({x}) =>
				translate([x, -1 * zAxisProfile.depth / 2, motorPositions[0].translation[2]], rotateZ(Math.PI / 4, cuboid({ size: [6.2, 6.2, nema17dimensions.width] }))),
			),
			bedMount,
			subtract(
				intersect(
					cuboid({ size: [15, distanceToPSU.y + bedCenter[1], nema17dimensions.width + zAxisProfile.bottomClearance], center: [bedCenter[0] + 135 - 12.5 / 2, (bedCenter[1] - distanceToPSU.y) / 2, (nema17dimensions.width + zAxisProfile.bottomClearance) / 2]}),
					subtract(
						cylinder({ radius: 135, height: nema17dimensions.width + zAxisProfile.bottomClearance, center: [bedCenter[0], bedCenter[1], (nema17dimensions.width + zAxisProfile.bottomClearance) / 2], segments: 256 }),
						cylinder({ radius: 135 - 12.5, height: nema17dimensions.width + zAxisProfile.bottomClearance, center: [bedCenter[0], bedCenter[1], (nema17dimensions.width + zAxisProfile.bottomClearance) / 2], segments: 256 }),
					)
				),
				cylinder({ radius:  12.5 / 2, height: nema17dimensions.width + zAxisProfile.bottomClearance, center: [bedCenter[0] + 135 - 12.5 / 2, bedCenter[1], motorPositions[0].translation[2] + zAxisProfile.bottomClearance / 2] }),
			)
		),
		cuboid({ size: [40, 18.5, nema17dimensions.width], center: [0, 0, motorPositions[0].translation[2]] }),

		zAxisProfile.threads.map(({x}) => [boltBottomZ, boltTopZ].map(z =>
			translate([x, 0, z], rotateX(Math.PI / 2, M5BoltNegative)),
		)),

		[1, -1].map(x =>
			translate(
				[x * PSUBoltPos.x - distanceToPSU.x, PSUBoltPos.y, PSUBoltPos.z],
				rotateX(-Math.PI / 2, M4BoltNegative)
			),
		),

		cuboid({ size: [3.5, PSUPlateThickness, 13], center: [(34 + 3.5) / 2, -(distanceToPSU.y - PSUPlateThickness / 2), nema17dimensions.width - 13 / 2] }),
		cuboid({ size: [3.5, PSUPlateThickness, 13], center: [-(34  + 3.5) / 2, -(distanceToPSU.y - PSUPlateThickness / 2), nema17dimensions.width - 13 / 2] }),

		[.5, -.5].map(x =>
			translate(
				[x * (160 + 10) - distanceToPSU.x, -distanceToPSU.y + PSUPlateThickness / 2 + 10 / 2, 36],
				rotateX(Math.PI / 2, cylinder({ radius: 4.1 / 2, height: PSUPlateThickness + 10 }))
			),
		),

		negativeMotorPlate
	);

	return [
		motorPlates,
		endstopPlate,
		PSUPlate,

		zAxisProfile.threads.map(({x}) => [boltBottomZ, boltTopZ].map(z => [1, -1].map(rotation =>
			translate([x, 0, z], rotateX(rotation * Math.PI / 2, M5Bolt)),
		))),

		[1, -1].map(x =>
			translate(
				[x * PSUBoltPos.x - distanceToPSU.x, PSUBoltPos.y, PSUBoltPos.z],
				rotateX(-Math.PI / 2, M4Bolt)
			),
		),

		translate([0, 20, nema17dimensions.width - 10.5 / 2], getEndStop()),
		// translateX(-135, bedMount)
	];
};

module.exports = {
	getMotorBracket,
	motorBracketThickness,
}

// TODO: top/bottom cover
