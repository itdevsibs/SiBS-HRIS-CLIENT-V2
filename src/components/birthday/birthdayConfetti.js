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
  count = 120,
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

    const y = random() * (height * 0.7);

    const speed = 2 + random() * 5;
    const angle = isLeft
      ? (-0.2 + random() * 0.5) * Math.PI
      : (0.7 + random() * 0.5) * Math.PI;

    const vx = Math.cos(angle) * speed * (isLeft ? 1 : -1);
    const vy = -1 - random() * 4;

    const size = 9 + random() * 9;
    const shape = SHAPES[Math.floor(random() * SHAPES.length)];
    const color =
      BIRTHDAY_CONFETTI_COLORS[
        Math.floor(random() * BIRTHDAY_CONFETTI_COLORS.length)
      ];

    const lifeMs = Math.min(3000, 2000 + Math.floor(random() * 1000));

    particles.push({
      x,
      y,
      vx,
      vy,
      gravity: 0.06 + random() * 0.07,
      drag: 0.99,
      rotation: random() * Math.PI * 2,
      rotationSpeed: (random() - 0.5) * 0.15,
      width: size,
      height: shape === "rect" ? size * 1.6 : size,
      color,
      shape,
      lifeMs,
      bornAt: 0,
      opacity: 1,
    });
  }

  return particles;
}
