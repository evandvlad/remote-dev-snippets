import { type IRemoteDebugger } from "../../remote-debugger.js";

export default async function (rd: IRemoteDebugger) {
	await Promise.all([
		rd.send("Emulation.setLocaleOverride", { locale: "en_US" }),
		rd.send("Emulation.setGeolocationOverride", { latitude: 34.052235, longitude: -118.243683 }),
	]);

	await rd.send("Emulation.setTimezoneOverride", { timezoneId: "America/Los_Angeles" });
}
