// import fs from "fs";
// import path from "path";
// import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export async function getModels(lessonId: number) {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",

      prefix: lessonId,

      resource_type: "raw", // To include raw files like .obj and .mtl
    });

    const fileUrls = result.resources.map(
      (resource: any) => resource.secure_url,
    );

    // const models = fileUrls.filter(
    //   (file: any) =>
    //     file.url && (file.includes(".obj") || file.includes(".mtl"))
    // );

    return fileUrls;
  } catch (error) {
    console.error(error);
  }
}

// export async function getSpecificLesson() {}
