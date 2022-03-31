const jscad = require('@jscad/modeling');
const { cylinderElliptic } = jscad.primitives;

const myCylinder = (height, start, end, segments = 64) => {
	if (end === undefined) end = start;
	return cylinderElliptic({ height, startRadius: [start, start], endRadius: [end, end], segments })
}

module.exports = {
	myCylinder
}
