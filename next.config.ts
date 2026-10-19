import { execSync } from "child_process";
import { readFileSync } from "fs";
import type { NextConfig } from "next";

/** Versie, commit en builddatum voor de regel onderaan; bepaald bij het bouwen. */
const appVersion = (JSON.parse(readFileSync("./package.json", "utf8")) as { version: string }).version;
let appCommit = "";
try {
	appCommit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
		.toString()
		.trim();
} catch {
	/* geen git (bijv. in een kopie zonder .git) */
}

const nextConfig: NextConfig = {
	allowedDevOrigins: ["192.168.1.120"],
	env: {
		NEXT_PUBLIC_APP_VERSION: appVersion,
		NEXT_PUBLIC_APP_COMMIT: appCommit,
		NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
	},
};

export default nextConfig;
