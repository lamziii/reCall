// Splits a long recording into shorter clips so each fits under a provider's per-request limit
// (OpenAI hard-caps a single transcription at 1400s). Uses ffmpeg stream-copy (`-c copy`): it cuts
// the container on packet boundaries WITHOUT re-encoding, so it's fast and barely touches memory —
// important inside a 512MiB function. Audio-only opus/vorbis packets are each independently
// decodable, so every segment is a valid standalone file. SERVER-ONLY.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

/** Container extension for ffmpeg's in/out filenames — matches the provider's `extFor`. */
function extFor(mimeType: string): string {
  const t = (mimeType || "").toLowerCase();
  if (t.includes("ogg")) return "ogg";
  if (t.includes("mp4") || t.includes("m4a") || t.includes("aac")) return "m4a";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("wav")) return "wav";
  return "webm";
}

/**
 * Segments `audio` into <= `segmentSeconds` pieces, in order. Returns a single-element array when
 * the recording is already short (one segment out). Throws if ffmpeg is unavailable or fails — the
 * caller should fall back to a single whole-file request (which still works for short audio).
 */
export async function segmentAudio(audio: Buffer, mimeType: string, segmentSeconds: number): Promise<Buffer[]> {
  if (!ffmpegPath) throw new Error("ffmpeg binary not available");
  const ext = extFor(mimeType);
  const dir = await mkdtemp(join(tmpdir(), "recall-seg-"));
  try {
    const input = join(dir, `in.${ext}`);
    await writeFile(input, audio);
    await execFileAsync(ffmpegPath, [
      "-hide_banner", "-loglevel", "error",
      "-i", input,
      "-map", "0:a", "-c", "copy",
      "-f", "segment", "-segment_time", String(segmentSeconds), "-reset_timestamps", "1",
      join(dir, `part_%03d.${ext}`),
    ]);
    const files = (await readdir(dir)).filter((f) => f.startsWith("part_")).sort();
    const parts = await Promise.all(files.map((f) => readFile(join(dir, f))));
    return parts.length ? parts : [audio];
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
