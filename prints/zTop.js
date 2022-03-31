const jscad = require('@jscad/modeling');
const { union, subtract, intersect } = jscad.booleans;
const { cuboid } = jscad.primitives;
const { rotateZ, translateZ } = jscad.transforms;

const pegLength = 6;
const pegOffset = .2;
const centerHoleSizes = [12 - pegOffset * 2, 12 - pegOffset * 2, 5.3 - pegOffset * 2, 16.3 - pegOffset * 2];
const getZTopIdler = (height, offsetIdlers, zAxisProfile) => {

	const base = cuboid({ size: [zAxisProfile.width, centerHoleSizes[3], height]  });
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
			centerHolePin
		),
		cuboid({ size: [15, centerHoleSizes[3], 15], center: [0, 0, -3.5] }),
		offsetIdlers
	);
};

module.exports = {
	getZTopIdler
}
