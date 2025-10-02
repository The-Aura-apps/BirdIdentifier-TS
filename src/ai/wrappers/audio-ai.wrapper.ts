// ai/wrappers/audio-ai.wrapper.ts
import { Injectable } from "@nestjs/common";
import { IdentificationResult } from "../types";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import * as path from "path";

@Injectable()
export class AudioAiWrapper {
  async identify(file: Buffer): Promise<IdentificationResult> {
    const inputDir = path.resolve("./tmp");
    const inputFile = path.join(inputDir, "birdnet_input.wav");
    const outputFile = path.join(inputDir, "birdnet_output.json");

    await fs.mkdir(inputDir, { recursive: true });
    await fs.writeFile(inputFile, file);

    const dockerCmd = [
      "run",
      "--rm",
      "-v", `${inputDir}:/workspace`,
      "birdnet", // <-- image name
      "python3", "-m", "birdnet_analyzer",
      "--i", "/workspace/birdnet_input.wav",
      "--o", "/workspace/birdnet_output.json",
      "--format", "json"
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("docker", dockerCmd, { stdio: "inherit" });
      proc.on("error", reject);
      proc.on("close", code => {
        code === 0 ? resolve() : reject(new Error(`BirdNET exited ${code}`));
      });
    });

    const raw = await fs.readFile(outputFile, "utf-8");
    const detections = JSON.parse(raw);

    if (!Array.isArray(detections) || detections.length === 0) {
      return { scientificName: "", confidence: 0 };
    }

    const best = detections.sort((a, b) => b.confidence - a.confidence)[0];
    return {
      scientificName: best.scientific_name ?? "",
      confidence: Number(best.confidence ?? 0),
    };
  }
}
