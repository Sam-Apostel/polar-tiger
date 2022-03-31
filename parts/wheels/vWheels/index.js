const jscad = require('@jscad/modeling');
const { getBolt, BOLT_TYPES } = require("../../bolts");
const { myCylinder } = require("../../../utils/geometry");
const { translateZ, rotateX } = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder } = jscad.primitives;

const getVWheel = (boltLength, boltPosition, negative) => {
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
	const negativeNutOffset = 4;
	const nut = negative
		? cylinder({radius: 4.5, height: nutSize + negativeNutOffset, segments: 6})
		: subtract(
			cylinder({radius: 4.5, height: nutSize, segments: 6}),
			cylinder({radius: (BOLT_TYPES.M5 + .4) / 2 , height: nutSize, segments: 32}),
		);

	const heatedInsetSize = 9.5
	const heatedInsert = negative
		? cylinder({ radius: 3.1, height: heatedInsetSize })
		: subtract(
			cylinder({ radius: 3.1, height: heatedInsetSize }),
			cylinder({radius: (BOLT_TYPES.M5 + .4) / 2 , height: heatedInsetSize, segments: 32})
		);

	const bolt = rotateX(Math.PI, getBolt(BOLT_TYPES.M5 + .4, boltLength, { diameter: 8.5, height: 5 }));

	return ( [
		wheelOutside,
		...translateZ(1.5,
			[
				translateZ(boltPosition, bolt),
				translateZ((boltLength - nutSize + (negative ? negativeNutOffset : 0)) / 2 + boltPosition, nut),
				// translateZ((boltLength - heatedInsetSize + (negative ? 2 : 0)) / 2 + boltPosition, heatedInsert),
			]
		)
	]);
};


module.exports = {
	getVWheel
}
