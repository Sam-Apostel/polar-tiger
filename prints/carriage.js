const jscad = require('@jscad/modeling');
const { translate, rotateX, translateZ, translateY } = jscad.transforms;
const { subtract, union, intersect } = jscad.booleans;
const { polygon, ellipse, rectangle, roundedCuboid, cuboid } = jscad.primitives;
const { offset } = jscad.expansions;
const { extrudeLinear, extrudeRotate } = jscad.extrusions;

const { getVWheel } = require("../parts/wheels/vWheels");

const getCarriage = (wheelPositions, axisSpacing) => {
	const plateThickness = 7;
	const extrusionSpacing = 2;

	const wheel = getVWheel(30, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2);
	const altWheel = getVWheel(30, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2 + (plateThickness - axisSpacing + extrusionSpacing) / 2);
	const negativeWheel = getVWheel(30, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2, true);
	const negativeAltWheel = getVWheel(30, -((plateThickness - 4.5) + (axisSpacing - 2.5)) / 2 + (plateThickness - axisSpacing + extrusionSpacing) / 2, true);

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

		const wheelHoles = layer !== 1 ? indexes.map(index => {
			const { translation, rotation } = wheelPositions[index];
			const fullRotation = rotation + Math.PI / 2 * (layer !== 1 ? -1 : 1 );
			return translate([translation[0], translation[2], 0], rotateX(fullRotation, cuboid({ size: [29, 28, 11 + wheelNubDepth * 2], center: [0, 0, (11 / 2 + wheelNubDepth) + (fullRotation ? 0 : plateThickness)] })));
		}) : [];

		return subtract(
				union(
					translateY( yOffset + plateThickness / 2, rotateX( Math.PI / 2,
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
	// const seperator = translateZ(100, cuboid({ size: [200, 200, 200] }));
	// const zBlockTop = intersect(zBlock, seperator);
	// const zBlockBottom = subtract(zBlock, seperator);

	return [
		wheels,
		zBlock,
		xPlate,
	];
};


module.exports = {
	main: getCarriage, getCarriage
}
