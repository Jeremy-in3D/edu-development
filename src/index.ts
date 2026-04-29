import express from "express";
import cors from "cors";
import { MongoDB } from "../mongodb.js";
import { signup } from "./routes/auth/signup.js";
import { Request, Response, NextFunction } from "express";
import { login } from "./routes/auth/login.js";
import { createLesson } from "./routes/lessons/createLesson.js";
import { getActiveLessons } from "./routes/lessons/getActiveLessons.js";
import { joinLesson } from "./routes/lessons/joinLesson.js";
import multer from "multer";
import { handleAccountDetails } from "./routes/account/handleAccountDetails.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPhotos } from "./routes/lessons/getPhotos.js";
import {
  loginValidateMiddleware,
  userSchema,
} from "./routes/auth/validation/loginValidation.js";
import {
  signupValidateMiddleware,
  userSchemaSignup,
} from "./routes/auth/validation/signupValidation.js";
import { getOrgMembers } from "./routes/orgs/getOrgMembers.js";
import { verifyToken } from "./routes/auth/validation/jwtValidation.js";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { BlobServiceClient } from "@azure/storage-blob";

const app = express();
const port = process.env.PORT || 3000;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const getMongoURI = (): string => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("❌ MONGO_URI is missing");
  }
  return uri;
};

export const mongo = new MongoDB(getMongoURI());

const cloudName = process.env.CLOUD_NAME || "";
const cloudAPIKey = process.env.CLOUD_API_KEY || "";
const cloudAPISecret = process.env.CLOUD_API_SECRET || "";

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudAPIKey,
  api_secret: cloudAPISecret,
});

// Function to clear the uploads folder

const clearUploadsFolder = () => {
  const folder = "src/uploads/";

  const files = fs.readdirSync(folder);

  // Delete all files in the uploads folder

  for (const file of files) {
    fs.unlinkSync(path.join(folder, file));
  }
};

const clearUploadsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  clearUploadsFolder();

  next();
};

interface CustomRequest extends Request {
  fileIndex?: number;
}

const storage = multer.diskStorage({
  destination: "src/uploads/",

  filename: function (req: CustomRequest, file, cb) {
    try {
      if (req.fileIndex === undefined) {
        req.fileIndex = 0; // Initialize counter if not present
      }

      req.fileIndex += 1;

      // Generate the filename based on the fileIndex counter

      const fileIndex = req.fileIndex;

      const fileExtension = path.extname(file.originalname);

      const fileName = `${fileIndex}${fileExtension}`;

      cb(null, fileName);
    } catch (error) {
      cb(new Error(`Maximum number of files reached: ${error}`), "");
    }
  },
});

const upload = multer({ storage: storage });

// const cloudinary = require("cloudinary").v2;

// app.use(cors());
app.use(
  cors({
    // origin: "https://education-client.vercel.app",
    // methods: ["GET", "POST"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // per IP
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for login/signup
});

app.use(limiter); // global
app.use("/uploads", express.static("uploads"));
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!,
);
const container = blobService.getContainerClient("models");

// Placeholder "database". Replace with your real DB.
type ModelStatus = "pending" | "ready" | "failed";
interface ModelRecord {
  modelId: string;
  userId: string;
  prompt: string;
  tripoTaskId: string;
  status: ModelStatus;
  blobName?: string;
  error?: string;
  createdAt: number;
}
const models = new Map<string, ModelRecord>();

// --- the background worker ---

