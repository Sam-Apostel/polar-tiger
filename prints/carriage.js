const jscad = require('@jscad/modeling');
const { translate, rotateX, rotateY, translateZ, translateY } = jscad.transforms;
const { subtract, union } = jscad.booleans;
const { polygon, ellipse, rectangle, roundedCuboid, cuboid, cylinder } = jscad.primitives;
const { offset } = jscad.expansions;
const { extrudeLinear, extrudeRotate } = jscad.extrusions;

const { getVWheel } = require("../parts/wheels/vWheels");

const getCarriage = (wheelPositions, axisSpacing) => {
	const plateThickness = 6;
	const extrusionSpacing = 2;
	const boltLength = 20;

	const wheel = getVWheel(boltLength, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2);
	const altWheel = getVWheel(boltLength, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2 - 1.5);
	const negativeWheel = getVWheel(boltLength, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2, true);
	const negativeAltWheel = getVWheel(boltLength, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2 - 1.5, true);

	const wheels = wheelPositions.map(({ translation, rotation }, index) => translate(translation, rotateX(rotation, index === 2 ? altWheel : wheel )));
	const negativeWheels = wheelPositions.map(({ translation, rotation }, index) => translate(translation, rotateX(rotation, index === 2 ? negativeAltWheel : negativeWheel )));

	const wheelPositionsSorted = [6, 1, 5, 2, 3, 0, 4];
	const zWheels = [6, 5, 3, 4];
	const xWheel = [1, 2, 0];

	const brimSize = 9;
	const brimInnerCornerRadius = 4;



	const extrusionDepth = 20;
	const vWheelThickness = 11;
	const wheelNubDepth = (extrusionDepth - vWheelThickness - plateThickness + axisSpacing) / 2;


	const negative = union(
		...negativeWheels,
		roundedCuboid({ size: [200, 20 + extrusionSpacing, 20 + extrusionSpacing], center: [0, -10 - axisSpacing / 2, 0], roundRadius: 3, segments: 16 }),
		roundedCuboid({ size: [40 + extrusionSpacing, 20 + extrusionSpacing, 200], center: [0, 10 + axisSpacing / 2, 0], roundRadius: 3, segments: 16 }),
	);

	const wheelNubContactRadius = 4.5;
	const nubSpread = 4.5
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
					cuboid({ size: [29, 14 + 2, 11 + wheelNubDepth * 2], center: [0, 2 / 2 * ([6,4].includes(index) ? -1 : 1), (11 / 2 + wheelNubDepth) + plateThickness] }),
					translate([0, 14 / 2 * ([6,4].includes(index) ? 1 : -1), (11 / 2 + wheelNubDepth) + plateThickness], rotateY(Math.PI / 2, cylinder({ radius: (11 + wheelNubDepth * 2) / 2, height: 100 })))
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
	];
};


module.exports = {
	main: getCarriage, getCarriage
}
