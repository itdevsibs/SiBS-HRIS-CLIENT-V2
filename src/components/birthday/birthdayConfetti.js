export const BIRTHDAY_CONFETTI_COLORS = Object.freeze([
  "#FF5C28",
  "#FFB020",
  "#38BDF8",
  "#34D399",
  "#F472B6",
  "#A78BFA",
]);

const SHAPES = ["rect", "rect", "rect", "circle", "circle", "star", "heart"];

export function createBirthdayParticles({
  count = 60,
  width = 1366,
  height = 768,
  random = Math.random,
} = {}) {
  const particles = [];

  for (let i = 0; i < count; i += 1) {
    const isLeft = i % 2 === 0;
    const sideRailWidth = width * 0.2;

    const x = isLeft
      ? random() * sideRailWidth
      : width - sideRailWidth + random() * sideRailWidth;

    const y = height * 0.3 + random() * (height * 0.5);

    const speed = 4 + random() * 6;
    const angle = isLeft
      ? (-0.2 + random() * 0.5) * Math.PI
      : (0.7 + random() * 0.5) * Math.PI;

    const vx = Math.cos(angle) * speed * (isLeft ? 1 : -1);
    const vy = -3 - random() * 5;

    const size = 6 + random() * 6;
    const shape = SHAPES[Math.floor(random() * SHAPES.length)];
    const color =
      BIRTHDAY_CONFETTI_COLORS[
        Math.floor(random() * BIRTHDAY_CONFETTI_COLORS.length)
      ];

    const lifeMs = Math.min(3000, 1800 + Math.floor(random() * 1200));

    particles.push({
      x,
      y,
      vx,
      vy,
      gravity: 0.18 + random() * 0.12,
      drag: 0.985,
      rotation: random() * Math.PI * 2,
      rotationSpeed: (random() - 0.5) * 0.2,
      width: size,
      height: shape === "rect" ? size * 1.5 : size,
      color,
      shape,
      lifeMs,
      bornAt: 0,
      opacity: 1,
    });
  }

  return particles;
}
