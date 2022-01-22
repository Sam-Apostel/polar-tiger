const jscad = require('@jscad/modeling');
const {getBolt} = require("../../bolts");
const {myCylinder} = require("../../../utils/geometry");
const { translateZ, rotateX } = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder } = jscad.primitives;

const smallWidth =  6;
const brimWidth = .5;
const getIdler = (boltLength, size) => {
	const bigWidth = smallWidth + ( brimWidth * 2 );
	const smallRadius = size / 2;
	const bigRadius = smallRadius + 1.38
	const bearing = cylinder({ height: 5, radius: 16.35 / 2, center: [0, 0, 1.7 / -2] });
	const wheelInside = cylinder({ height: bigWidth, radius: 9 / 2 });

	const wheelOutside = union(
		translateZ(-(bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),
		myCylinder(bigWidth, smallRadius),
		translateZ(+(bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),

	);

	const idler = subtract(wheelOutside, [wheelInside, bearing]);

	if (!boltLength) return idler;

	return [
		idler,
		translateZ((boltLength - bigWidth) / 2, rotateX(Math.PI, getBolt(4.89, boltLength, { diameter: 8.48, height: 5})))
	];
};

const getIdlerNegative = (boltLength, size) => {
	const bigWidth = smallWidth + ( brimWidth * 2 ) + 2;
	const smallRadius = (size + 2) / 2;

	const wheelOutside = union(
		myCylinder(bigWidth, smallRadius),

	);

	if (!boltLength) return wheelOutside;

	return [
		wheelOutside,
		translateZ((boltLength - bigWidth) / 2, getBolt(5, boltLength))
	];
};

module.exports = {
	getIdler,
	getIdlerNegative
}
