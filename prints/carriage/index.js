const jscad = require('@jscad/modeling');
const { translate, rotateX, translateZ, translateY, rotateZ } = jscad.transforms;
const { subtract, union } = jscad.booleans;
const { polygon, ellipse, rectangle, roundedCuboid, cylinder, cuboid } = jscad.primitives;
const { offset } = jscad.expansions;
const { extrudeLinear, extrudeRotate } = jscad.extrusions;

const { getVWheel } = require("../../parts/wheels/vWheels");

const getCarriage = (wheelPositions, axisSpacing) => {
	const wheel = getVWheel(20);

	const plateThickness = 5;
	const wheels = wheelPositions.map(({ translation, rotation }) => translate(translation, rotateX(rotation, wheel )));

	const wheelPositionsSorted = [6, 1, 5, 2, 3, 0, 4];
	const zWheels = [6, 5, 3, 4];
	const xWheel = [1, 2, 0];

	const brimSize = 9;
	const brimInnerCornerRadius = 4;

	const wheelNubRadius = 4.5;

	const extrusionDepth = 20;
	const vWheelThickness = 11;
	const wheelNubDepth = (extrusionDepth - vWheelThickness) / 2 - (plateThickness / 2 - 1.5 * axisSpacing);

	const extrusionSpacing = 2;
	const negative = union(
		...wheels,
		roundedCuboid({ size: [110, 20 + extrusionSpacing, 20 + extrusionSpacing], center: [0, -10 - axisSpacing / 2, 0], roundRadius: 3, segments: 16 }),
		roundedCuboid({ size: [40 + extrusionSpacing, 20 + extrusionSpacing, 110], center: [0, 10 + axisSpacing / 2, 0], roundRadius: 3, segments: 16 }),
	);
	const getPlate = (indexes, yOffset, layer) => {
		const shape = polygon( {points: indexes.map(index => {
				const { translation } = wheelPositions[index];
				return [translation[0], translation[2]];
			})});

		const nub = translateZ((plateThickness + (wheelNubDepth)) / 2, extrudeRotate({ segments: 32 },
			subtract(
				rectangle({size: [wheelNubRadius + 4.5, (wheelNubDepth)], center: [(wheelNubRadius + 4.5) / 2, 0]}),
				ellipse({radius: [4.5, (wheelNubDepth)], center: [wheelNubRadius + 4.5, (wheelNubDepth) /2]})
			)
		));

		const nubs = translateZ( plateThickness / 2, indexes.map(index => {
			const { translation, rotation } = wheelPositions[index];
			return  translate([translation[0], translation[2], 0], rotateX(rotation + Math.PI / 2 * (layer !== 1 ? -1 : 1 ), nub));
		}));

		return subtract(
			translateY( plateThickness / 2 + yOffset, rotateX( Math.PI / 2,
				union(...[
					subtract(
						translateZ(layer === 2 ? -(wheelNubDepth * 2 + 11) : 0, extrudeLinear( {height: plateThickness + (wheelNubDepth + 11 / 2) * (layer === 1 ? 0 : 2)}, offset({ delta: -brimInnerCornerRadius, corners: 'round', segments: 32}, offset({ delta: brimSize + brimInnerCornerRadius, corners: 'round', segments: 32}, shape)))),
						...(layer !== 1 ? indexes.map(index => {
							const { translation, rotation } = wheelPositions[index];
							const fullRotation = rotation + Math.PI / 2 * (layer !== 1 ? -1 : 1 );
							return translate([translation[0], translation[2], 0], rotateX(fullRotation, cuboid({ size: [29, 28, 11 + wheelNubDepth * 2], center: [0, 0, (11 / 2 + wheelNubDepth) + (fullRotation ? 0 : plateThickness)] })));
						}) : [])
					),
					nubs
				])
			)),
			negative
		);
	}

	const zPlate = getPlate(zWheels, 20 + axisSpacing, 0);
	const middlePlate = getPlate(wheelPositionsSorted, 0, 1);
	const xPlate = getPlate(xWheel, -20 - axisSpacing, 2);



	return [
		wheels,
		union(
			middlePlate,
			zPlate,
			xPlate,
		)
		// negative
	];
};


module.exports = {
	main: getCarriage, getCarriage
}
