const jscad = require('@jscad/modeling');
const { getBolt, BOLT_TYPES } = require("../../bolts");
const { myCylinder } = require("../../../utils/geometry");
const { translateZ, rotateX, scaleY } = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder } = jscad.primitives;

const getVWheel = (boltLength, boltPosition, nutPosition, stretchZ = 1, negative) => {
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

	const heatedInsetSize = 5.34;
	const heatedInsert = negative
		? cylinder({ radius: 3.15, height: heatedInsetSize })
		: subtract(
			cylinder({ radius: 3.2, height: heatedInsetSize }),
			cylinder({radius: (BOLT_TYPES.M5 + .4) / 2 , height: heatedInsetSize, segments: 32})
		);

	const bolt = rotateX(Math.PI, getBolt(BOLT_TYPES.M5 + .4, boltLength, { diameter: 8.45 + (negative ? .25 : 0), height: 5 }));

	return ( [
		wheelOutside,
		scaleY(stretchZ, [
			translateZ(boltPosition, bolt),
			// translateZ((boltLength - nutSize + (negative ? negativeNutOffset : 0)) / 2 + boltPosition, nut),
			translateZ((nutPosition - (heatedInsetSize / 2)), heatedInsert),
		])
	]);
};


module.exports = {
	getVWheel
}
