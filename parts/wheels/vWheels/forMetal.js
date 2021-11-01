const jscad = require('@jscad/modeling');
const {getSocketScrew} = require("../../bolts");
const {BOLT_TYPES} = require("../../bolts");
const { myCylinder } = require("../../../utils/geometry");
const { translateZ, translateY, rotateZ } = jscad.transforms;
const { union } = jscad.booleans;
const { cylinder } = jscad.primitives;

const getVWheel = (boltLength, concentric) => {
	// const bigWidth = 10.23;
	const bigWidth = 11;
	const smallWidth =  5.89;
	const cornerWidth = (bigWidth - smallWidth) / 2;
	const bigRadius = 23.89 / 2;
	const smallRadius = bigRadius - cornerWidth;
	const wheelInside = myCylinder(bigWidth, BOLT_TYPES.M5 / 2 + .1)

	const wheelOutside = union(
		translateZ(-(bigWidth - cornerWidth) / 2, myCylinder(cornerWidth, smallRadius, bigRadius)),
		myCylinder(smallWidth, bigRadius),
		translateZ((bigWidth - cornerWidth) / 2, myCylinder(cornerWidth, bigRadius, smallRadius)),

	);
	const nut = cylinder({radius: 4.5, height: 3.2, segments: 6});
	const spacerSize = 6;

	const getSpacer = () => {
		if (concentric) {
			return union(
				cylinder({ height: spacerSize, radius: 9 / 2, segments: 6, center: [0, .5, 0] }),
				cylinder({ height: 1, radius: 10.5 / 2, center: [0, .5, -(spacerSize - 1) / 2] }),
				cylinder({ height: 2.5, radius: 7.5 / 2, center: [0, .5, -(spacerSize + 2.5) / 2] }),
			)
		}
		return cylinder({ height: spacerSize, radius: 10.5 / 2 });
	};
	const getBolt = () => {
		if (concentric) {
			return translateY( 1 / 2, getSocketScrew(BOLT_TYPES.M5 + .4 + 1, boltLength + .1, {diameter: 9.7 + 1, height: 3.6, smallDiameter: 4.7 + 1}));
		}
		return getSocketScrew(BOLT_TYPES.M5 + .4, boltLength + .1, {diameter: 9.7, height: 3.6, smallDiameter: 4.7});
	};
	return [
		wheelOutside,
		translateZ(-(boltLength - bigWidth ) / 2 + 3.2 * 2, getBolt()),
		translateZ(-(bigWidth + spacerSize) / 2 , getSpacer()),
		union(
			translateZ((bigWidth + 3.2) / 2, nut),
			rotateZ(4, translateZ((bigWidth + 3.2 ) / 2 + 3.2, nut)),
		)
	];
};


module.exports = {
	getVWheel
}
