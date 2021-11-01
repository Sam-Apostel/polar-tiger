const jscad = require('@jscad/modeling');
const {svgScaler} = require("../../utils/functions");
const {useSvg} = require("../../utils/importers");
const { geom2 } = jscad.geometries;
const { center } = jscad.transforms;
const { extrudeLinear } = jscad.extrusions;
const { polygon } = jscad.primitives;
const { union, subtract } = jscad.booleans;
const { reverse } = geom2;


const x2060 = useSvg('2060.svg');
const x2040 = useSvg('2040.svg');
const x2020 = useSvg('2020.svg');

const getExtrusionProfile = type => {
	switch(type){
		case '2020':
			return subtract(
				polygon({ points: x2020[1].points }),
				reverse(polygon({ points: x2020[2].points })),
			);
		case '2040':
			return subtract(
				reverse(polygon({ points: x2040[2].points })),
				union(
					reverse(polygon({ points: x2040[3].points })),
					union(
						polygon({ points: x2040[4].points }),
						polygon({ points: x2040[5].points })
					)
				)
			);
		case '2060':
			return subtract(
				polygon({ points: x2060[1].points }),
				[
					polygon({ points: x2060[2].points }),
					polygon({ points: x2060[3].points }),
					reverse(
						union(
							polygon({ points: x2060[4].points }),
							union(
								polygon({ points: x2060[5].points }),
								polygon({ points: x2060[6].points })
							)
						)
					)
				]
			);
	}
}

const getExtrusion = (height, depth, width) =>
	extrudeLinear({ height }, center([true, true, true], svgScaler(getExtrusionProfile(`${depth}${width}`))));

module.exports = {
	getExtrusion,
}
