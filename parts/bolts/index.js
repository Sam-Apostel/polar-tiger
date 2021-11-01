const jscad = require('@jscad/modeling');
const {myCylinder} = require("../../utils/geometry");
const { translateZ } = jscad.transforms;
const { cylinder } = jscad.primitives;
const { union } = jscad.booleans;


const BOLT_TYPES = {
	M5: 5,
	M3: 3
};

const getBolt = (diameter, length, head = false) => {
	if (!head) return cylinder({radius: diameter / 2, height: length});

	return union(
		getBolt(diameter, length),
		translateZ(  (length + head.height) / 2, getBolt(head.diameter, head.height)),
	);
};

const getSocketScrew = (diameter, length, head = false) => {
	if (!head) return cylinder({radius: diameter / 2, height: length});

	return union(
		getBolt(diameter, length),
		translateZ(  -(length - head.height) / 2, myCylinder(head.height, head.diameter / 2, (head.smallDiameter || head.diameter) / 2)),
	);
};

module.exports = {
	BOLT_TYPES,
	getBolt,
	getSocketScrew,
}