async function pollAndStore(modelId: string) {
  const record = models.get(modelId);
  if (!record) return;

  const tripoKey = process.env.TRIPO_API_KEY;

  try {
    let model_url: string | undefined;

    for (let attempts = 0; attempts < 80; attempts++) {
      const statusRes = await fetch(
        `https://api.tripo3d.ai/v2/openapi/task/${record.tripoTaskId}`,
        { headers: { Authorization: `Bearer ${tripoKey}` } },
      );
      const statusData = await statusRes.json();
      const taskStatus = statusData.data.status;
      console.log(`[${modelId}] Poll #${attempts + 1}: ${taskStatus}`);

      if (taskStatus === "success") {
        model_url = statusData.data.output.pbr_model;
        break;
      } else if (taskStatus === "failed") {
        throw new Error("Tripo generation failed");
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    if (!model_url) throw new Error("Generation timed out");

    // Download from Tripo
    const glbRes = await fetch(model_url);
    const glbBuffer = await glbRes.arrayBuffer();
    console.log(`[${modelId}] GLB size: ${glbBuffer.byteLength} bytes`);

    // Upload to Azure
    const blobName = `${record.userId}/${modelId}.glb`;
    const blockBlob = container.getBlockBlobClient(blobName);
    await blockBlob.uploadData(Buffer.from(glbBuffer), {
      blobHTTPHeaders: { blobContentType: "model/gltf-binary" },
    });

    // Mark ready
    record.status = "ready";
    record.blobName = blobName;
    models.set(modelId, record);
    console.log(`[${modelId}] Ready`);
  } catch (err: any) {
    console.error(`[${modelId}] Failed:`, err.message);
    record.status = "failed";
    record.error = err.message;
    models.set(modelId, record);
  }
}

app.get("/", async (req, res) => {
  console.log("connected");
  res.send("EducationalARDemo");
});

app.get("/health", express.json(), async (req, res) => {
  try {
    // getPhotos(req, res);
    console.log("health check");
    res.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/fetchPhotos", verifyToken, express.json(), async (req, res) => {
  try {
    getPhotos(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/account", verifyToken, async (req, res) =>
  handleAccountDetails(req, res),
);

app.post("/active-lessons", verifyToken, async (req, res) =>
  getActiveLessons(req, res),
);

app.post(
  "/create-lesson",
  verifyToken,
  clearUploadsMiddleware,
  upload.array("files", 10),
  async (req: Request, res: Response) => createLesson(req, res),
);

app.post("/join-lesson", verifyToken, async (req: Request, res: Response) =>
  joinLesson(req, res),
);

app.post(
  "/login",
  authLimiter,
  loginValidateMiddleware(userSchema),
  async (req: Request, res: Response) => login(req, res),
);

app.post(
  "/signup",
  authLimiter,
  signupValidateMiddleware(userSchemaSignup),
  async (req: Request, res: Response) => signup(req, res),
);

app.post("/org-members", verifyToken, async (req: Request, res: Response) =>
  getOrgMembers(req, res),
);

app.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const photoToUpload = req.file;

      if (!photoToUpload || !req.body) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload file to Cloudinary
      const result = await cloudinary.uploader.upload(photoToUpload.path);

      if (result) {
        await mongo.updateCollection(
          { userId: req.body.userId },
          { $set: { profilePic: result.url } },
          "users",
        );
      }

      console.log("File uploaded to Cloudinary:", result);

      res.status(200).json({ message: "File uploaded successfully" });
    } catch (error) {
      console.error("Error uploading file to Cloudinary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post("/generate-model", async (req, res) => {
  try {
    const { prompt } = req.body;
    const tripoKey = process.env.TRIPO_API_KEY;
    console.log("Prompt:", prompt);

    // 1. Create the task
    const taskRes = await fetch("https://api.tripo3d.ai/v2/openapi/task", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tripoKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "text_to_model", prompt }),
    });

    const initialData = await taskRes.json();
    if (initialData.code !== 0) throw new Error(initialData.message);
    const task_id = initialData.data.task_id;
    console.log(`Task created: ${task_id}`);

    // 2. Poll
    let model_url;
    for (let attempts = 0; attempts < 80; attempts++) {
      const statusRes = await fetch(
        `https://api.tripo3d.ai/v2/openapi/task/${task_id}`,
        { headers: { Authorization: `Bearer ${tripoKey}` } },
      );
      const statusData = await statusRes.json();
      const taskStatus = statusData.data.status;
      console.log(`Poll #${attempts + 1}: ${taskStatus}`);

      if (taskStatus === "success") {
        model_url = statusData.data.output.pbr_model;
        break;
      } else if (taskStatus === "failed") {
        throw new Error("Tripo generation failed");
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    if (!model_url) throw new Error("Generation timed out");

    // 3. Download and send the GLB
    const glbRes = await fetch(model_url);
    const glbBuffer = await glbRes.arrayBuffer();
    console.log(`GLB size: ${glbBuffer.byteLength} bytes`);

    res.set("Content-Type", "model/gltf-binary");
    res.send(Buffer.from(glbBuffer));
  } catch (error: any) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// app.post("/generate-model", verifyToken, async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     console.log("The prompt: ", prompt);
//     const userId = req.body.userId ?? "0";
//     const tripoKey = process.env.TRIPO_API_KEY;

//     // 1. Create the Tripo task
//     const taskRes = await fetch("https://api.tripo3d.ai/v2/openapi/task", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${tripoKey}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ type: "text_to_model", prompt }),
//     });
//     const initialData = await taskRes.json();
//     if (initialData.code !== 0) throw new Error(initialData.message);
//     const tripoTaskId = initialData.data.task_id;

//     // 2. Create our own record
//     const modelId = crypto.randomUUID();
//     models.set(modelId, {
//       modelId,
//       userId,
//       prompt,
//       tripoTaskId,
//       status: "pending",
//       createdAt: Date.now(),
//     });

//     // 3. Kick off background polling (don't await)
//     setImmediate(() => pollAndStore(modelId));

//     // 4. Respond immediately
//     res.json({ modelId, status: "pending" });
//   } catch (error: any) {
//     console.error("Error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

// Frontend polls this to check status / get the model
app.get("/models/:id", verifyToken, async (req, res) => {
  const record = models.get(req.params.id);
  if (!record) return res.status(404).json({ error: "Not found" });

  if (record.status !== "ready") {
    return res.json({
      modelId: record.modelId,
      status: record.status,
      error: record.error,
    });
  }

  // Stream the blob back to the client
  const blockBlob = container.getBlockBlobClient(record.blobName!);
  const download = await blockBlob.download();
  res.set("Content-Type", "model/gltf-binary");
  download.readableStreamBody?.pipe(res);
});

app.post("/verify-token", verifyToken, (req, res) => {
  // res.status(200).send(true);
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});

(async () => {
  try {
    await mongo.connect();
    // createOrg({ mongo });
    // const addNewOrg = createOrg({ mongo });
  } catch (e) {
    console.log("Error", e);
  }
})();
