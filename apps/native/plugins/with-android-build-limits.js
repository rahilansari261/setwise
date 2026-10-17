// Caps Gradle so a local Android build doesn't saturate the dev machine.
// Lives in a config plugin because `expo prebuild` regenerates gradle.properties.
const { withGradleProperties } = require("expo/config-plugins");

const LIMITS = {
	"org.gradle.workers.max": "4",
	"org.gradle.parallel": "true",
	"org.gradle.jvmargs":
		"-Xmx3g -XX:MaxMetaspaceSize=768m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
	"kotlin.daemon.jvmargs": "-Xmx1536m",
};

module.exports = function withAndroidBuildLimits(config) {
	return withGradleProperties(config, (cfg) => {
		for (const [key, value] of Object.entries(LIMITS)) {
			const existing = cfg.modResults.find(
				(item) => item.type === "property" && item.key === key,
			);
			if (existing) {
				existing.value = value;
			} else {
				cfg.modResults.push({ type: "property", key, value });
			}
		}
		return cfg;
	});
};
