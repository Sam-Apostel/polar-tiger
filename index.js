const jscad = require('@jscad/modeling');
const { vec2 } = jscad.maths;
const {
	translate, translateZ, translateY,
	rotateZ, rotateY, rotateX,
} = jscad.transforms;

const { cylinder, cuboid, roundedCuboid } = jscad.primitives;
const { colorize } = jscad.colors;
const { union, subtract, intersect } = jscad.booleans;

require("./utils/extensions");
const { PULLEYS } = require('./configs/pulleys');
const { getExtrusion } = require("./parts/extrusions");

const tools = require('./tools/index.js');
const { getCarriage } = require("./prints/carriage");
const { getIdlerNegative, getIdler } = require("./parts/wheels/idlers");
const { getPulley } = require("./parts/wheels/pulleys");
const { getBeltSection, getBeltRadius, beltSize } = require('./utils/geometry/belt');
const { getNema17, nema17Width} = require('./parts/electronics/motors');
const { getZTopIdler } = require('./prints/zTop');
const { getMotorBracket } = require('./prints/zBottom');
const { getElectronics } = require('./parts/electronics/controlBox');
const { getBolt, BOLT_TYPES, getSocketScrew} = require('./parts/bolts');

const motorLength = 47;
const getNema17WithPulley = (pulleySize, pulleyPosition) => {
	const motor = getNema17(motorLength, true);
	const pulley = getPulley(pulleySize);
	return [
		motor,
		translateZ(motorLength / 2 + pulleyPosition, pulley)
	];
};

const getZAxis = (height, offsetIdlers, zAxisProfile, motorPositions, zTopHeight, distanceToPSU, PSUPlateThickness, bedCenter) => {
	const zAxis = getExtrusion(height, zAxisProfile.depth, zAxisProfile.width);
	const topBracket = getZTopIdler(zTopHeight, translateZ(-((zTopHeight / 2) + height), offsetIdlers), zAxisProfile);
	const bottomBracket = getMotorBracket(motorPositions, distanceToPSU, zAxisProfile, PSUPlateThickness, bedCenter);
	return [
		bottomBracket,
		zAxis,
		translateZ((zTopHeight / 2) + height, topBracket),
	];
};
const getSpool = (diameter, height) => {
	return translateZ(height / 2, [
		union(
			cylinder({ radius: diameter / 2, height: 4, center: [0, 0, (height - 4) / 2]}),
			cylinder({ radius: 95 / 2 , height: height }),
			cylinder({ radius: diameter / 2, height: 4, center: [0, 0, (4 - height) / 2]})
		)
	])
}

