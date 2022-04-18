const jscad = require('@jscad/modeling');
const { translate, rotateX, rotateY, rotateZ, translateZ, translateY } = jscad.transforms;
const { subtract, union } = jscad.booleans;
const { polygon, ellipse, rectangle, roundedCuboid, cuboid, cylinder, sphere } = jscad.primitives;
const { offset } = jscad.expansions;
const { extrudeLinear, extrudeRotate } = jscad.extrusions;

const { getVWheel } = require("../parts/wheels/vWheels");

const getCarriage = (wheelPositions, axisSpacing) => {
	const plateThickness = 6;
	const extrusionSpacing = 2;
	const boltLength = 20;
	const extrusionDepth = 20;
	const boltPosition = -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2 + 1.5;
	const nutPosition = (extrusionDepth + plateThickness + extrusionSpacing / 2) / 2;
	const heatedInsetSize = 5.34;
	const vWheelThickness = 11;

	const wheel = getVWheel(boltLength, boltPosition, nutPosition);
	const negativeWheel = getVWheel(boltLength, boltPosition, nutPosition, true);
	const altWheel = getVWheel(boltLength, boltPosition - 1.5, heatedInsetSize + vWheelThickness / 2);
	const negativeAltWheel = getVWheel(boltLength, boltPosition - 1.5, heatedInsetSize + vWheelThickness / 2, true);

	const wheels = wheelPositions.map(({ translation, rotation }, index) => translate(translation, rotateX(rotation, index === 2 ? altWheel : wheel )));
	const negativeWheels = wheelPositions.map(({ translation, rotation }, index) => translate(translation, rotateX(rotation, index === 2 ? negativeAltWheel : negativeWheel )));

	const wheelPositionsSorted = [6, 1, 5, 2, 3, 0, 4];
	const zWheels = [6, 5, 3, 4];
	const xWheel = [1, 2, 0];

	const brimSize = 9;
	const brimInnerCornerRadius = 4;

	const wheelNubDepth = (extrusionDepth - vWheelThickness - plateThickness + axisSpacing) / 2;

	const aDiagonal = edgeLength => Math.sqrt(edgeLength * edgeLength / 2);

	const getEndStop = () => {
		return [
			cuboid({ size: [6.6, 20, 10.5]}),
			translate([0, -16.5 / 2, 10.5 / 2], rotateX(Math.PI / 12, cuboid({ size: [4, 16.5, .4], center: [0, 16.5 / 2, 0] })))
		];
	}

	const endstopNegative = translate([-40 + 4.5 / 2, (plateThickness + 7) / 2, 6], rotateY(-Math.PI / 2, rotateZ(Math.PI / 2,
		subtract(
			cuboid({ size: [6.6 + .4, 20 + .4, 15]}),
			sphere({ radius: 2.5 / 2 - .2, center: [(6.6 + .4 + .8) / 2, 20 / 2 - 3.85, 15 / 2 - 7.75] }),
			sphere({ radius: 2.5 / 2 - .2, center: [(6.6 + .4 + .8) / 2, -(20 / 2 - 3.85), 15 / 2 - 7.75] }),
			sphere({ radius: 2.5 / 2 - .2, center: [-(6.6 + .4 + .8) / 2, 20 / 2 - 3.85, 15 / 2 - 7.75] }),
			sphere({ radius: 2.5 / 2 - .2, center: [-(6.6 + .4 + .8) / 2, -(20 / 2 - 3.85), 15 / 2 - 7.75] }),
		)
	)));

	const negative = union(
		...negativeWheels,
		endstopNegative,

		// z-axis
		roundedCuboid({ size: [40 + extrusionSpacing, 20 + extrusionSpacing, 200], center: [0, 10 + axisSpacing / 2, 0], roundRadius: 3, segments: 16 }),

		// x-axis
		roundedCuboid({ size: [200, 20 + extrusionSpacing, 20 + extrusionSpacing - 2], center: [0, -10 - axisSpacing / 2, -2 / 2], roundRadius: 3, segments: 16 }), // rounded hole (bottom)
		cuboid({ size: [200, 20 + extrusionSpacing, 5], center: [0, -10 - axisSpacing / 2, (20 + extrusionSpacing - 5) / 2 - 2] }), // square hole (top)
		translate([0, -10 - axisSpacing / 2, (20 + extrusionSpacing) / 2 - 2], rotateX(Math.PI / 4, cuboid({ size: [200, aDiagonal(20 + extrusionSpacing), aDiagonal(20 + extrusionSpacing)] }))), // diagonal (top)

	);

	const wheelNubContactRadius = 4.4;
	const nubSpread = 4.5;
	const nub = translateZ((plateThickness + (wheelNubDepth)) / 2, extrudeRotate({ segments: 32 },
		subtract(
			rectangle({size: [wheelNubContactRadius + nubSpread, wheelNubDepth], center: [(wheelNubContactRadius + nubSpread) / 2, 0]}),
			ellipse({radius: [nubSpread, wheelNubDepth], center: [wheelNubContactRadius + nubSpread, wheelNubDepth /2]})
		)
	));

	const getPlate = (indexes, yOffset, layer) => {
		const shape = polygon( {points: indexes.map(index => {
				const { translation } = wheelPositions[index];
				return [translation[0], translation[2]];
			})});

		const offsetShape = offset(
			{ delta: -brimInnerCornerRadius, corners: 'round', segments: 32},
			offset(
				{ delta: brimSize + brimInnerCornerRadius, corners: 'round', segments: 32},
				shape
			)
		);

		const blockThickness = plateThickness + (wheelNubDepth * 2 + vWheelThickness) * (layer === 0 ? 1 : 0);
		const block = extrudeLinear({ height:  blockThickness}, offsetShape);

		const nubDirection = layer !== 1 ? 1 : -1 ;
		const nubs = translateY( yOffset, indexes.map(index => {
			const { translation, rotation } = wheelPositions[index];
			return  translate([translation[0], 0, translation[2]], rotateX(rotation * nubDirection, nub));
		}));

		const wheelHoles = layer === 0 ? indexes.map(index => {
			const { translation, rotation } = wheelPositions[index];
			const fullRotation = rotation + Math.PI / -2;
			return translate([translation[0], translation[2], 0], rotateX(fullRotation,
				union(
					cuboid({ size: [29, 14 + 2, vWheelThickness + (wheelNubDepth * 2)], center: [0, 2 / 2 * ([6,4].includes(index) ? -1 : 1), (vWheelThickness / 2) + wheelNubDepth + plateThickness] }),
					translate([0, 14 / 2 * ([6,4].includes(index) ? 1 : -1), (vWheelThickness / 2) + wheelNubDepth + plateThickness], rotateY(Math.PI / 2, cylinder({ radius: (vWheelThickness / 2) + wheelNubDepth, height: 100 })))
				)
			));
		}) : [];

		return subtract(
			union(
				translateY(yOffset + plateThickness / 2, rotateX( Math.PI / 2,
					subtract(
						block,
						wheelHoles
					)
				)),
				nubs
			),
			negative
		);
	}

	const zPlate = getPlate(zWheels, axisSpacing + extrusionDepth, 0);
	const middlePlate = getPlate(wheelPositionsSorted, 0, 1);
	const xPlate = getPlate(xWheel, -extrusionDepth - axisSpacing, 2);

	const zBlock = union(middlePlate, zPlate);

	return [
		wheels,
		zBlock,
		xPlate,
		// translate([-40, (plateThickness + 7) / 2, 6], rotateY(-Math.PI / 2, rotateZ(Math.PI / 2, getEndStop())))
	];
};


module.exports = {
	main: getCarriage, getCarriage
}
