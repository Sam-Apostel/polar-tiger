const jscad = require('@jscad/modeling');
const { cuboid, cylinder } = jscad.primitives;
const { subtract, union } = jscad.booleans;
const {
	translate, rotateX, rotateZ, translateX, translateZ
} = jscad.transforms;
const { measureBoundingBox } = jscad.measurements
const { colorize } = jscad.colors;

const microswissGeometry = require('./hotend_microswiss.stl');
const {getBolt, BOLT_TYPES} = require('../../../parts/bolts');

// const mainColor = [184, 110, 15].map(v => v / 255); // orange
const mainColor = [1, .55, .2]; // yellow

const colors = [
	[.55, .55, .55], // tool
	[.15, .15, .15], // fan
	[.15, .15, .15, .8], // fan blades
	mainColor, // mounting block
	[.15, .15, .15], // bolt
	[.15, .15, .15], // bolt
	[.15, .15, .15], // bolt
];

const size = {
	x: 20,
	y: 12,
	z: 45,
};

const mount = {
	x: -size.x / 2,
	y: -size.y / 2,
	z: -size.z
};

const main = () => {
	const oriented = rotateX(Math.PI / 2, microswissGeometry);
	const bounds = measureBoundingBox(oriented);
	const bottom = bounds[0][2];
	const left = bounds[0][0];
	const back = bounds[1][1];

	const fanSize = [22, 5, 10.3, 10];
	const fanOffset = [0,2, -2];

	const fan = translate([fanOffset[0], -(fanSize[1] + size.y) / 2 - fanOffset[1], fanSize[0] / 2 + fanSize[0] + fanOffset[2]], [
		subtract(
			cuboid({size: [fanSize[0], fanSize[1], fanSize[0]]}),
			rotateX(Math.PI / 2, cylinder({height: fanSize[1], radius: fanSize[2]}))
		),
		rotateX(Math.PI / 2, cylinder({height: fanSize[1], radius: fanSize[3]}))
	]);

	const screwClearance = .2;
	const mountBlockDepth = 10;
	const m3Hole = cylinder({ radius: 1.5 + screwClearance, height: mountBlockDepth});
	const heatsetInsert =  cylinder({ radius: 2.05, height: 6, center: [0,0,-(mountBlockDepth  - 6) / 2]});
	const m3MountingHole = rotateX(Math.PI / 2, union(m3Hole, heatsetInsert));
	const mountBlock = translate( [0, -mount.y + mountBlockDepth/2, -mount.z], [
		subtract(
			cuboid({ size: [20, mountBlockDepth, 8]}),
			[
				translateX(7, m3MountingHole),
				translateX(-7, m3MountingHole),
				cylinder({ radius: 2.5 + screwClearance, height: 8}),
				cylinder({ radius: 4.25 + screwClearance, height: 5.5, center: [0,0,(8 - 5.5) / 2]})
			]
		),
		translateZ(-5.5, getBolt(BOLT_TYPES.M5, 8, { diameter: 8.48, height: 5 })),
		translate([7, -7, 0], rotateX(Math.PI / 2, getBolt(BOLT_TYPES.M3, 20, { diameter: 5.4, height: 3 }))),
		translate([-7, -7, 0], rotateX(Math.PI / 2, getBolt(BOLT_TYPES.M3, 20, { diameter: 5.4, height: 3 }))),
	]);
	// TODO: vslot groove
	// TODO: top part is rounded, make the shapes flow
	// TODO: seat heatset inserts deeper
	// TODO: fan holders
	// TODO: cable clamps
	// TODO: part cooling fan


	return [
		translate([-left - size.x / 2, -back + size.y / 2, -bottom], oriented),
		...fan,
		...mountBlock,
	].map((object, index) => colorize(colors[index] || [.0, .0, .0,], object));
};

// TODO: mounting block

module.exports = {
	microswiss: {
		endCap: {
			getGeometry: () => rotateZ(-Math.PI / 2, main()),
			colors,
			mount: {
				x: mount.y,
				y: 0,
				z: mount.z + 10 + 4
			}
		},
		getGeometry: main,
		colors,
		mount: {
			x: -mount.x,
			y: mount.y - 10,
			z: mount.z
		}
	},
	main
}
