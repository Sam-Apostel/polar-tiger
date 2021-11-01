const jscad = require('@jscad/modeling');
const { scale } = jscad.transforms;

const nestedArrayDividerReducer = [(a, b) => b.map((c, i) => [...(a[i] ?? []), c]), []];
const svgScaler = shape => scale([1.2499982611574187, 1.2499982611574187, 1.2499982611574187], shape);

module.exports = {
	nestedArrayDividerReducer,
	svgScaler
}
