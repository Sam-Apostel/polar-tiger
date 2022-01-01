const jscad = require('@jscad/modeling');
const { extrudeLinear } = jscad.extrusions;
const { cylinder, rectangle } = jscad.primitives;
const { subtract, union, intersect } = jscad.booleans;
const {
	rotateZ, translateY, rotateX, translate
} = jscad.transforms;


const main = () => {
	const height = 4.25;
	const width = 9.5;
	const tLegHeight = height - 3.4;
	const tLegWidth = 6;

	const depth = 9.6;
	const hole = 5;

	const anglePosition = 9.05;

	const profile = intersect(
		union(
			rectangle({size: [width, height - tLegHeight], center: [0, (height - tLegHeight) / 2, 0]}),
			rectangle({size: [tLegWidth, tLegHeight], center: [0, -tLegHeight / 2, 0]}),
		),
		rotateZ(Math.PI / 4, rectangle({size:[anglePosition, anglePosition]}))
	);

	const shape = translate([0, depth / 2, -height / 2 + tLegHeight], rotateX(Math.PI / 2, extrudeLinear({ height: depth }, profile )));

	const m5 = cylinder({ radius: hole / 2, height})
	return subtract(
		shape,
		m5
	);
};

module.exports = { main };
