const ffmpegPath = require("ffmpeg-static");
const { execFileSync } = require("child_process");
const path = require("path");

function main() {
  const argv = process.argv.slice(2);
  const input =
    argv[0] ||
    path.join("videos", "page@a7dbdd7bea86142184719b1d1d9aee61.webm");
  const output = argv[1] || path.join("videos", "demo_final.mp4");

  console.log("ffmpeg binary:", ffmpegPath);
  console.log("Converting", input, "->", output);

  const args = [
    "-i",
    input,
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    "veryfast",
    output,
  ];

  try {
    execFileSync(ffmpegPath, args, { stdio: "inherit" });
    console.log("Conversion complete:", output);
  } catch (err) {
    console.error("Conversion failed:", err.message || err);
    process.exit(1);
  }
}

main();
