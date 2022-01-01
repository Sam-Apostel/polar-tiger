const jscad = require('@jscad/modeling');
const { getBolt, getSocketScrew, BOLT_TYPES } = require("../../bolts");
const { myCylinder } = require("../../../utils/geometry");
const { translateZ, rotateZ, rotateX } = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder } = jscad.primitives;

const getVWheel = (boltLength, boltPosition, negative) => {
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
	const nut = negative
		? cylinder({radius: 4.5, height: nutSize + 2, segments: 6})
		: subtract(
			cylinder({radius: 4.5, height: nutSize, segments: 6}),
			cylinder({radius: (BOLT_TYPES.M5 + .4) / 2 , height: nutSize, segments: 32}),
		);

	// const bolt = rotateX(Math.PI, getBolt(BOLT_TYPES.M5 + .4, boltLength, { diameter: 8.5, height: 5 }));
	const bolt =  getSocketScrew(BOLT_TYPES.M5 + .4, boltLength, {diameter: 9.7, height: 3.6, smallDiameter: 4.7}, negative);

	return rotateX(Math.PI, [
		wheelOutside,
		...translateZ(1.5,
			[
				translateZ(boltPosition, bolt),
				translateZ((boltLength - nutSize + (negative ? 2 : 0)) / 2 + boltPosition, nut),
			]
		)
	]);
};


module.exports = {
	getVWheel
}
