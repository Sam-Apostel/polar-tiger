const jscad = require('@jscad/modeling');
const { myCylinder } = require("../../utils/geometry");
const { translateZ } = jscad.transforms;
const { cylinder } = jscad.primitives;
const { union, subtract } = jscad.booleans;


const BOLT_TYPES = {
	M5: 5,
	M4: 4,
	M3: 3
};

const getBolt = (diameter, length, head = false) => {
	if (!head) return cylinder({radius: diameter / 2, height: length});

	return union(
		getBolt(diameter, length),
		translateZ(  (length + head.height) / 2, getBolt(head.diameter, head.height)),
	);
};

const getSocketScrew = (diameter, length, head = false, negative) => {
	if (!head) return cylinder({radius: diameter / 2, height: length});

	if (negative) {
		return union(
			getBolt(diameter, length),
			translateZ( -(length - head.height) / 2,
				myCylinder(head.height, head.diameter / 2, (head.smallDiameter || head.diameter) / 2)
			)
		);
	}
	return union(
		translateZ(2.5 / 2, getBolt(diameter, length - 2.5)),
		translateZ(  -(length - head.height) / 2, subtract(
			myCylinder(head.height, head.diameter / 2, (head.smallDiameter || head.diameter) / 2),
			cylinder({radius: 3 / 2, height: 2.5, segments: 6, center: [0,0, -(head.height - 2.5) / 2]}),
		)),
	);
};

module.exports = {
	BOLT_TYPES,
	getBolt,
	getSocketScrew,
}
