// import fs from "fs";
// import path from "path";
// import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
    cloud_name: "dxminwnb3",
    api_key: "452779743532375",
    api_secret: "2SdKyLiAzSmS1R81eMNYXD-obBw",
});
export async function getModels(lessonId) {
    try {
        const result = await cloudinary.api.resources({
            type: "upload",
            prefix: lessonId,
            resource_type: "raw", // To include raw files like .obj and .mtl
        });
        const fileUrls = result.resources.map((resource) => resource.secure_url);
        // const models = fileUrls.filter(
        //   (file: any) =>
        //     file.url && (file.includes(".obj") || file.includes(".mtl"))
        // );
        return fileUrls;
    }
    catch (error) {
        console.error(error);
    }
}
// export async function getSpecificLesson() {}
