const jscad = require('@jscad/modeling');
const { vec3, vec2 } = jscad.maths;
const {
	translate, translateZ, translateX, translateY,
	rotate, rotateZ, rotateY, rotateX,
	mirror
} = jscad.transforms;

const { extrudeLinear, extrudeFromSlices } = jscad.extrusions;
const { cuboid, cylinder, cylinderElliptic, rectangle, circle } = jscad.primitives;
const { colorize } = jscad.colors;
const { union, subtract, intersect } = jscad.booleans;
const { hull } = jscad.hulls;

require("./utils/extensions");
const { PULLEYS } = require('./configs/pulleys');
const { BOLT_TYPES, getBolt } = require('./parts/bolts');
const { getExtrusion } = require("./parts/extrusions");



const tools = require('./tools/index.js');
const {getCarriage} = require("./prints/carriage");
// const mainBoard = require('./STLs/BTT_octopus_board.stl');
const {getIdlerNegative, getIdler} = require("./parts/wheels/indlers");
const {getPulley} = require("./parts/wheels/pulleys");
const {BELT_DETAIL} = require("./rendering");




const getNema17 = (length, withBolts) => {
	const bolts = union([[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => translate([x * 15.5, y * 15.5, (length) / 2 + 1.5], getBolt(BOLT_TYPES.M3, 3, { diameter: 5.5, height: 3}))));
	const body = union(
		subtract(
			intersect(
				cuboid({size: [42.3, 42.3, length]}),
				rotateZ(Math.PI / 4, cuboid({size: [51, 51, length]}))
			),
			bolts
		),
		cylinder({radius: 11, height: 2, center: [0, 0, (length + 2) / 2]})
	);
	const axle = subtract(
		cylinder({radius: 2.5, height: 22, center: [0, 0, (length + 22) / 2 + 2]}),
		cuboid({size: [5, .5, 20], center: [0, (5 - .5)/2, (length + 22) / 2 + 2 + 2]})
	);
	return [
		axle,
		body,
		withBolts ? bolts : []
	];
};
let i = 1;
const getNema17WithPulley = (pulleySize, pulleyPosition) => {
	const motor = getNema17(48, true);
	const pulley = getPulley(pulleySize);
	let t = [0, 0, 0];
	let r = 0;
	// if (i++) {
	// 	t = [0, 0, 70];
	// 	r = Math.PI;
	// }
	return [translate(t, rotateY(r, motor)), translateZ(45 / 2 + pulleyPosition, pulley)];
};

const getZTopIdler = (height, offsetIdlers, zAxisProfile) => {
	const overhang = 13;
	const m5_16 = getBolt(BOLT_TYPES.M5, 16, {diameter: 8.5, height: 5});
	const m5_hole = getBolt(BOLT_TYPES.M5 + .4, 3, {diameter: 8.5 + .4, height: height - 2});

	const angle = Math.PI / 4 * 1.5;
	const rounding = 3;
	const roundingEdge = (rounding / Math.sqrt(2));
	const radius = (rounding / Math.sin((Math.PI / 2) - angle)) * Math.sin(angle);

	const altRounding = 4;

	return [
		subtract(
			union(
				translateY(-overhang / 2, cuboid({size: [zAxisProfile.width, 20 + overhang, height]})),
				translate([0, -(20 + overhang) / 2, -(height + overhang) / 2], intersect(
					rotateX(Math.PI / 4, translateY(100 / 2 ,cuboid({size: [zAxisProfile.width, 100, 100]}))),
					cuboid({size: [zAxisProfile.width, overhang, overhang]})
				)),
			),
			union(
				offsetIdlers,
				// translateY(5, cuboid({size: [20, 12.45, 20]})),
				cuboid({ size: [7, 13, 20], center: [-zAxisProfile.beltOffset[0], 10 - 13 / 2, 0]}),
				cuboid({ size: [7, 13, 20], center: [+zAxisProfile.beltOffset[0], 10 - 13 / 2, 0]}),


				zAxisProfile.threads.map(({x, y}) => translate( [x, y, ( -height + 2) / 2], m5_hole)),

				translateY(5, rotateX(Math.PI / 4, translateY(100 / 2 , cuboid({size: [zAxisProfile.width, 100, 100]})))),

				subtract(
					cuboid({size: [zAxisProfile.width, roundingEdge, rounding + roundingEdge], center: [0, 10 - roundingEdge / 2, (-height / 2 + 5) - ((rounding - roundingEdge) / 2)]}),
					translate( [0, 10 - radius, -height / 2 + 5 - rounding], rotateY(Math.PI / 2, cylinder({height: zAxisProfile.width, radius: radius}))),
				),


				subtract(
					cuboid({size: [zAxisProfile.width, altRounding, altRounding], center: [0, -10 - overhang + (altRounding / 2), (height - altRounding) / 2 ]}),
					translate( [0, -10 - overhang + altRounding, height / 2 - altRounding], rotateY(Math.PI / 2, cylinder({height: zAxisProfile.width, radius: altRounding}))),
				),
				subtract(
					cuboid({size: [zAxisProfile.width, rounding + roundingEdge, roundingEdge], center: [0, -5.4, 10 - roundingEdge / 2]}),
					translate( [0, -8, 2.75], rotateY(Math.PI / 2, cylinder({height: zAxisProfile.width, radius: radius}))),
				),

				subtract(
					cuboid({size: [zAxisProfile.width, 5, 3], center: [0, -12.5, -12.5 - 13 + 3]}),
					translate( [0, -10, -10 - 8.78], rotateY(Math.PI / 2, cylinder({height: zAxisProfile.width, radius: 3}))),
				),


				zAxisProfile.threads.map(({ x }) => translate( [x, -10 - 1.5, -16], rotateX(Math.PI / 2, m5_hole))),

				translate([.05, -17.1, 9], rotateY(Math.PI / 2, cylinder({radius: 5 / 2, height: 3.12}))),
			)
		),

	]
};

const getMotorBracket = (height, motorPositions, width) => {
	const idlerHoles = union(
		translate([-17, -15, 19], rotateZ(-Math.PI / 4, rotateY(Math.PI / 2, cylinder({radius: 22, height: 9 })))),
		translate([17, -15, 19], rotateZ(Math.PI / 4, rotateY(Math.PI / 2, cylinder({radius: 22, height: 9 })))),
	);

	const getMotorPlate = holes => {
		const connectorWidth = 25.5;
		const connectorDept = 8;
		const connectorHeight = 21.14 + 2;
		const boltLength = 16 + 2;
		const boltSpacing = .3;
		const bolts = union(
			translate( [connectorHeight - boltLength / 2 + 2, connectorWidth / 2 - 5, (3 - connectorDept) / 2],rotateY(Math.PI / 2, getBolt(BOLT_TYPES.M3 + boltSpacing, boltLength, { diameter: 5.5, height: 4}))),
			translate( [connectorHeight - boltLength / 2 + 2, -connectorWidth / 2 + 5, (3 - connectorDept) / 2],rotateY(Math.PI / 2, getBolt(BOLT_TYPES.M3 + boltSpacing, boltLength, { diameter: 5.5, height: 4}))),
		);
		return rotateY(Math.PI / 2,  translateZ( 12, [
			union(
				subtract(
					union(
						holes.map(([x,y]) => cylinder({radius: BOLT_TYPES.M3 / 2 + 2, height: 3, center: [x * 15.5, y * 15.5, 0]})),
						rotateZ(Math.PI / 4, cuboid({size: [7, Math.sqrt(31 * 31 * 2), 3], center: [0, 0, 0]})),
						rotateZ(-Math.PI / 4, cuboid({size: [7, Math.sqrt(31 * 31 * 2), 3], center: [0, 0, 0]})),
						cylinder({ radius: connectorWidth / 2, height: connectorDept, center: [0, 0, -connectorDept / 2 + 1.5]}),
						cuboid({size: [connectorHeight, connectorWidth, connectorDept], center: [connectorHeight / 2, 0, -connectorDept / 2 + 1.5]})
					),
					union(
						holes.map(([x,y]) => cylinder({radius: (BOLT_TYPES.M3 + boltSpacing) / 2, height: 3, center: [x * 15.5, y * 15.5, 0]})),
						cylinder({ radius: 11, height: 2, center: [0, 0, 1]}),
						cylinder({ radius: 3, height: 30, center: [0, 0, 0]}),
						bolts,
						cuboid({size: [2.45, 5.28, connectorDept], center: [connectorHeight - boltLength / 2, connectorWidth / 2 - 5, -connectorDept / 2 + 1.5]}),
						cuboid({size: [2.45, 5.28, connectorDept], center: [connectorHeight - boltLength / 2, -connectorWidth / 2 + 5, -connectorDept / 2 + 1.5]})
					)
				),
			),
			bolts,
			cuboid({size: [connectorHeight, connectorWidth + .4, connectorDept + .4], center: [connectorHeight / 2, 0, -(connectorDept + .3) / 2 + 1.5]})
		]));
	}
	// const motorPlateAndBolts = translateZ(19.14, translateX(18.9, rotateZ(Math.PI / 4, translateY(-8.87, getMotorPlate([[-1, 1], [1, 1], [1, -1], [-1, -1]])))));
	const motorPlateAndBolts =  translate([motorPositions[0].translation[0], -15 , 19], rotateZ( motorPositions[0].rotation - Math.PI / 2, getMotorPlate([[-1, 1], [1, 1], [1, -1], [-1, -1]])));
	const [motorPlates, motorPlatesBolts, gutters ] = [
		motorPlateAndBolts,
		mirror({origin: [0, 0, 0], normal: [1, 0, 0]}, motorPlateAndBolts)
	].divide();

	return [
		motorPlates,

		subtract(
			// cuboid({ size: [40 + (17 * 2), 20 + 15, 8], center: [0, -(15 / 2), (-height + 8) / 2] }),
			gutters,
			motorPlatesBolts
		),
	];
};

const getBox = ({inner, outer}, belts, motors) => {
	const plateThickness = 8;
	const brimThickness = 5;
	const cornerRadius = 22;
	const boxSize = [270, 180, outer.height];
	const startCorner = cornerRadius - brimThickness;
	const boxOutline = translate([startCorner, startCorner, 0], hull(
		circle({radius: cornerRadius}),
		circle({radius: cornerRadius, center: [boxSize[0] - cornerRadius, 0]}),
		circle({radius: cornerRadius, center: [boxSize[0] - cornerRadius, boxSize[1] - 22]}),
		circle({radius: cornerRadius, center: [0, boxSize[1] - cornerRadius]}),
	));
	const brimInside = translate([startCorner, startCorner, 0], hull(
		circle({radius: cornerRadius - brimThickness}),
		circle({radius: cornerRadius - brimThickness, center: [boxSize[0] - cornerRadius, 0]}),
		circle({radius: cornerRadius - brimThickness, center: [boxSize[0] - cornerRadius, boxSize[1] - 22]}),
		circle({radius: cornerRadius - brimThickness, center: [0, boxSize[1] - cornerRadius]}),
	));
	const topPlate = translateZ(-plateThickness, subtract(
		extrudeLinear({ height: plateThickness }, boxOutline),
		translateZ(plateThickness / 2, [
			cylinder({radius: 2.5, height: plateThickness, center: [169.95 - 10, 65, 0]}),
			cylinder({radius: 2.5, height: plateThickness, center: [169.95 + 10, 65, 0]}),
			translate([startCorner, startCorner, 0], hull(
				cylinder({radius: 11, height: plateThickness}),
				translateY(boxSize[1] - cornerRadius, cylinder({radius: 11, height: plateThickness})),
			)),
			belts.map(pos => cylinder({radius: 3.2, height: plateThickness, center: [...pos, 0]})),
			// TODO: wiring holes
		])
	));
	const brim = translateZ(-boxSize[2] + plateThickness, subtract(
		extrudeLinear({ height: boxSize[2] - plateThickness * 2}, boxOutline),
		extrudeLinear({ height: boxSize[2] - plateThickness * 2}, brimInside),
		// TODO: connections with plates
	));

	const bottomPlate = translateZ(-boxSize[2], subtract(
		extrudeLinear({ height: plateThickness }, boxOutline),
		translateZ(plateThickness / 2, [
			translate([startCorner, startCorner, 0], hull(
				cylinder({radius: 11, height: plateThickness}),
				translateY(boxSize[1] - cornerRadius, cylinder({radius: 11, height: plateThickness})),
			)),
		])
	));

	// const motorMounts = union(motors.map(([x, y, r]) => {
	// 	const motor = getNema17(45, true);
	// 	const plate = subtract(
	// 		cuboid({size: [42.3, 3, boxSize[2] - plateThickness * 2], center: [0, -8.5 ,plateThickness]}),
	// 		translate([0, -32.5, plateThickness], rotateX(-Math.PI / 2, motor))
	// 	);
	// 	return translate([x, y, -boxSize[2] / 2 - plateThickness], rotateZ(r, plate));
	// }));
	return [
		// motorMounts,
		bottomPlate,
		brim,
		topPlate,
		// TODO: pcb mount
	];
};

const getZAxis = (height, offsetIdlers, zAxisProfile, motorPositions) => {
	const zAxis = getExtrusion(height, zAxisProfile.depth, zAxisProfile.width);
	const zTopHeight = 20;
	const zBottomHeight = 20;
	const topBracket = getZTopIdler(zTopHeight, translate([0, -66, - ((zTopHeight / 2) + height)], offsetIdlers), zAxisProfile);
	const bottomBracket = getMotorBracket(zTopHeight, motorPositions, zAxisProfile.width);
	return [
		// translate([0, 0, -(zBottomHeight / 2)], rotateY(Math.PI, bottomBracket)),
		zAxis,
		translate([0, 0, (zTopHeight / 2) + height], topBracket),
	];
};

const getRotaryHub = (rotation, motorClearance, {radius, height, center}) => {
	const motorHeight = 45;
	const gearRadius = 50;
	const wormRadius = 7;
	const bigGearRadius = 17;

	const motor = translate([gearRadius - 5 - wormRadius - 1, motorHeight / 2 + bigGearRadius + 4 , -motorClearance], rotateX(Math.PI / 2, getNema17(motorHeight)));
	// const plateGear = subtract(
	// 	cylinder({radius: gearRadius, height: 5, center: [0,0, 2.5]}),
	// 	cylinder({radius: 10, height: 5, center: [0,0, 2.5]}),
	// );
	//
	// const littleGearRadius = motorClearance - wormRadius - bigGearRadius;
	// const standingGear = subtract(
	// 	union(
	// 		translate([gearRadius - 2.5, 0,  -bigGearRadius], rotateY(Math.PI / 2, cylinder({radius: bigGearRadius, height: 5}))),
	// 		translate([gearRadius - 5 - wormRadius, 0,  -bigGearRadius], rotateY(Math.PI / 2, cylinder({radius: littleGearRadius, height: wormRadius * 2}))),
	// 	),
	// 	translate([gearRadius - (wormRadius + 2.5), 0, -bigGearRadius], rotateY(Math.PI / 2, cylinder({radius: 2, height: 5 + wormRadius * 2}))),
	// );
	// const worm = rotateX(Math.PI / 2, cylinder({radius: wormRadius, height: 30, center: [gearRadius - 5 - wormRadius - 1, -motorClearance, 0]}));
	// const shaft = cylinder({radius: 10, height: motorClearance * 2, center: [0, 0, -motorClearance]});
	// const buildPlateGeometry = subtract(
	// 	cylinder({radius: buildPlate.radius, height: buildPlate.height, center: [0,0, -buildPlate.height / 2 + buildPlate.center.z], segments: 256}),
	// 	cylinder({radius: gearRadius, height: 5, center: [0,0, -buildPlate.height / 2 - 2.5 + buildPlate.center.z]}),
	// );
	const bedBearing = translateZ(-height -(8/2),[
		subtract(
			cylinder({ radius: 135, height: 8, segments: 256}),
			cylinder({ radius: 135 - 12.5, height: 8, segments: 256}),
			[...Array(3)].map((_, index) => rotateZ((Math.PI * 2 / 3) * index, translateX(135 - 12.5 / 2, cylinder({ radius: 2.6, height: 8}))))
		),
		subtract(
			cylinder({ radius: 150, height: 8, segments: 256}),
			cylinder({ radius: 150 - 12.5, height: 8, segments: 256}),
			[...Array(3)].map((_, index) => rotateZ((Math.PI * 2 / 3) * index, translateX(150 - 12.5 / 2, cylinder({ radius: 2.6, height: 8}))))
		)
	]);
	const buildPlate = [
			cylinder({radius, height: height, center: [0,0, -height / 2], segments: 256}),
	]
	return translate([center.x, center.y, center.z], [
		bedBearing,
		buildPlate,
		// buildPlateGeometry,
		// plateGear,
		// standingGear,
		// worm,
		// shaft,
		// motor,
	]);
}

const getXAxis = (length, xAxisProfile, tool) => {
	const xAxis = getExtrusion(length, xAxisProfile.depth, xAxisProfile.width);
	return [
		translate([tool.mount.x, tool.mount.y, tool.mount.z], tool.getGeometry()),
		rotateY(Math.PI / 2, xAxis),
		// TODO: belt tensioner
		// TODO: belt clamp

	];
}

const getPSU = () => {
	return cuboid({size: [215, 115, 30]})
}

const getElectronics = () => {
	return translate([160, 115 / 2, -8 - 42 - 8], [
		translate([0, 0, 30/2], getPSU()),
		// translate([(215 - 160)/ 2, 0, 30 ], getMainBoard())
	]);
	// hot shoe
	// heater cartridge
	// fan * 2
	// thermistor
	// distance

	// controllers
	// stepper drivers ( 5 ) x y z tool rotation
	// AC relay ( 1 )
	// laser driver ( 1 )
	// fan controller ( 3 ) tool part internal
	// heater cartridge ( 2 ) bed tool

	// sensors
	// camera ( 3 ) top bottom birdseye
	// thermistor ( 2 ) bed tool
	// distance sensor ( 3 ) x y z for closed loop

	// ui
	// display
	// buttons
	/// rotary encoder

	// io
	// usb
	// lan
	// sd card
}

const getMainBoard = () => {
	// stl is inverted, invert function didn't work so I did it myself.
	// not all of the stl is inverted though, might need to set ranges that need to be inverted, not today though...

	const invertedBoard = {...mainBoard[0], polygons: mainBoard[0].polygons.map(({vertices}) => ({vertices: vertices.reverse()}))};
	return translateZ(-2, rotateZ(Math.PI /2, (invertedBoard)));
};


/**
 * make a belt that spans between wheels
 * @param joints is an array of wheels that the belt revolves around
 * a joint has a position, rotation and radius
 * for the first and last joint the radius can be zero ( straight terminating )
 * we assume that the belts run straight in one dimension
 */
const getBelt = joints => {
	const getTangentIntersections = (a, b) => {
		// figure out what direction the tangent runs in

		// add radius to position, in the perpendicular axis of the tangent
		return [
			null, // coord of intersection between (tangent of a and b) and a
			null // coord of intersection between (tangent of a and b) and b
		];
	}

	// expand joints with coords of intersections between tangent of 2 joints
	const interfaces = joints.reduce((interfaces, joint, index) => {
		if (index === 0) return [joint];
		const prev = interfaces.pop();
		const [a, b] = getTangentIntersections(prev, joint);
		return [
			...interfaces,
			{
				...prev,
				exit: a
			},
			{
				...joint,
				entry: b,
			}
		];
	}, []);

	// generate radius for each joint
	// generate sections between each joint;

};

const getBeltRadius = (radius, startAngle, endAngle) => {
	const radiusToElliptic = rad => ({startRadius: [rad, rad], endRadius: [rad, rad]});
	return rotateX(Math.PI / 2, subtract(
		cylinderElliptic({...radiusToElliptic(radius + 1.38), height: 5, startAngle, endAngle}),
		cylinderElliptic({...radiusToElliptic(radius), height: 5, startAngle, endAngle}),
	));
	// TODO: add belt hobs
};
const getBeltSection = (startPos, startRot, endPos, endRot) => {
	const length = vec3.distance(startPos, endPos);
	const path = [0, 0, length];
	let shape = [];
	vec3.subtract(shape, endPos, startPos);
	const getPolarAngle = ([x, y]) => {
		if (x === 0) return 0;
		const inverseTangent = Math.atan(y / x );
		if (x < 0) return inverseTangent + Math.PI;
		if (y < 0) return inverseTangent + Math.PI * 2;
		return inverseTangent;

	};
	const angles = [
		0,
		vec3.angle([0,0,1], shape),
		getPolarAngle(shape),
	];

	// rotate shape to point straight up

	const twist = endRot - startRot;
	const section = extrudeFromSlices({
		numberOfSlices: Math.max(Math.floor(length / BELT_DETAIL), 4),
		callback: (progress, index, base) => {
			let pos = [];
			vec3.scale(pos, path, progress);
			const rot = startRot + (twist * progress);
			const edges = base.sides.map(side => side.map(point => {
				let stage1 = [];
				vec3.fromVec2(stage1, point);
				let stage2 = [];
				vec3.rotateZ(stage2, stage1, [0,0,0], rot);
				let stage3 = [];
				vec3.add(stage3, stage2, pos);
				return stage3;
			}));

			return { edges };
		}
		// TODO: add belt hobs
	}, rectangle({size: [1.38, 5]}));

	// rotate section to point back where it pointed
	return translate(startPos, rotate(angles, section));
};

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
		beltOffset: [10, 8],
		threads: [{ x: -10 , y: 0 }, { x: 10 , y: 0 }],
		pulley: PULLEYS[40],
		bedClearance: 0
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
		width,
		radius,
		x,
		delta,
		z,
		alpha,
		y,
	} = props;
	const xAxis = xAxi[2020];
	const zAxis = zAxi[2040];
	const tool = tools.hotEnds.microswiss.endCap;
	// const tool = tools.hotEnds.revo({ nutOffset: 3.7 });

	const carriageThickness = 5.5; // TODO: pass this to the carriage generation
	// TODO: get from gear list
	const spacerSize = 6;
	const vWheelThickness = 11;
	const wheelRadius = 11.945;
	const beltSize = { thickness: 1.38, width: 5 };

	const axisSpacing = 1;

	const wheelAxialOffset = (xAxis.depth + axisSpacing) / 2;

	const buildPlate = { radius, height: 5, center: { x: 22 - 5, y: 116, z: 10 } }
	const xAxisCenterY = buildPlate.center.y - tool.mount.y / 2;
	const zAxisCenterY = xAxisCenterY + axisSpacing + xAxis.depth;


	const carriageSize = {x: zAxis.width, z: xAxis.width};

	const wheelRadialOffset = 10;
	const xWheelSpread = 90; // 50 tooth pulleys
	const zWheelSpread = 80;
	const zWheelOffset = 0;
	const carriagePosition = {x: buildPlate.center.x + buildPlate.radius + zAxis.width / 2 + zAxis.bedClearance + wheelRadialOffset + wheelRadius, y: xAxisCenterY + wheelAxialOffset, z: 0 };

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
		const zRange = [wheelRadius, height - carriageClearance];
		return (zRange[1] - zRange[0]) * z + zRange[0] + (carriageCenter - lowestWheel);
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
		back: {
			left: [carriagePosition.x - zAxis.beltOffset[0], zAxisCenterY + zAxis.beltOffset[1]],
			right: [carriagePosition.x + zAxis.beltOffset[0], zAxisCenterY + zAxis.beltOffset[1]],
		}
	};
	const motorWidth = 42.3;
	const topPlateThickness = 8;
	const bottomPlateThickness = 8;

	const xzMotorPlane = motorWidth / 2 + topPlateThickness; // TODO this does not work, defined in multiple places?
	const getMotor = (endA, endB) => {
		let diagonal = [];
		vec2.subtract(diagonal, endA, endB);
		const motorRotation = vec2.angleRadians(diagonal) - Math.PI; // * i--;
		let centerXY = [];
		vec2.lerp(centerXY, endA, endB, .5);
		const center = [...centerXY, -xzMotorPlane];
		const pulleyPosition = 15;

		const diameter = vec2.length(diagonal) - beltSize.thickness;
		return [
			translate(center, rotateZ(motorRotation, translateY(-45 / 2 -  pulleyPosition, rotateX(-Math.PI / 2, getNema17WithPulley(diameter, pulleyPosition))))),
			{ translation: center, rotation: motorRotation, radius: diameter / 2 }
		];
	};

	const [motors, motorPositions] = [
		getMotor(joints.back.left, joints.bottom.left),
		getMotor(joints.bottom.right, joints.back.right),
	].divide();


	const getIdlerAt = (endA, endB) => {
		let diagonal = [];
		vec2.subtract(diagonal, endA, endB);
		const rotation = vec2.angleRadians(diagonal) - Math.PI;
		let centerXY = [];
		vec2.lerp(centerXY, endA, endB, .5);
		const center = [...centerXY, height + 19];
		const diameter = vec2.length(diagonal) - beltSize.thickness;
		return [
			translate(center, rotateZ(rotation, rotateX(-Math.PI / 2, getIdler(14, diameter)))),
			translate(center, rotateZ(rotation, rotateX(-Math.PI / 2, getIdlerNegative(15, diameter + (2 * beltSize.thickness))))),
			{ translation: center, rotation, radius: diameter / 2 }
		];
	};

	const [idlers, offSetIdlers, idlerPositions] = [
		getIdlerAt(joints.back.left, joints.top.left),
		getIdlerAt(joints.back.right, joints.top.right),
	].divide();


	const belts = union([
		getBeltSection([...joints.bottom.left, - xzMotorPlane], motorPositions[0].rotation + Math.PI, [...joints.bottom.left, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], 0),
		getBeltSection([...joints.bottom.right, - xzMotorPlane], motorPositions[1].rotation + Math.PI, [...joints.bottom.right, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], 0),

		getBeltSection([...joints.top.left, carriagePosition.z + (carriageSize.z / 2) + wheelRadialOffset + zPos], 0, [...joints.top.left, 20 + height], idlerPositions[0].rotation),
		getBeltSection([...joints.top.right, carriagePosition.z + (carriageSize.z / 2) + wheelRadialOffset + zPos], 0, [...joints.top.right, 20 + height], idlerPositions[1].rotation + Math.PI),

		getBeltSection([...joints.back.left, -xzMotorPlane], motorPositions[0].rotation, [...joints.back.left, 20 + height], idlerPositions[0].rotation),
		getBeltSection([...joints.back.right, -xzMotorPlane], motorPositions[1].rotation, [...joints.back.right, 20 + height], idlerPositions[1].rotation - Math.PI),

		translate([xWheels.bottom[0] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], getBeltRadius(wheelRadius, 0, Math.PI / 2)),
		translate([xWheels.bottom[1] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos], rotateY(-Math.PI / 2, getBeltRadius(wheelRadius, 0, Math.PI / 2))),
		translate([xWheels.top[0] + carriagePosition.x, xAxisCenterY, carriagePosition.z + (carriageSize.z / 2) + wheelRadialOffset + zPos], getBeltRadius(wheelRadius, Math.PI, 0)),

		motorPositions.map(motorPosition => translate(motorPosition.translation, rotateZ(motorPosition.rotation, getBeltRadius(motorPosition.radius, Math.PI, 0)))),
		idlerPositions.map(idlerPosition => translate(idlerPosition.translation, rotateZ(idlerPosition.rotation, getBeltRadius(idlerPosition.radius, 0, Math.PI)))),


		getBeltSection([xWheels.bottom[0] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0, [xPos - width, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0),
		getBeltSection([xWheels.bottom[1] + carriagePosition.x, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0, [xPos, xAxisCenterY, carriagePosition.z - (carriageSize.z / 2) - wheelRadialOffset + zPos + wheelRadius + beltSize.thickness / 2], 0),
	]);


	const amountOfArms = 1;

	const motorColors = [
		[.7, .7, .7], // XZ1 motor shaft
		[.3, .3, .3], // XZ1 motor body
		[.15, .15, .15], // XZ1 motor screws
		[.3, .3, .3], // XZ1 motor pulley
	];
	const vWheelColors = [
		[.8, .8, .8, .9], // wheel
		[.2, .2, .2], // bolt
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
		[1, .55, .2], // [.7, .7, .7], // carriage
		// [1, .55, .2], // tool holder end
		// [.15, .15, .15], // tool holder center
		// [.15, .15, .15], // tool holder top

		...tool.colors,

		[.2, .2, .2], // X axis
	];
	const zAxisColors = [
		// [1, .55, .2], // Z bottom motor mount 1
		// [1, .55, .2], // Z bottom motor mount 2
		// [1, .55, .2], // Z bottom
		[.2, .2, .2], // Z axis

		[1, .55, .2], // Z top
		// [.25, .25, .25], // Z top right screw
		// [.25, .25, .25], // Z top left screw
		[.2, .2, .2], // Z top left idler
		[.7, .7, .7], // Z top left idler axis
		[.2, .2, .2], // Z top right idler
		[.7, .7, .7], // Z top right idler axis
	];
	const colors = [
		...[...new Array(amountOfArms)].flatMap((_, index) => {
			return [
				...zAxisColors,
				...carriageColors,
				// [.2, .2, .2], // bottom brace
				[.15, .15, .15], // XZ belt
				...motorColors, // XY motor 1
				...motorColors, // XY motor 2
			];
		}),


		[.7, .7, .7], // bed bearing-inner
		[.7, .7, .7], // bed bearing-outer

		[.9, .9, .9, .8], // build plate

		// [.5, .5, .5], // rotary gear
		// [.5, .5, .5], // rotary standing gear
		// [.5, .5, .5], // rotary worm
		// [.5, .5, .5], // rotary shaft

		[.7, .7, .7], // rotary motor shaft
		[.3, .3, .3], // rotary motor body


		// [.75, .75, .75], // motor mounts

		[.75, .75, .75], // PSU
		// [.4, .2, .2], // mainBoard

		[.2, .2, .2, .7], // bottom plate
		[1, .55, .2, .7], // brim
		[.2, .2, .2, .7], // top plate



	];

	const box = {
		inner: {
			height: motorWidth + 8,
		},
		outer: {}
	};
	box.outer.height = topPlateThickness + box.inner.height + bottomPlateThickness;

	return translateZ(box.outer.height, [
		[...new Array(amountOfArms)].map((_, index) =>
			rotateZ(Math.PI * 2 / amountOfArms * index, [
				translate([carriagePosition.x, zAxisCenterY, 0], getZAxis(height, offSetIdlers, zAxis, motorPositions)),
				idlers,
				translate([carriagePosition.x, carriagePosition.y, carriagePosition.z + zPos], getCarriage(wheelPositions, 1)),
				translate([xPos - width, xAxisCenterY, carriagePosition.z + zPos], getXAxis(width, xAxis, tool)),
				// translate([0, zAxisCenterY + 20, 20], rotateY(Math.PI / 2, getExtrusion(249, 20, 40))),
				belts,
				motors,
			]),
		),
		getRotaryHub(delta, xzMotorPlane, buildPlate), // xzMotorPlane is not the right variable
		// getElectronics(),
		// getBox(box, [...Object.values(joints.bottom), ...Object.values(joints.back)], [...motorPositions, [ 50 - 5 - 7 - 1, 45 / 2 - 11.5, -Math.PI]]),
	])
		.map((object, index) => {
			return object.color ? object : colorize(colors[index] || [.0, .0, .0,], object)
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
		{ name: 'alpha', type: 'slider', initial: 0, min: 0, max: Math.PI, step: .1, caption: 'Alpha:' },
		{ name: 'z', type: 'slider', initial: .6, min: 0, max: 1, step: .01, caption: 'z:' },
		{ name: 'y', type: 'slider', initial: .6, min: 0, max: 1, step: .01, caption: 'y:' },

		{ name: 'renderer', type: 'group', caption: 'Render settings:' },
	]
};

module.exports = { main, getParameterDefinitions }

// rotary table with worm gear
// rotary table mounting options

// z-axis lead screw
// x-axis rack and pinion through lead-screw

