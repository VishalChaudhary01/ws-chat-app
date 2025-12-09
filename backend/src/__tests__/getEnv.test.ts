import { getEnv } from "@/utils/getEnv";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe.only("UTILS -- getEnv()", () => {
  const ENV_VAL = process.env;

  beforeEach(() => {
    process.env = { ...ENV_VAL };
  });

  afterAll(() => {
    process.env = ENV_VAL;
  });

  it("1. should return the environment variable when it exists", () => {
    process.env.TEST_KEY = "test_value";

    expect(getEnv("TEST_KEY")).toBe("test_value");
  });

  it("2. should return default value when env variable is not set but default is provided", () => {
    delete process.env.MISSING_KEY;

    expect(getEnv("MISSING_KEY", "default_value")).toBe("default_value");
  });

  it("3. should throw error when env variable is not set and no default value is provided", () => {
    delete process.env.TESTING_KEY;

    expect(() => getEnv("SECRET_KEY")).toThrow(
      "Environment variable SECRET_KEY, not set"
    );
  });
});
