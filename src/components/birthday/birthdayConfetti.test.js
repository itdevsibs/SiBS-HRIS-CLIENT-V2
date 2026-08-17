import assert from "node:assert/strict";
import test from "node:test";
import {
  BIRTHDAY_CONFETTI_COLORS,
  createBirthdayParticles,
} from "./birthdayConfetti.js";

test("creates the requested bounded particle count from the rainbow palette", () => {
  const particles = createBirthdayParticles({ count: 80, width: 1366, height: 768, random: () => 0.5 });
  assert.equal(particles.length, 80);
  assert.equal(particles.every((particle) => BIRTHDAY_CONFETTI_COLORS.includes(particle.color)), true);
  assert.equal(particles.every((particle) => particle.lifeMs <= 3000), true);
});

test("originates particles from side rails and leaves the center less dense", () => {
  const particles = createBirthdayParticles({ count: 40, width: 390, height: 844, random: () => 0.25 });
  assert.equal(particles.every((particle) => particle.x <= 78 || particle.x >= 312), true);
});
