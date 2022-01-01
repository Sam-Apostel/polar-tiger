const jscad = require('@jscad/modeling');
const {BOLT_TYPES} = require("../../bolts");
const {getBolt} = require("../../bolts");
const {myCylinder} = require("../../../utils/geometry");
const { translateZ, translateX, rotateY, rotateZ} = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder, cuboid } = jscad.primitives;

const getPulley = ({ teeth, od: size }) => {
	const smallWidth = 5.4;
	const brimWidth = .5;
	const bigWidth = smallWidth + ( brimWidth * 2 );
	const smallRadius = size / 2;
	const bigRadius = smallRadius + 1.38;
	const wheelInside = myCylinder(bigWidth, BOLT_TYPES.M5 / 2 + .3)
	const pit = cylinder({ radius: .7, height: smallWidth, center: [smallRadius + .555, 0, 0]});
	const pitch = Math.PI * 2 / teeth;
	const pits = [...new Array(teeth)].map((_, index) => rotateZ(pitch * index, pit));

	const wheelOutside = subtract(
		union(
			translateZ(-(bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),
			myCylinder(bigWidth, smallRadius + .6),
			translateZ((bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),

		),
		pits,
		translateX((10 + BOLT_TYPES.M5)/ 2, rotateY(Math.PI / 2, getBolt(BOLT_TYPES.M3 + .2, 10, { diameter: 5.7, height: size / 2 - 10 }))),
		cuboid({ size: [2.6, 5.8, bigWidth], center: [3 + BOLT_TYPES.M5, 0, 0]})
	);

	return subtract(wheelOutside, wheelInside);
};


module.exports = {
	getPulley
}
