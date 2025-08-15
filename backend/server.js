const cors = require("cors");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");

// TODO: Use dotenv-safe to manage environment variables
// TODO: Use logging library instead of console.log
// TODO: Use queue system to process requests asynchronously
// TODO: Use express-validator or Joi to validate request data
// TODO: Add rate limiting with express-rate-limit
// TODO: Use ndarray for matrix operations in preprocess()
// TODO: Add unit tests for critical functions like infer() and preprocess()
// TODO: Mock OVMS responses for testing purposes, under different scenarios,
// e.g., success, failure, invalid response
// TODO: Add API documentation using Swagger or Postman
// TODO: Validate OVMS_* environment variables at startup
// TODO: Remember to test preprocess() with edge cases, such as
// (1) extremely small or large images,
// (2) image with unsupported format,
// (3) corrupted image files.
// TODO: Make startup log message more descriptive
// e.g., "development" or "production" mode, OVMS host and port, etc.

require("dotenv-safe").config();

// Backend server port
const PORT = 3001;

// OpenVINO Model Server (OVMS) hostname
const OVMS_HOSTNAME = process.env.OVMS_HOSTNAME || "model-server";

// OpenVINO Model Server (OVMS) port
const OVMS_PORT = process.env.OVMS_PORT || 8000;

// Frontend origin for CORS (must be set properly in production)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Preprocessed image size
const IMAGE_SIZE = 224;

// Scale factor for resizing images
const RESIZE_SCALE = 256;

// Maximum file size for uploads
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB

// Supported image formats for sharp
const SUPPORTED_FORMATS = ["jpeg", "png", "webp", "gif", "avif", "tiff"];

// Main function to set up and start the server
function main() {
    const app = express();
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB limit
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith("image/")) {
                return cb(new Error("Only image files are allowed."));
            }
            cb(null, true);
        }
    });

    app.use(cors({ origin: FRONTEND_ORIGIN }));

    app.use(express.json());

    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: "Internal server error." });
    })

    app.post("/v1/infer", upload.single("image"), async (req, res) => {
        if (!req.file) {
            return res
                .status(400)
                .json({
                    error: "Bad request error.",
                    details: "No file uploaded.",
                });
        }
        try {
            const output = await infer(req.file.buffer);
            const cat = output.outputs[0].data[1];
            const catProb = Math.round(cat * 1000) / 10;
            res.json({ cat: catProb });
        } catch (error) {
            console.error(error);
            if (error.message.includes("Unsupported image format")) {
                return res
                    .status(400)
                    .json({
                        error: "Bad request error.",
                        details: error.message,
                    });
            }
            res.status(500).json({
                error: "Internal server error.",
                details: "Inference failed. " + error.message,
            });
        }
    });

    app.listen(PORT, () => {
        // TODO: Use log file instead
        console.log(`Backend server listening on port ${PORT}`);
    });
}

/**
 * Performs inference on the provided image buffer using OpenVINO Model Server.
 * @param {Buffer} imageBuffer 
 * @returns Inference result if success, otherwise, throws an error.
 */
async function infer(imageBuffer) {
    const body = {
        inputs: [
            {
                name: "images",
                shape: [1, 3, IMAGE_SIZE, IMAGE_SIZE],
                datatype: "FP32",
                data: await preprocess(imageBuffer),
            },
        ],
    };
    const res = await fetch(
        `http://${OVMS_HOSTNAME}:${OVMS_PORT}/v2/models/catdog/infer`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }
    );
    if (!res.ok) {
        throw new Error(
            `OVMS returned status ${res.status}: ${await res.text()}`
        );
    }
    return await res.json();
}

/**
 * Preprocess the image buffer for inference.
 * @param {Buffer} imageBuffer 
 * @returns Preprocessed image data as an Array.
 */
async function preprocess(imageBuffer) {
    const image = sharp(imageBuffer);
    const { width, height, format } = await image.metadata();
    if (!width || !height || !format) {
        throw new Error(
            "Invalid image metadata: width, height, or format missing."
        );
    }
    if (!SUPPORTED_FORMATS.includes(format)) {
        throw new Error(`Unsupported image format: ${format}`);
    }
    const scale = RESIZE_SCALE / Math.min(width, height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    const buffer = await image
        .resize(newWidth, newHeight, { fit: "outside" })
        .extract({
            left: Math.round((newWidth - IMAGE_SIZE) / 2),
            top: Math.round((newHeight - IMAGE_SIZE) / 2),
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
        })
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { data } = buffer;
    const pixels = new Float32Array(data.length);
    const means = [0.485, 0.456, 0.406];
    const stds = [0.229, 0.224, 0.225];
    const redStart = 0;
    const greenStart = 1 * IMAGE_SIZE * IMAGE_SIZE;
    const blueStart = 2 * IMAGE_SIZE * IMAGE_SIZE;
    for (let y = 0; y < IMAGE_SIZE; y += 1) {
        for (let x = 0; x < IMAGE_SIZE; x++) {
            const baseChwIndex = y * IMAGE_SIZE + x;
            const hwcIndex = baseChwIndex * 3;
            pixels[redStart + baseChwIndex] =
                (data[hwcIndex] / 255.0 - means[0]) / stds[0];
            pixels[greenStart + baseChwIndex] =
                (data[hwcIndex + 1] / 255.0 - means[1]) / stds[1];
            pixels[blueStart + baseChwIndex] =
                (data[hwcIndex + 2] / 255.0 - means[2]) / stds[2];
        }
    }
    return Array.from(pixels);
}

/* Main entry point */
main();
