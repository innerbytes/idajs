const { test, expect } = require("./idatest");
// @ts-ignore
const { object } = require("./srcjs/objectHelper");

test.group.only("ObjectHelper Tests", () => {
  test("converts South direction to 0 angle", () => {
    const result = object.directionToAngle(object.ZoneDirections.South);
    expect.equal(result, 0);
  });

  test("converts East direction to 1024 angle", () => {
    const result = object.directionToAngle(object.ZoneDirections.East);
    expect.equal(result, 1024);
  });

  test("converts North direction to 2048 angle", () => {
    const result = object.directionToAngle(object.ZoneDirections.North);
    expect.equal(result, 2048);
  });

  test("converts West direction to 3072 angle", () => {
    const result = object.directionToAngle(object.ZoneDirections.West);
    expect.equal(result, 3072);
  });

  test("returns 0 for None direction", () => {
    const result = object.directionToAngle(object.ZoneDirections.None);
    expect.equal(result, 0);
  });

  test("returns 0 for unknown direction", () => {
    const result = object.directionToAngle(999);
    expect.equal(result, 0);
  });

  test("converts 0 degrees to 0 angle", () => {
    const result = object.degreesToAngle(0);
    expect.equal(result, 0);
  });

  test("converts 90 degrees to 1024 angle", () => {
    const result = object.degreesToAngle(90);
    expect.equal(result, 1024);
  });

  test("converts 180 degrees to 2048 angle", () => {
    const result = object.degreesToAngle(180);
    expect.equal(result, 2048);
  });

  test("converts 270 degrees to 3072 angle", () => {
    const result = object.degreesToAngle(270);
    expect.equal(result, 3072);
  });

  test("converts 360 degrees to 0 angle (normalized)", () => {
    const result = object.degreesToAngle(360);
    expect.equal(result, 0);
  });

  test("converts 45 degrees correctly", () => {
    const result = object.degreesToAngle(45);
    expect.equal(result, 512);
  });

  test("handles fractional degrees", () => {
    const result = object.degreesToAngle(22.5);
    expect.equal(result, 256);
  });

  test("handles negative degrees", () => {
    const result = object.degreesToAngle(-90);
    expect.equal(result, 3072);
  });

  test("handles degrees > 360", () => {
    const result = object.degreesToAngle(450); // 360 + 90 = 90
    expect.equal(result, 1024);
  });

  test("converts 0 angle to 0 degrees", () => {
    const result = object.angleToDegrees(0);
    expect.equal(result, 0);
  });

  test("converts 1024 angle to 90 degrees", () => {
    const result = object.angleToDegrees(1024);
    expect.equal(result, 90);
  });

  test("converts 2048 angle to 180 degrees", () => {
    const result = object.angleToDegrees(2048);
    expect.equal(result, 180);
  });

  test("converts 3072 angle to 270 degrees", () => {
    const result = object.angleToDegrees(3072);
    expect.equal(result, 270);
  });

  test("converts 4096 angle to 0 degrees (normalized)", () => {
    const result = object.angleToDegrees(4096);
    expect.equal(result, 0);
  });

  test("converts 512 angle to 45 degrees", () => {
    const result = object.angleToDegrees(512);
    expect.equal(result, 45);
  });

  test("handles negative angles", () => {
    const result = object.angleToDegrees(-1024);
    expect.equal(result, 270);
  });

  test("handles angles > 4096", () => {
    const result = object.angleToDegrees(5120);
    expect.equal(result, 90);
  });

  test("converts 0 radians to 0 angle", () => {
    const result = object.radiansToAngle(0);
    expect.equal(result, 0);
  });

  test("converts pi/2 radians to 1024 angle", () => {
    const result = object.radiansToAngle(Math.PI / 2);
    expect.equal(result, 1024);
  });

  test("converts pi radians to 2048 angle", () => {
    const result = object.radiansToAngle(Math.PI);
    expect.equal(result, 2048);
  });

  test("converts 3pi/2 radians to 3072 angle", () => {
    const result = object.radiansToAngle((3 * Math.PI) / 2);
    expect.equal(result, 3072);
  });

  test("converts 2pi radians to 0 angle (normalized)", () => {
    const result = object.radiansToAngle(2 * Math.PI);
    expect.equal(result, 0);
  });

  test("converts pi/4 radians to 512 angle", () => {
    const result = object.radiansToAngle(Math.PI / 4);
    expect.equal(result, 512);
  });

  test("handles negative radians", () => {
    const result = object.radiansToAngle(-Math.PI / 2);
    expect.equal(result, 3072);
  });

  test("handles radians > 2pi", () => {
    const result = object.radiansToAngle(3 * Math.PI);
    expect.equal(result, 2048);
  });

  test("converts 0 angle to 0 radians", () => {
    const result = object.angleToRadians(0);
    expect.equal(result, 0);
  });

  test("converts 1024 angle to pi/2 radians", () => {
    const result = object.angleToRadians(1024);
    expect.between(Math.PI / 2 - 0.0001, Math.PI / 2 + 0.0001, result);
  });

  test("converts 2048 angle to pi radians", () => {
    const result = object.angleToRadians(2048);
    expect.between(Math.PI - 0.0001, Math.PI + 0.0001, result);
  });

  test("converts 3072 angle to 3pi/2 radians", () => {
    const result = object.angleToRadians(3072);
    expect.between((3 * Math.PI) / 2 - 0.0001, (3 * Math.PI) / 2 + 0.0001, result);
  });

  test("converts 4096 angle to 0 radians (normalized)", () => {
    const result = object.angleToRadians(4096);
    expect.between(-0.0001, 0.0001, result);
  });

  test("converts 512 angle to pi/4 radians", () => {
    const result = object.angleToRadians(512);
    expect.between(Math.PI / 4 - 0.0001, Math.PI / 4 + 0.0001, result);
  });

  test("handles negative angles", () => {
    const result = object.angleToRadians(-1024);
    expect.between((3 * Math.PI) / 2 - 0.0001, (3 * Math.PI) / 2 + 0.0001, result);
  });

  test("handles angles > 4096", () => {
    const result = object.angleToRadians(6144);
    expect.between(Math.PI - 0.0001, Math.PI + 0.0001, result);
  });

  test("handles zero values correctly", () => {
    expect.equal(object.degreesToAngle(0), 0);
    expect.equal(object.angleToDegrees(0), 0);
    expect.equal(object.radiansToAngle(0), 0);
    expect.equal(object.angleToRadians(0), 0);
  });

  test("handles maximum game angle (4096) normalized to 0", () => {
    expect.equal(object.angleToDegrees(4096), 0);
    expect.between(-0.0001, 0.0001, object.angleToRadians(4096));
  });

  test("handles full circle conversions (normalized to 0)", () => {
    expect.equal(object.degreesToAngle(360), 0);
    expect.equal(object.radiansToAngle(2 * Math.PI), 0);
  });

  test("degrees to angle to degrees round-trip", () => {
    const originalDegrees = 123.45;
    const angle = object.degreesToAngle(originalDegrees);
    const convertedBack = object.angleToDegrees(angle);
    expect.between(originalDegrees - 0.1, originalDegrees + 0.1, convertedBack);
  });

  test("radians to angle to radians round-trip", () => {
    const originalRadians = 2.5;
    const angle = object.radiansToAngle(originalRadians);
    const convertedBack = object.angleToRadians(angle);
    expect.between(originalRadians - 0.01, originalRadians + 0.01, convertedBack);
  });

  test("degrees and radians conversions are consistent", () => {
    const degrees = 45;
    const radians = (degrees * Math.PI) / 180;

    const angleFromDegrees = object.degreesToAngle(degrees);
    const angleFromRadians = object.radiansToAngle(radians);

    expect.between(angleFromDegrees - 1, angleFromDegrees + 1, angleFromRadians);
  });

  const angleTheories = [
    { source: [0, 0, 0], target: [0, 0, 10], expected: 0, desc: "Z+ direction (South)" },
    { source: [0, 0, 0], target: [10, 0, 0], expected: 1024, desc: "X+ direction (East)" },
    { source: [0, 0, 0], target: [0, 0, -10], expected: 2048, desc: "Z- direction (North)" },
    { source: [0, 0, 0], target: [-10, 0, 0], expected: 3072, desc: "X- direction (West)" },
    { source: [0, 0, 0], target: [10, 0, 10], expected: 512, desc: "diagonal SE (45 deg)" },
    { source: [0, 0, 0], target: [-10, 0, 10], expected: 3584, desc: "diagonal SW (315 deg)" },
    { source: [5, 0, 5], target: [15, 0, 5], expected: 1024, desc: "offset origin, X+ direction" },
    {
      source: [10, 0, 10],
      target: [10, 0, 0],
      expected: 2048,
      desc: "offset origin, Z- direction",
    },
    { source: [0, 0, 0], target: [10, 5, 10], expected: 512, desc: "ignores Y difference" },
  ];

  for (const { source, target, expected, desc } of angleTheories) {
    test(`getAngleFromToPosition: ${desc}`, () => {
      const result = object.getAngleFromToPosition(source, target);
      expect.equal(result, expected);
    });
  }
});
