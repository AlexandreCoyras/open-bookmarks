import { describe, expect, test } from "bun:test";
import app from "../index";

const MOCK_ENV = {
	CORS_ORIGIN: "http://localhost:3000",
};

describe("Get /", () => {
	test("Get /", async () => {
		const res = await app.request("/", {}, MOCK_ENV);
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("OK");
	});
});
