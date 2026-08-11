function parseExpiry(input) {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();

  if (normalized === "never") return { never: true, timestamp: null };

  const durationMatch = normalized.match(/^(\d+)\s*(y|mo|w|d|h|m)$/);
  if (durationMatch) {
    const amount = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    const multiplier = {
      y: 365 * 86400000,
      mo: 30 * 86400000,
      w: 7 * 86400000,
      d: 86400000,
      h: 3600000,
      m: 60000,
    }[unit];
    return { never: false, timestamp: Date.now() + amount * multiplier };
  }

  const parsedDate = Date.parse(input);
  if (!Number.isNaN(parsedDate)) return { never: false, timestamp: parsedDate };

  return null;
}

function isExpired(stored) {
  if (stored === "never" || stored === null || stored === undefined) return false;
  const ts = typeof stored === "number" ? stored : parseInt(stored, 10);
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts;
}

function formatExpiry(stored) {
  if (stored === "never" || stored === null || stored === undefined) return "Never";
  const ts = typeof stored === "number" ? stored : parseInt(stored, 10);
  if (Number.isNaN(ts)) return String(stored);
  return `<t:${Math.floor(ts / 1000)}:F> (<t:${Math.floor(ts / 1000)}:R>)`;
}

function parseDurationSpec(input) {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();

  if (normalized === "never") return { type: "never" };

  const durationMatch = normalized.match(/^(\d+)\s*(y|mo|w|d|h|m)$/);
  if (durationMatch) {
    const amount = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    const multiplier = {
      y: 365 * 86400000,
      mo: 30 * 86400000,
      w: 7 * 86400000,
      d: 86400000,
      h: 3600000,
      m: 60000,
    }[unit];
    return { type: "duration", ms: amount * multiplier };
  }

  const parsedDate = Date.parse(input);
  if (!Number.isNaN(parsedDate)) return { type: "absolute", timestamp: parsedDate };

  return null;
}

function resolveDurationSpec(spec) {
  if (spec.type === "never") return "never";
  if (spec.type === "duration") return Date.now() + spec.ms;
  return spec.timestamp;
}

function humanizeDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years >= 1) return `${years} year${years !== 1 ? "s" : ""}`;
  if (months >= 1) return `${months} month${months !== 1 ? "s" : ""}`;
  if (days >= 1) return `${days} day${days !== 1 ? "s" : ""}`;
  if (hours >= 1) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

function describeDurationSpec(spec) {
  if (spec.type === "never") return "Never (permanent)";
  if (spec.type === "absolute") return formatExpiry(spec.timestamp);
  return `${humanizeDuration(spec.ms)} - starts counting when claimed`;
}

module.exports = {
  parseExpiry,
  isExpired,
  formatExpiry,
  parseDurationSpec,
  resolveDurationSpec,
  humanizeDuration,
  describeDurationSpec,
};