function calculateStat(base, iv, ev, level, natureMultiplier) {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100 + 5) * natureMultiplier;
}

function getNatureMultiplier(stat, nature) {
  if (nature.increase === stat) return 1.1;
  if (nature.decrease === stat) return 0.9;
  return 1;
}

module.exports = {
  calculateStat,
  getNatureMultiplier,
};
