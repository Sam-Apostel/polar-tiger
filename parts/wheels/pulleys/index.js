const jscad = require('@jscad/modeling');
const {BOLT_TYPES, getSocketScrew} = require("../../bolts");
const {getBolt} = require("../../bolts");
const {myCylinder} = require("../../../utils/geometry");
const { translateZ, translateX, rotateY, rotateZ} = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder, cuboid } = jscad.primitives;

const smallWidth = 5.4;
const brimWidth = .5;
const bigWidth = smallWidth + ( brimWidth * 2 );
const getPrintablePulley = ({ teeth, od: size }) => {
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
const getPulley60T = (asIdler, negative) => {
	const teeth = 60;
	const smallRadius = 37.7 / 2;
	const bigRadius = 42.2 / 2;
	const bigWidth = 10;
	const smallWidth = 7;
	const brimWidth = (bigWidth - smallWidth) / 2;
	const wheelInside = myCylinder(bigWidth, BOLT_TYPES.M5 / 2)
	const pit = cylinder({ radius: .7, height: smallWidth, center: [smallRadius, 0, 0]});
	const pitch = Math.PI * 2 / teeth;
	const pits = [...new Array(teeth)].map((_, index) => rotateZ(pitch * index, pit));

	if (asIdler && negative) {
		return union(
			myCylinder(bigWidth + 1, bigRadius + 1, undefined, 512),
			translateZ(-(bigWidth + 6) / 2, myCylinder(6 + .8, 25 / 2 + .4)),
			translateZ((30 - bigWidth) / 2 - 6 - 2.7, getSocketScrew(BOLT_TYPES.M5 + .3, 37, {diameter: 9.7, height: 3.6, smallDiameter: 4.7})),
			translateZ(10, cylinder({ radius: 6.4 / 2, height: 10 }))
			// todo: bearing
		);
	}

	const wheelOutside = subtract(
		union(
			translateZ(-(bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),
			myCylinder(bigWidth, smallRadius),
			translateZ((bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),
			translateZ(-(bigWidth + 6) / 2, myCylinder(6, 25 / 2)),
		),
		pits,
	);


	if (asIdler) {
		return [
			subtract(wheelOutside, wheelInside),
			translateZ((30 - bigWidth) / 2 - 6 - 2.7, getSocketScrew(BOLT_TYPES.M5, 30, {diameter: 9.7, height: 3.6, smallDiameter: 4.7}))
			// todo: bearing
		];
	}
	return subtract(wheelOutside, wheelInside);
};

const getPulley = ({ teeth, od: size }, asIdler, negative) => {
	if (teeth === 60) return getPulley60T(asIdler, negative);
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
	getPulley,
	getPrintablePulley,
	pulleyWidth: bigWidth
}
