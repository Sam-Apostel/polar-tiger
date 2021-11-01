const {nestedArrayDividerReducer} = require("../functions");

Object.defineProperty(Array.prototype, 'divide', {
	value: function(){ return this.reduce(...nestedArrayDividerReducer)}
});
