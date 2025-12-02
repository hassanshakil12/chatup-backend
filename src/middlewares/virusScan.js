import fs from "fs";
import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);

export const scanForViruses = async (filePath) => {
  try {
    // Using ClamAV if installed (Linux/Mac)
    // For Windows, you might use a different antivirus
    const { stdout } = await execAsync(`clamscan --no-summary "${filePath}"`);

    // clamscan returns 0 if clean, 1 if virus found
    if (stdout.includes("FOUND")) {
      return { clean: false, threat: stdout.match(/:(.*) FOUND/)[1] };
    }

    return { clean: true };
  } catch (error) {
    // If ClamAV is not installed, skip scanning in development
    if (process.env.NODE_ENV === "development") {
      console.warn("Virus scanner not available, skipping scan");
      return { clean: true, skipped: true };
    }

    // In production, you might want to block if scanner fails
    throw new Error("Virus scan failed");
  }
};

export const virusScanMiddleware = async (req, res, next) => {
  if (!req.file && !req.files) return next();

  try {
    const files = req.file ? [req.file] : req.files;

    for (const file of files) {
      const scanResult = await scanForViruses(file.path);

      if (!scanResult.clean) {
        // Delete infected file
        fs.unlinkSync(file.path);

        return res.status(400).json({
          success: false,
          message: "File rejected: potential security threat detected",
          threat: scanResult.threat,
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Security scan failed",
    });
  }
};
