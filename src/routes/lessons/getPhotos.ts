import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { getModels } from "./getModels.js";

cloudinary.config({
  cloud_name: "dxminwnb3",
  api_key: "452779743532375",
  api_secret: "2SdKyLiAzSmS1R81eMNYXD-obBw",
});

export async function getPhotos(req: Request, res: Response) {
  const { lessonId } = req?.body;
  if (!lessonId) return;

  // if (req.body.isShouldGet3dModels) {
  const modelUrls = await getModels(lessonId);

  try {
    // List resources in the specified folder
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: lessonId,
    });

    // Extract URLs from the result and send them to the frontend
    const imageUrls = result.resources.map(
      (resource: any) => resource.secure_url
    );

    const urls = [...imageUrls, ...modelUrls];

    const sortedUrls = sortUrlsByNumber(urls);

    const organizedFiles = organizeFiles(sortedUrls);

    console.log("ORGNAIZED FILES");
    console.log(organizedFiles);

    res.json(organizedFiles);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal Server Error" });
  }
}

function extractNumberFromUrl(url: string) {
  // Use a regular expression to find the number before the extension
  const match = url.match(/\/(\d+)\.\w+$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function sortUrlsByNumber(urls: any) {
  return urls.sort((a: string, b: string) => {
    const numA = extractNumberFromUrl(a);
    const numB = extractNumberFromUrl(b);
    if (!numA || !numB) return;
    return numA - numB;
  });
}

function organizeFiles(urls: [string]) {
  const fileMap = new Map();

  urls.forEach((url) => {
    const parts = url.split("/");
    const folderNumber = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];
    const [fileNumber, extension] = fileName.split(".");

    if (!fileMap.has(fileNumber)) {
      fileMap.set(fileNumber, {});
    }

    if (extension === "mtl") {
      fileMap.get(fileNumber).mtl = url;
    } else if (extension === "obj") {
      fileMap.get(fileNumber).obj = url;
    } else {
      fileMap.get(fileNumber).image = url;
    }
  });

  // Convert the map to an array of objects sorted by file
  const sortedArray = Array.from(fileMap.entries())
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map((entry) => entry[1]);

  return sortedArray;
}
