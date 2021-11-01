const jscad = require('@jscad/modeling');
const { getBolt } = require("../../bolts");
const { BOLT_TYPES } = require("../../bolts");
const { myCylinder } = require("../../../utils/geometry");
const { translateZ, rotateZ, rotateX } = jscad.transforms;
const { union } = jscad.booleans;
const { cylinder } = jscad.primitives;

const getVWheel = (boltLength) => {
	// const bigWidth = 10.23;
	const bigWidth = 11;
	const smallWidth =  5.89;
	const cornerWidth = (bigWidth - smallWidth) / 2;
	const bigRadius = 23.89 / 2;
	const smallRadius = bigRadius - cornerWidth;

	const wheelOutside = union(
		translateZ(-(bigWidth - cornerWidth) / 2, myCylinder(cornerWidth, smallRadius, bigRadius)),
		myCylinder(smallWidth, bigRadius),
		translateZ((bigWidth - cornerWidth) / 2, myCylinder(cornerWidth, bigRadius, smallRadius)),

	);

	const nutSize = 3.2;
	const nut = cylinder({radius: 4.5, height: nutSize + 1 + 1, segments: 6});

	const bolt = rotateX(Math.PI, getBolt(BOLT_TYPES.M5 + .4, boltLength, { diameter: 8.5, height: 5 }));

	return [
		wheelOutside,
		...translateZ(2,
			[
				translateZ(0, bolt),
				translateZ((boltLength - nutSize + 1 - 1) / 2, nut),
			]
		)
	];
};


module.exports = {
	getVWheel
}