const getRotaryHub = (rotation, motorPlane, {radius, height, center}, joints, zAxis, zAxisCenter) => {
	const detail = 128;
	const gearPosition = 11;
	// const motor = rotateY(Math.PI / 2, translateZ(-motorLength / 2 - gearPosition, getNema17(motorLength)));
	const motor = translateZ(motorPlane + (-nema17Width + motorLength) / 2, getNema17(motorLength));

	const gearSize = {
		ring: {
			thickness: 5
		},
		radius: 7
	};
	const bearingSize = {
		height: 8,
		inner: 135,
		outer: 150,
		thickness: 12.5,
	};
	const bearingHoles = {
		radius: 2.6,
		height: 7,
		inner: {
			deep: 3,
			shallow: 3,
		},
		outer: {
			deep: 0,
			shallow: 6
		}
	};
	const getBearingRing = (radius, holes, screws) => {
		const spreadCircular = (amount, geometry) => {
			return [...Array(amount)].map((_, index) => rotateZ((Math.PI * 2 / amount) * index, geometry))
		}

		const hole = cylinder({ ...bearingHoles, center: [radius - bearingSize.thickness / 2, 0, (bearingSize.height - bearingHoles.height) / 2] });
		const screw = translate([radius - bearingSize.thickness / 2, 0, (30 - bearingSize.height) / 2], getSocketScrew(BOLT_TYPES.M5, 30,  {diameter: 9.7, height: 3.6, smallDiameter: 4.7}));
		const screwNegative = translate([radius - bearingSize.thickness / 2, 0, (30 - bearingSize.height) / 2], getSocketScrew(BOLT_TYPES.M5, 30,  {diameter: 9.7, height: 3.6, smallDiameter: 4.7}, true));
		let screwsNegative = spreadCircular(screws, screwNegative);
		screwsNegative = screwsNegative.length ? [union(...screwsNegative)] : [];
		return rotateX(Math.PI, [
			...screwsNegative,
			subtract(
				cylinder({ radius: radius, height: bearingSize.height, segments: detail}),
				cylinder({ radius: radius - bearingSize.thickness, height: bearingSize.height, segments: detail}),
				spreadCircular(holes, hole),
				...screwsNegative
			),
			spreadCircular(screws, screw),
		]);
	};
	const [screwsNegative, innerBearing, ...screws] = getBearingRing(bearingSize.inner, bearingHoles.inner.deep + bearingHoles.inner.shallow, bearingHoles.inner.deep);
	const outerBearing = getBearingRing(bearingSize.outer, bearingHoles.outer.deep + bearingHoles.outer.shallow, bearingHoles.outer.deep);

	const bedBearing = translateZ(-height -(8/2), [
		innerBearing,
		screws,
		rotateX(Math.PI, outerBearing),
	]);

	const buildPlate = [
		subtract(
			cylinder({ radius, height, center: [0,0, -height / 2], segments: detail }),
			cylinder({ radius: radius - 3, height, center: [0,0, -height / 2], segments: detail }),
		),
		cylinder({ radius: radius - 3, height: height - 1, center: [0,0, -height / 2], segments: detail }),
	];


	const baseSize = {
		r: bearingSize.inner,
		x: 340,
		y: bearingSize.inner * 2,
		z: center.z - height
	}

	const getBaseHoles = ({ bottom, back }) => {
		const holeLocations = [bottom, back].flatMap(({ left, right }) => [left, right]);
		const hole = cylinder({ radius: beltSize.width / 2 + 1, height: baseCeiling});
		return holeLocations.map(([x, y]) => translate([x, y, baseSize.z - baseCeiling / 2], hole));
	};

	const baseFlapSize = {
		x: 160,
		y: 120,
		z: 12,
		position: 240,
	}

	const baseWallThickness = 12.5;
	const baseCeiling = 6;
	const baseRoundRadius = 8;

	const zAxisHole = subtract(
		cuboid({ size: [zAxis.width, zAxis.depth, baseCeiling] }),
		subtract(
			union(
				zAxis.threads.map(({x, y}) => [
					[x + 10, x - 10].map(x =>
						translate([x, y, 0], rotateZ(Math.PI / 4, cuboid({ size: [6.6, 6.6, baseCeiling] }))),
					),
					[y + 10, y - 10].map(y =>
						translate([x, y, 0], rotateZ(Math.PI / 4, cuboid({ size: [6.6, 6.6, baseCeiling] }))),
					)
				])
			),
			cuboid({ size: [zAxis.width - 2, zAxis.depth - 2, baseCeiling]}),
		)
	);

	const base = subtract(
		union(
			cylinder({ radius: baseSize.r, height: baseSize.z, segments: detail, center: [0, 0, baseSize.z / 2] }),
			roundedCuboid({ size: [baseSize.x + baseRoundRadius, baseSize.y, baseSize.z + baseRoundRadius], center: [(baseSize.x - baseRoundRadius) / 2, -baseSize.r + baseSize.y / 2, (baseSize.z - baseRoundRadius) / 2], roundRadius: baseRoundRadius, segments: detail / 4 })
		),
		union(
			subtract(
				cylinder({ radius: bearingSize.outer + .8, height: bearingSize.height + 2, segments: detail, center: [0, 0, baseSize.z - (bearingSize.height + 2) / 2] }),
				cylinder({ radius: bearingSize.inner, height: bearingSize.height + 2, segments: detail, center: [0, 0, baseSize.z - (bearingSize.height + 2) / 2] }),
			),
			cylinder({ radius: bearingSize.outer, height: bearingSize.height, segments: detail, center: [0, 0, baseSize.z - (bearingSize.height) / 2] }),
			cylinder({ radius: baseSize.r - baseWallThickness, height: baseSize.z, segments: detail, center: [0, 0, baseSize.z / 2] }),
			cuboid({ size: [baseSize.x - baseWallThickness, baseSize.y - baseWallThickness * 2, baseSize.z - baseCeiling], center: [(baseSize.x - baseWallThickness) / 2, -baseSize.r + baseSize.y / 2, (baseSize.z - baseCeiling) / 2] }),
			cuboid({ size: [baseSize.x + baseRoundRadius, baseSize.y, baseRoundRadius], center: [(baseSize.x - baseRoundRadius) / 2, -baseSize.r + baseSize.y / 2, -baseRoundRadius / 2] }),
			getBaseHoles(joints),
			translateZ(-height -(8/2) + center.z, screwsNegative),
			translate([zAxisCenter[0], zAxisCenter[1], baseSize.z - baseCeiling / 2], zAxisHole)
		)
	);


	const baseFlapCutter = union(
		cuboid({ size: [baseFlapSize.x + .8, baseFlapSize.y + .4, baseCeiling / 2 + .4], center: [baseFlapSize.position, -(bearingSize.outer - (baseFlapSize.y + .4) / 2), baseSize.z - (baseCeiling / 2 + .4) / 2] }),
		cuboid({ size: [baseFlapSize.x + .8, baseFlapSize.y - 5 + .4, baseCeiling + .4], center: [baseFlapSize.position, -(bearingSize.outer - (baseFlapSize.y - 5 + .4) / 2), baseSize.z - (baseCeiling + .4) / 2] }),
		cuboid({ size: [baseFlapSize.x + .8, baseWallThickness / 2 + .4, baseFlapSize.z + .4], center: [baseFlapSize.position, -(bearingSize.outer - (baseWallThickness / 2 + .4) / 2) + (baseWallThickness / 2) - .4, baseSize.z - (baseFlapSize.z + .4) / 2] }),
	);

	const baseFlap = intersect(base, union(
		cuboid({ size: [baseFlapSize.x, baseFlapSize.y, baseCeiling / 2], center: [baseFlapSize.position, -(bearingSize.outer - baseFlapSize.y / 2), baseSize.z - baseCeiling / 4] }),
		cuboid({ size: [baseFlapSize.x, baseFlapSize.y - 5, baseCeiling], center: [baseFlapSize.position, -(bearingSize.outer - (baseFlapSize.y - 5) / 2), baseSize.z - baseCeiling / 2] }),
		cuboid({ size: [baseFlapSize.x, baseWallThickness / 2, baseFlapSize.z], center: [baseFlapSize.position, -(bearingSize.outer - baseWallThickness * 0.75), baseSize.z - baseFlapSize.z / 2] }),
	));


	const motorRotation = .65;
	return translate([center.x, center.y, 0], [
		rotateZ(motorRotation, translate([bearingSize.outer + gearSize.ring.thickness + gearSize.radius, 0, 0], rotateZ(-motorRotation, motor))),
		// subtract(base, baseFlapCutter),
		translateZ(center.z, bedBearing),
		// translateZ(center.z, buildPlate),
		// baseFlap,
	]);
}

