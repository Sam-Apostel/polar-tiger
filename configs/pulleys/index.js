const fromTeeth = (teeth) => {
	// result on affine interpolation on known sets of teeth & od combos represented as standard above
	const a = 0.6697;
	const b = 1.5984;
	const od = a * teeth + b;

	return { teeth, od };
};
const PULLEYS = {
	16: {
		teeth: 16,
		od: 12.5,
	},
	20: {
		teeth: 20,
		od: 15,
	},
	32: {
		teeth: 32,
		od: 23,
	},
	40: {
		teeth: 40,
		od: 28,
	},
	// 50: {
	// 	teeth: 50,
	// 	od: 0,
	// },
	60: {
		teeth: 60,
		od: 42,
	},
	fromTeeth,
	fromOd: (od) => {
		const a = 0.6697;
		const b = 1.5984;
		const teeth = (od - b) / a;

		return fromTeeth(Math.floor(teeth));
	}
}

module.exports = {
	PULLEYS
};
