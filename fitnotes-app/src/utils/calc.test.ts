import { describe, expect, it } from 'vitest';
import {
  convertDistance,
  formatDuration,
  formatSetSummary,
  getDistanceUnit,
  parseDuration,
} from './calc';

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('adds hours past 60 minutes', () => {
    expect(formatDuration(3723)).toBe('1:02:03');
  });

  it('clamps negative and fractional values', () => {
    expect(formatDuration(-5)).toBe('0:00');
    expect(formatDuration(90.9)).toBe('1:30');
  });
});

describe('parseDuration', () => {
  it('parses bare seconds, m:ss and h:mm:ss', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('1:02:03')).toBe(3723);
  });

  it('treats empty input as zero', () => {
    expect(parseDuration('  ')).toBe(0);
  });

  it('rejects invalid input', () => {
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('1::30')).toBeNull();
    expect(parseDuration('1:2:3:4')).toBeNull();
    expect(parseDuration('-1')).toBeNull();
  });

  it('round-trips with formatDuration', () => {
    for (const seconds of [0, 45, 61, 1800, 3661]) {
      expect(parseDuration(formatDuration(seconds))).toBe(seconds);
    }
  });
});

describe('distance units', () => {
  it('follows the weight unit', () => {
    expect(getDistanceUnit('lbs')).toBe('mi');
    expect(getDistanceUnit('kg')).toBe('km');
  });

  it('converts between miles and kilometers', () => {
    expect(convertDistance(1, 'lbs', 'kg')).toBe(1.61);
    expect(convertDistance(5, 'kg', 'lbs')).toBe(3.11);
    expect(convertDistance(3, 'kg', 'kg')).toBe(3);
    expect(convertDistance(0, 'lbs', 'kg')).toBe(0);
  });
});

describe('formatSetSummary', () => {
  const set = { weight: 135, reps: 8, distance: 3.1, timeSeconds: 1500 };

  it('formats each metric type', () => {
    expect(formatSetSummary(set, 'weight_reps', 'lbs')).toBe('135 lbs × 8');
    expect(formatSetSummary(set, 'reps_only', 'lbs')).toBe('8 reps');
    expect(formatSetSummary(set, 'time_only', 'lbs')).toBe('25:00');
    expect(formatSetSummary(set, 'distance_time', 'kg')).toBe('3.1 km in 25:00');
  });

  it('handles missing cardio fields', () => {
    expect(formatSetSummary({ weight: 0, reps: 0 }, 'distance_time', 'lbs')).toBe('0 mi in 0:00');
  });
});
