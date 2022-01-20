const jscad = require('@jscad/modeling');
const { union, subtract, intersect } = jscad.booleans;
const { cuboid, cylinder, roundedCuboid } = jscad.primitives;
const { translate, translateY, rotateX, rotateY, rotateZ, translateZ } = jscad.transforms;

const {getBolt, BOLT_TYPES} = require('../parts/bolts');

const cornerRadius = 1.52;
const pegLength = 6;
const pegOffset = .2;
const centerHoleSizes = [12 - pegOffset * 2, 12 - pegOffset * 2, 5.3 - pegOffset * 2, 16.3 - pegOffset * 2];
const getZTopIdler = (height, offsetIdlers, zAxisProfile) => {

	const base = intersect(
		roundedCuboid({ size: [zAxisProfile.width, zAxisProfile.depth, height + cornerRadius], roundRadius: cornerRadius, center: [0, 0, -cornerRadius / 2], segments: 64 }),
		cuboid({ size: [zAxisProfile.width, zAxisProfile.depth, height] })
	);
	const topHolePins = zAxisProfile.threads.map(({x, y}) => translate( [x, y, -( height + pegLength) / 2], getBolt(BOLT_TYPES.M5 - pegOffset * 2, pegLength, false)));
	const centerHoleStraightPin = cuboid({ size: [centerHoleSizes[0], centerHoleSizes[0], pegLength]});
	const centerHoleDiagonalPin = rotateZ(Math.PI / 4, cuboid({ size: [centerHoleSizes[1], centerHoleSizes[1], pegLength]}));
	const centerHoleDepthPin = cuboid({ size: [centerHoleSizes[2], centerHoleSizes[3], pegLength]});
	const centerHolePin = translateZ(-( height + pegLength) / 2,
		union(
			intersect(centerHoleStraightPin, centerHoleDiagonalPin ),
			centerHoleDepthPin
		)
	);
	return subtract(
		union(
			base,
			topHolePins,
			centerHolePin
		),
		offsetIdlers
	);
};

module.exports = {
	getZTopIdler
}