const getXAxis = (length, xAxisProfile, tool) => {
	const xAxis = getExtrusion(length, xAxisProfile.depth, xAxisProfile.width);
	const beltTensioner = rotateY(Math.PI / 2, [
		translateZ(7, subtract(
			cuboid({ size: [20, 20, 10] }),
			union(
				cylinder({ radius: 4.2, height: 10 }),
				cylinder({ radius: BOLT_TYPES.M5 + .2, height: 7, center: [0, 0, -1.5] })
			)
		)),
		getBolt(BOLT_TYPES.M5, 20, { diameter: 8.48, height: 5})
	]);
	return [
		translate([tool.mount.x, tool.mount.y, tool.mount.z], tool.getGeometry()),
		rotateY(Math.PI / 2, xAxis),
		translate([length, 0, 0], beltTensioner),
		// TODO: belt clamp

	];
}


const xAxi = {
	2020: {
		width: 20,
		depth: 20,
		// tool shizzle here
	},
	2040: {
		width: 40,
		depth: 20,
		// tool shizzle here
	},
	2060: {
		width: 60,
		depth: 20,
		// tool shizzle here
	}
}

const zAxi = {
	2020: {
		width: 20,
		depth: 20,
		beltOffset: [12.5, 13],
		threads: [{ x: 0 , y: 0 }],
		pulley: PULLEYS[40],
		bedClearance: 0
	},
	2040: {
		width: 40,
		depth: 20,
		// beltOffset: [3, 0],
		// beltOffset: [10, 8],
		// beltOffset: [19, 17],

		// beltOffset: [13, 17],
		beltOffset: [22, 18],
		pulley: PULLEYS[60],
		// pulleyAngle: 15,
		beltYOffset: PULLEYS[60].beltOffset * 2 - .4,

		threads: [{ x: -10 , y: 0 }, { x: 10 , y: 0 }],
		bedClearance: 15,
		// bottomClearance: 25,
		bottomClearance: 15,
		xAxis: {
			extraLength: 15,
		}
	},
	2060: {
		width: 60,
		depth: 20,
		beltOffset: [10, 0],
		threads: [{ x: -20 , y: 0 }, { x: 0 , y: 0 }, { x: 20 , y: 0 }],
		pulley: PULLEYS[40],
		bedClearance: 0
	}
}


