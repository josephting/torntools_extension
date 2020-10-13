(async () => {
	await convertDatabase();
	await loadDatabase();

	await checkUpdate();
})();

async function convertDatabase() {
	let storage = await ttStorage.get();

	if (!storage || !Object.keys(storage).length) {
		console.log("Setting new storage.");
		await ttStorage.reset();
	} else {
		console.log("Old storage.", storage);

		let newStorage = convertGeneral(storage, DEFAULT_STORAGE);

		await ttStorage.clear();
		await ttStorage.set(newStorage);

		console.log("New storage.", newStorage);
	}

	function convertGeneral(oldStorage, defaultStorage) {
		let newStorage = {};

		for (let key in defaultStorage) {
			if (!oldStorage) oldStorage = {};
			if (!key in oldStorage) oldStorage[key] = {};

			if (typeof defaultStorage[key] === "object") {
				if (defaultStorage[key] instanceof DefaultSetting) {
					if (defaultStorage[key].type !== typeof oldStorage[key]) {
						if (defaultStorage[key].hasOwnProperty("defaultValue")) {
							switch (typeof defaultStorage[key].defaultValue) {
								case "function":
									newStorage[key] = defaultStorage[key].defaultValue();
									break;
								case "boolean":
									newStorage[key] = defaultStorage[key].defaultValue;
									break;
								default:
									newStorage[key] = defaultStorage[key].defaultValue;
									break;
							}
						}
					} else {
						newStorage[key] = oldStorage[key];
					}
				} else {
					newStorage[key] = convertGeneral(oldStorage[key], defaultStorage[key]);
				}
			}
		}

		return newStorage;
	}
}

async function checkUpdate() {
	const oldVersion = version.oldVersion;
	const newVersion = chrome.runtime.getManifest().version;

	const change = { version: { oldVersion: newVersion } };
	if (oldVersion !== newVersion) {
		console.log("New version detected!", newVersion);
		change.version.showNotice = true;
	}

	await ttStorage.change(change);
}
