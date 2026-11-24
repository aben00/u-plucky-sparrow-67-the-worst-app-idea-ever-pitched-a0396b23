// SPDX-License-Identifier: MIT
// The Worst App Idea Ever Pitched — main.ts (Node 22)
// Writes one original one-sentence pitch, at most 240 characters,
// to /output/entry.txt (or $MAKEFUN_OUTPUT_DIR/entry.txt), deterministically.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PITCH =
  "PebbleCloud is the $10-a-month app that photographs every pebble you own, backs them up to the cloud, and lets you admire rocks already sitting in your garden from anywhere on Earth.";

// The kit gate: /output/entry.txt must be UTF-8 text of 1 to 240
// characters, not only white space. The task adds: one sentence.
function checkPitch(text: string): void {
  const length = [...text].length;
  if (length < 1 || length > 240) {
    throw new Error(`pitch must be 1-240 characters, got ${length}`);
  }
  if (text.trim().length === 0) {
    throw new Error("pitch must not be only whitespace");
  }
  if (text !== text.trim()) {
    throw new Error("pitch must not have leading or trailing whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("pitch must be a single line");
  }
  for (const ch of text) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 || code === 0x7f) {
      throw new Error("pitch must not contain control characters");
    }
  }
  // Exactly one sentence: a single sentence terminator, and it closes the line.
  const stops = text.match(/[.!?]/g) ?? [];
  if (stops.length !== 1 || !/[.!?]$/.test(text)) {
    throw new Error("pitch must be exactly one sentence");
  }
  // No padded filler: a doubled space is dead weight in a 240-char pitch.
  if (text.includes("  ")) {
    throw new Error("pitch must not contain doubled spaces");
  }
}

const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(dir, { recursive: true });
checkPitch(PITCH);
const target = join(dir, "entry.txt");
writeFileSync(target, PITCH, "utf8");

// Read back with strict UTF-8 decoding and confirm byte-for-byte:
// the file on disk must be exactly the pitch, nothing added or lost.
// Also confirm the byte length matches the pitch's UTF-8 encoding, so no
// BOM or trailing newline can sneak in unnoticed.
const raw = readFileSync(target);
const roundTrip = new TextDecoder("utf-8", { fatal: true }).decode(raw);
if (roundTrip !== PITCH) {
  throw new Error("read-back mismatch: entry.txt differs from the pitch");
}
if (raw.length !== Buffer.byteLength(PITCH, "utf8")) {
  throw new Error("byte-length mismatch: entry.txt has extra bytes");
}
console.log(`wrote ${[...PITCH].length} chars to ${target}`);
