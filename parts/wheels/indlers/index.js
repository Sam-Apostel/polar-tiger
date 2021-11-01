const jscad = require('@jscad/modeling');
const {getBolt} = require("../../bolts");
const {myCylinder} = require("../../../utils/geometry");
const { translateZ } = jscad.transforms;
const { union, subtract } = jscad.booleans;
const { cylinder } = jscad.primitives;


const getIdler = (boltLength, size) => {
	const smallWidth =  5.4;
	const brimWidth = .5;
	const bigWidth = smallWidth + ( brimWidth * 2 );
	const smallRadius = size / 2;
	const bigRadius = smallRadius + 1
	const bearing = cylinder({ height: bigWidth - 1.7, radius: 16.35 / 2, center: [0, 0, 1.7 / 2] });
	const wheelInside = cylinder({ height: bigWidth, radius: 13 / 2 });

	const wheelOutside = union(
		translateZ(-(bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),
		myCylinder(bigWidth, smallRadius),
		translateZ(+(bigWidth - brimWidth) / 2, myCylinder(brimWidth, bigRadius)),

	);

	const idler = subtract(wheelOutside, [wheelInside, bearing]);

	if (!boltLength) return idler;

	return [
		idler,
		getBolt(4.65, boltLength)
	];
};

const getIdlerNegative = (boltLength, size) => {
	const smallWidth =  5.4;
	const brimWidth = .5;
	const bigWidth = smallWidth + ( brimWidth * 2 ) + 2;
	const smallRadius = (size + 2) / 2;

	const wheelOutside = union(
		myCylinder(bigWidth, smallRadius),

	);

	if (!boltLength) return wheelOutside;

	return [
		wheelOutside,
		getBolt(5, boltLength)
	];
};

module.exports = {
	getIdler,
	getIdlerNegative
}
