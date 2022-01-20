const jscad = require('@jscad/modeling');
const { union, subtract, intersect } = jscad.booleans;
const { cuboid, cylinder } = jscad.primitives;
const { translate, rotateZ } = jscad.transforms;

const { getBolt, BOLT_TYPES } = require('../bolts');

const boltSpacing = 31;
const nema17Width = 42.3;
const nema17CornerWidth = 51;
const axleSize = {
	height: 22,
	radius: 2.5,
	flat: {
		length: 20,
		depth: .5
	}
}
const roundLip = {
	height: 2,
	radius: 11
};

const getNema17 = (length, withBolts) => {
	const { motorBracketThickness } = require('../../prints/zBottom');
	const bolts = union([[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => translate([x * boltSpacing / 2, y * boltSpacing / 2, (length - 8) / 2 + motorBracketThickness], getBolt(BOLT_TYPES.M3, 8, { diameter: 5.5, height: 3}))));

	const body = union(
		subtract(
			intersect(
				cuboid({size: [nema17Width, nema17Width, length]}),
				rotateZ(Math.PI / 4, cuboid({size: [nema17CornerWidth, nema17CornerWidth, length]}))
			),
			bolts
		),
		cylinder({...roundLip, center: [0, 0, (length + 2) / 2]})
	);

	const axle = subtract(
		cylinder({ ...axleSize, center: [0, 0, (length + axleSize.height) / 2 + roundLip.height] }),
		cuboid({size: [axleSize.radius * 2, axleSize.flat.depth, axleSize.flat.length], center: [0, ((axleSize.radius * 2) - axleSize.flat.depth) / 2, (length - axleSize.flat.length) / 2 + roundLip.height + axleSize.height]})
	);
	return [
		axle,
		body,
		withBolts ? bolts : []
	];
};

module.exports = {
	getNema17,
	nema17Width,
	nema17dimensions: {
		width: nema17Width,
		axle: axleSize,
		lip: roundLip,
		boltSpacing
	}
}
