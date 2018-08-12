const fs = require('fs');
const find = require('find');
const sharp = require('sharp');
const logSymbols = require('log-symbols');

const sizes = [16, 32, 48, 96, 128];
let queued = 0;
const created = [];
const failed = [];

const files = find.fileSync('icon.png', __dirname);
for(let file of files) {
	let origModified = fs.statSync(file).mtime;
	let sharpFile = sharp(file);

	for(let size of sizes) {
		let sizeFile = file.replace('.png', `${size}.png`);

		try {
			if(fs.statSync(sizeFile).mtime >= origModified)
				continue;
		}
		catch(e) { }

		queued++;
		sharpFile
		.resize(size, size)
		.toFile(sizeFile, (err, info) => {
			if(err)
				failed.push(`${logSymbols.error} ${sizeFile} ${err.toString()}`);
			else
				created.push(`${logSymbols.success} Created ${sizeFile}`);
			queued--;
		});
	}
}

(function waitForSharpToFinish() {
	if(queued === 0) {
		if(created.length > 0) {
			for(let el of created)
				console.log(el);
		}

		if(failed.length > 0) {
			for(let el of failed)
				console.error(el);
		}

		if(created.length === 0 && failed.length === 0) {
			console.log(logSymbols.success, 'All up to date!');
		}
	}
	else
		setTimeout(waitForSharpToFinish, 100);
})();