const main = props => {
	const {
		height,
		radius,
		x,
		delta,
		z,
	} = props;

	const xAxis = xAxi[2020];
	const zAxis = zAxi[2040];
	const tool = tools.hotEnds.microswiss.endCap;

	const wheelRadius = 11.945;

	const axisSpacing = 1;

	const wheelAxialOffset = (xAxis.depth + axisSpacing) / 2;
	const buildPlate = { radius, height: 4, center: { x: 0, y: 0, z: 8 + 4 + nema17Width + zAxis.bottomClearance } }
	const xAxisCenterY = buildPlate.center.y - tool.mount.y / 2;
	const zAxisCenterY = xAxisCenterY + axisSpacing + xAxis.depth;


	const carriageSize = {x: zAxis.width, z: xAxis.width};

	const wheelRadialOffset = 10;
	const xWheelSpread = 95;
	const zWheelSpread = 80;
	const zWheelOffset = 20;
	const width = buildPlate.radius + xWheelSpread + wheelRadius - tool.mount.x + zAxis.bedClearance + zAxis.xAxis.extraLength;

	const carriagePosition = {
		x: buildPlate.center.x + buildPlate.radius + xWheelSpread / 2 + wheelRadius + zAxis.bedClearance,
		y: xAxisCenterY + wheelAxialOffset,
		z: 0
	};

	const xWheels = { bottom: [- xWheelSpread / 2, + xWheelSpread / 2], top: [0] };
	const zWheels = { left: [zWheelSpread / 2 + zWheelOffset, - zWheelSpread / 2 + zWheelOffset], right: [zWheelSpread / 2 + zWheelOffset, - zWheelSpread / 2 + zWheelOffset] };


	const wheelPositions = [
		...xWheels.bottom.map(offset => ({translation: [offset, -wheelAxialOffset, carriagePosition.z - ((carriageSize.z / 2) + wheelRadialOffset)], rotation: -Math.PI / 2 })),
		...xWheels.top.map(offset => ({translation: [offset, -wheelAxialOffset, carriagePosition.z + ((carriageSize.z / 2) + wheelRadialOffset)], rotation: -Math.PI / 2  })),
		...zWheels.left.map(offset => ({translation: [- ((carriageSize.x / 2) + wheelRadialOffset), wheelAxialOffset, offset], rotation: Math.PI / 2 })),
		...zWheels.right.map(offset =>  ({translation: [((carriageSize.x / 2) + wheelRadialOffset), wheelAxialOffset, offset], rotation: Math.PI / 2 })),
	];

	const getZPos = (wheelPositions, carriageCenter, wheelRadius, height ) => {
		const [lowestWheel, highestWheel] = wheelPositions.reduce(([min, max], { translation: [,,z]}) => {
			if (min === undefined && max === undefined) return [z, z];
			if (z < min) return [z, max];
			if (z > max) return [min, z];
			return [min, max];
		}, [undefined, undefined]);
		const carriageClearance = (highestWheel - lowestWheel + wheelRadius );
		const min = buildPlate.center.z - tool.mount.z;
		const max = height - carriageClearance;
		return (max - min) * z + min;
	}
	const zPos = getZPos(wheelPositions, carriagePosition.z, wheelRadius, height );

	const getXPos = (wheelPositions, carriageCenter, wheelRadius, width ) => {
		const [leftestWheel, rightestWheel] = wheelPositions.reduce(([min, max], { translation: [x]}) => {
			if (min === undefined && max === undefined) return [x, x];
			if (x < min) return [x, max];
			if (x > max) return [min, x];
			return [min, max];
		}, [undefined, undefined]);
		const carriageClearance = (rightestWheel - leftestWheel + wheelRadius );
		const xRange = [wheelRadius, width - carriageClearance];
		return (xRange[1] - xRange[0]) * x + xRange[0] + (carriageCenter - leftestWheel);
	}
	const xPos = getXPos(wheelPositions, carriagePosition.x, wheelRadius, width );

	const joints = {
		bottom: {
			left: [xWheels.bottom[0] + wheelRadius + beltSize.thickness / 2 + carriagePosition.x, xAxisCenterY],
			right: [xWheels.bottom[1] - wheelRadius - beltSize.thickness / 2 + carriagePosition.x, xAxisCenterY],
		},
		top: {
			left: [xWheels.top[0] - wheelRadius - beltSize.thickness / 2 + carriagePosition.x, xAxisCenterY],
			right: [xWheels.top[0] + wheelRadius + beltSize.thickness / 2 + carriagePosition.x, xAxisCenterY],
		},
	};

	// equal sized pulleys on top and bottom
	joints.back = {
		left: [(joints.bottom.left[0] + joints.top.left[0]) / 2, joints.bottom.left[1] + Math.sqrt(Math.pow(zAxis.pulley.beltOffset * 2, 2) - Math.pow(( joints.top.left[0] - joints.bottom.left[0]) / 2, 2))],
		right: [(joints.bottom.right[0] + joints.top.right[0]) / 2, joints.bottom.right[1] + Math.sqrt(Math.pow(zAxis.pulley.beltOffset * 2, 2) - Math.pow(( joints.top.right[0] - joints.bottom.right[0]) / 2, 2))],
	};

	// bottom and y offset are given
	// joints.back = {
	// 	left: [joints.bottom.left[0] + Math.sqrt(Math.pow(zAxis.pulley.beltOffset * 2, 2) - Math.pow(zAxis.beltYOffset, 2)), joints.bottom.left[1] + zAxis.beltYOffset],
	// 	right: [joints.bottom.right[0] - Math.sqrt(Math.pow(zAxis.pulley.beltOffset * 2, 2) - Math.pow(zAxis.beltYOffset, 2)), joints.bottom.right[1] + zAxis.beltYOffset],
	// };

	// MOTORS
	const xzMotorPlane = nema17Width / 2;
	const getMotor = (endA, endB) => {
		let diagonal = [];
		vec2.subtract(diagonal, endA, endB);
		const motorRotation = vec2.angleRadians(diagonal) - Math.PI; // * i--;
		let centerXY = [];
		vec2.lerp(centerXY, endA, endB, .5);
		const center = [...centerXY, xzMotorPlane];
		// const pulleyPosition = motorBracketThickness + pulleyWidth / 2 + 8;
		const pulleyPosition = 16;

		const diameter = vec2.length(diagonal) - beltSize.thickness;
		const pulley = zAxis.pulley ?? PULLEYS.fromOd(diameter);
		console.log(pulley.teeth);
		return [
			translate(center, rotateZ(motorRotation, translateY(-motorLength / 2 - pulleyPosition, rotateX(-Math.PI / 2, getNema17WithPulley(pulley, pulleyPosition))))),
			{ translation: center, rotation: motorRotation, radius: diameter / 2, pulleyPosition }
		];
	};

	const [motors, motorPositions] = [
		getMotor(joints.back.left, joints.bottom.left),
		getMotor(joints.bottom.right, joints.back.right),
	].divide();


	// IDLERS
	let diagonal = [];
	vec2.subtract(diagonal, joints.back.left, joints.top.left);
	const idlerRotation = vec2.angleRadians(diagonal) - Math.PI;
	const idlerDiameter = vec2.length(diagonal) - beltSize.thickness;
	const idlerOutsideDiameter = 42.2; // pulley outside diameter

	const idlerExtrusionDistance = 2;
	const idlerAxisDepth = 0;
	const zTopHeight = idlerOutsideDiameter / 2 + beltSize.thickness + idlerExtrusionDistance + idlerAxisDepth;
	const xzIdlerPlane = height + zTopHeight - idlerAxisDepth;

	const getIdlerAt = (endA, endB, rotation) => {
		let centerXY = [];
		vec2.lerp(centerXY, endA, endB, 1/2);
		const center = [...centerXY, xzIdlerPlane];

		return [
			translate(center, rotateZ(rotation, rotateX(-Math.PI / 2, getPulley({ teeth: 60, od: idlerDiameter }, true)))),
			// translate(center, rotateZ(rotation, rotateX(-Math.PI / 2, getIdler(20, idlerDiameter)))),
			// translate(center, rotateZ(rotation, rotateX(-Math.PI / 2, getIdlerNegative(22.6, idlerDiameter + (2 * beltSize.thickness))))),
			translate(center, rotateZ(rotation, rotateX(-Math.PI / 2, getPulley({ teeth: 60, od: idlerDiameter }, true, true)))),
			{ translation: center, rotation, radius: idlerDiameter / 2 }
		];
	};

	const [idlers, offSetIdlers, idlerPositions] = [
		getIdlerAt(joints.back.left, joints.top.left, idlerRotation),
		getIdlerAt(joints.back.right, joints.top.right, -idlerRotation),
	].divide();


	// BELTS
	const belts = union([
		getBeltSection([...joints.bottom.left, xzMotorPlane], motorPositions[0].rotation + Math.PI, [...joints.bottom.left, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], 0),
		getBeltSection([...joints.bottom.right, xzMotorPlane], motorPositions[1].rotation + Math.PI, [...joints.bottom.right, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], 0),

		getBeltSection([...joints.top.left, carriagePosition.z + (carriageSize.z / 2) + wheelRadialOffset + zPos], 0, [...joints.top.left, xzIdlerPlane], idlerPositions[0].rotation),
		getBeltSection([...joints.top.right, carriagePosition.z + (carriageSize.z / 2) + wheelRadialOffset + zPos], 0, [...joints.top.right, xzIdlerPlane], idlerPositions[1].rotation),

		getBeltSection([...joints.back.left, xzMotorPlane], motorPositions[0].rotation, [...joints.back.left, xzIdlerPlane], idlerPositions[0].rotation),
		getBeltSection([...joints.back.right, xzMotorPlane], motorPositions[1].rotation, [...joints.back.right, xzIdlerPlane], idlerPositions[1].rotation - Math.PI * 2),

		translate([xWheels.bottom[0] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], getBeltRadius(wheelRadius, 0, Math.PI / 2)),
		translate([xWheels.bottom[1] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], rotateY(-Math.PI / 2, getBeltRadius(wheelRadius, 0, Math.PI / 2))),
		translate([xWheels.top[0] + carriagePosition.x, xAxisCenterY, carriagePosition.z + (carriageSize.z / 2) + wheelRadialOffset + zPos], getBeltRadius(wheelRadius, Math.PI, 0)),

		motorPositions.map(motorPosition => translate(motorPosition.translation, rotateZ(motorPosition.rotation, getBeltRadius(motorPosition.radius, Math.PI, 0)))),
		idlerPositions.map(idlerPosition => translate(idlerPosition.translation, rotateZ(idlerPosition.rotation, getBeltRadius(idlerPosition.radius, 0, Math.PI)))),


		getBeltSection([xWheels.bottom[0] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0, [xPos - width, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0),
		getBeltSection([xWheels.bottom[1] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0, [xPos, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0),
	]);
	// const mainColor = [184, 110, 15].map(v => v / 255); // orange
	const mainColor = [1, .55, .2]; // yellow

	const motorColors = [
		[.7, .7, .7], // XZ1 motor shaft
		[.3, .3, .3], // XZ1 motor body
	];

	const XZMotorColors = [
		[.7, .7, .7], // XZ1 motor shaft
		[.3, .3, .3], // XZ1 motor body
		[.15, .15, .15], // XZ1 motor screws
		[.7, .7, .7], // XZ1 motor pulley
	];

	const vWheelColors = [
		[.8, .8, .8, .9], // wheel
		[.2, .2, .2], // bolt
		// [.7, .7, .7], // bolt
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
		[...mainColor, 1], // carriage back
		[...mainColor, 1], // carriage front

		...tool.colors,
		[.2, .2, .2], // X axis,
		mainColor, // belt tensioner
		[.15, .15, .15], // belt tensioner bolt

	];

	const zTopColors = [
		mainColor, // Z top
		[.7, .7, .7], // Z top left idler
		[.8, .8, .8], // Z top left idler bolt
		[.7, .7, .7], // Z top right idler
		[.8, .8, .8], // Z top right idler bolt
	];

	const zBottomColors = [
		mainColor, // Z bottom motor mount
		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt

		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt

		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt


		[.15, .15, .15], // endstop
		[.8, .8, .8], // endstop

	];

	const zAxisColors = [
		...zBottomColors,
		[.2, .2, .2], // Z axis
		...zTopColors,
	];

	const rotaryAxisColors = [
		...motorColors, // rotary motor

		// mainColor, // base
		[.7, .7, .7], // bed bearing-inner
		[.8, .8, .8], // bolt
		[.8, .8, .8], // bolt
		[.8, .8, .8], // bolt

		[.7, .7, .7], // bed bearing-outer

		[.3, .3, .3], // build plate rim
		[.9, .9, .9], // build plate mirror

		// [.2, .2, .2], // base flap
	];
	const electronicsColors = [
		[.15, .15, .15], // bolt
		[.15, .15, .15], // bolt
		[.75, .75, .75, .5], // PSU
		// [.4, .2, .2], // mainBoard
		// [.2, .6, .2], // raspberry pi
	];
	const colors = [
		...zAxisColors,
		...carriageColors,
		[.15, .15, .15], // XZ belt
		...XZMotorColors, // XY motor 1
		...XZMotorColors, // XY motor 2
		...electronicsColors,
		// [.3, .3, .3], // spool
		...rotaryAxisColors,
	];

	const translatePositions = (positions, translation) => positions.map(
		position => ({
			...position,
			translation: position.translation.map((value, index) => value + (translation[index] ?? 0))
		})
	);
	const zAxisCenter = [carriagePosition.x, zAxisCenterY, 0];
	const zAxisCenterCompensation = zAxisCenter.map(value => -value);



	const PSUPlateThickness = 6;
	const beltClearance = 4.5;
	const distanceFromZCenterToPSU = {
		x: carriagePosition.x - ((340 - 12.5) - 215 / 2),
		y: zAxisCenterY - xAxisCenterY + beltClearance + PSUPlateThickness
	};

	console.log({distanceFromZCenterToPSU, carriagePosition: carriagePosition.x, PSUCenter: ((340 - 12.5) - 215 / 2)});

	return translate([-100, 0, 6], [
		translate(zAxisCenter, getZAxis(height, translate(zAxisCenterCompensation, offSetIdlers), zAxis, translatePositions(motorPositions, zAxisCenterCompensation), zTopHeight, distanceFromZCenterToPSU, PSUPlateThickness, zAxisCenterCompensation)),
		idlers,
		translate([carriagePosition.x, carriagePosition.y, carriagePosition.z + zPos], getCarriage(wheelPositions, axisSpacing)),
		translate([xPos - width, xAxisCenterY, carriagePosition.z + zPos], getXAxis(width, xAxis, tool)),
		belts,
		motors,
		getElectronics(buildPlate.center, beltClearance, PSUPlateThickness),
		// translate([buildPlate.center.x,  buildPlate.center.y, 0], getSpool(200, 75)),
		getRotaryHub(delta, xzMotorPlane, buildPlate, joints, zAxis, zAxisCenter),
		// cuboid({ size: [180, 180, 3], center: [0,0,0]}), // mini bed size
		// cuboid({ size: [210, 250, 3], center: [0,0,0]}), // mk3s bed size
	])
		.map((object, index) => {
			return object.color ? object : colorize(colors[index] || [0, 0, 0], object)
		});
}

const getParameterDefinitions = () => {
	return [
		{ name: 'printerSize', type: 'group', caption: 'Printer size:' },
		{ name: 'height', type: 'number', initial: 500, min: 0, max: 1000, step: 100, caption: 'Height Z-axis:' },
		{ name: 'width', type: 'number', initial: 350, min: 0, max: 1000, step: 100, caption: 'Width X-axis:' },
		{ name: 'radius', type: 'number', initial: 150, min: 0, max: 1000, step: 50, caption: 'Radius rotary plate:' },

		{ name: 'printerPosition', type: 'group', caption: 'Printer position:' },
		{ name: 'x', type: 'slider', initial: .4, min: 0, max: 1, step: .01, caption: 'x:' },
		{ name: 'delta', type: 'slider', initial: 0, min: 0, max: Math.PI * 2, step: .1, caption: 'Delta:' },
		{ name: 'z', type: 'slider', initial: .6, min: 0, max: 1, step: .01, caption: 'z:' },

		{ name: 'renderer', type: 'group', caption: 'Render settings:' },
	]
};

module.exports = { main, getParameterDefinitions }

// rotary table with worm gear
// rotary table mounting options

// z-axis lead screw
// x-axis rack and pinion through lead-screw

