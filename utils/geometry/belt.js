const jscad = require('@jscad/modeling');
const { vec3 } = jscad.maths;
const { extrudeFromSlices } = jscad.extrusions;
const { cylinderElliptic, rectangle } = jscad.primitives;
const { translate, rotateX, rotate } = jscad.transforms;
const { subtract } = jscad.booleans;
const {BELT_DETAIL} = require('../../rendering');


/**
 * make a belt that spans between wheels
 * @param joints is an array of wheels that the belt revolves around
 * a joint has a position, rotation and radius
 * for the first and last joint the radius can be zero ( straight terminating )
 * we assume that the belts run straight in one dimension
 */
const getBelt = joints => {
	const getTangentIntersections = (a, b) => {
		// figure out what direction the tangent runs in

		// add radius to position, in the perpendicular axis of the tangent
		return [
			null, // coord of intersection between (tangent of a and b) and a
			null // coord of intersection between (tangent of a and b) and b
		];
	}

	// expand joints with coords of intersections between tangent of 2 joints
	const interfaces = joints.reduce((interfaces, joint, index) => {
		if (index === 0) return [joint];
		const prev = interfaces.pop();
		const [a, b] = getTangentIntersections(prev, joint);
		return [
			...interfaces,
			{
				...prev,
				exit: a
			},
			{
				...joint,
				entry: b,
			}
		];
	}, []);

	// generate radius for each joint
	// generate sections between each joint;

};

const getBeltRadius = (radius, startAngle, endAngle) => {
	const radiusToElliptic = rad => ({startRadius: [rad, rad], endRadius: [rad, rad]});
	return rotateX(Math.PI / 2, subtract(
		cylinderElliptic({...radiusToElliptic(radius + 1.38), height: 5, startAngle, endAngle}),
		cylinderElliptic({...radiusToElliptic(radius), height: 5, startAngle, endAngle}),
	));
	// TODO: add belt hobs
};
const getBeltSection = (startPos, startRot, endPos, endRot) => {
	const length = vec3.distance(startPos, endPos);
	const path = [0, 0, length];
	let shape = [];
	vec3.subtract(shape, endPos, startPos);
	const getPolarAngle = ([x, y]) => {
		if (x === 0) return 0;
		const inverseTangent = Math.atan(y / x );
		if (x < 0) return inverseTangent + Math.PI;
		if (y < 0) return inverseTangent + Math.PI * 2;
		return inverseTangent;

	};
	const angles = [
		0,
		vec3.angle([0,0,1], shape),
		getPolarAngle(shape),
	];

	// rotate shape to point straight up

	const twist = endRot - startRot;
	const section = extrudeFromSlices({
		numberOfSlices: Math.max(Math.floor(length / BELT_DETAIL), 4),
		callback: (progress, index, base) => {
			let pos = [];
			vec3.scale(pos, path, progress);
			const rot = startRot + (twist * progress);
			const edges = base.sides.map(side => side.map(point => {
				let stage1 = [];
				vec3.fromVec2(stage1, point);
				let stage2 = [];
				vec3.rotateZ(stage2, stage1, [0,0,0], rot);
				let stage3 = [];
				vec3.add(stage3, stage2, pos);
				return stage3;
			}));

			return { edges };
		}
		// TODO: add belt hobs
	}, rectangle({size: [1.38, 5]}));

	// rotate section to point back where it pointed
	return translate(startPos, rotate(angles, section));
};

module.exports = {
	getBeltSection,
	getBeltRadius
}
