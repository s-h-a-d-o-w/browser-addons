const find = require('find');
const sharp = require('sharp');

const sizes = [16, 32, 48, 96, 128];

find.eachfile('icon.png', __dirname, function(file) {
	let sharpFile = sharp(file);
	for(let size of sizes) {
		sharpFile
		.resize(size, size)
		.toFile(file.replace('.png', `${size}.png`), (err, info) => (err ? console.error(err) : true));
	}
});
