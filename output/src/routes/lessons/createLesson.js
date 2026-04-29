import { mongo } from "../../index.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { clearUploadsFolder } from "./logic/clearImages.js";
cloudinary.config({
    cloud_name: "dxminwnb3",
    api_key: "452779743532375",
    api_secret: "2SdKyLiAzSmS1R81eMNYXD-obBw",
});
export async function createLesson(req, res) {
    const { headline, description, instructions, language, class: classAgeGroup, userId, orgCode, } = req.body;
    // Access files using req.files
    const files = req.files;
    if (headline && description && instructions && language) {
        const classId = uuidv4();
        try {
            const user = await mongo.find({ userId }, "users");
            const mostRecentLessonId = await mongo.findLatest("lessons");
            // console.log(files);
            if (files && files.length) {
                async function uploadImages() {
                    const newStorageFolderName = mostRecentLessonId
                        ? mostRecentLessonId.lessonId + 1
                        : classId;
                    if (!files)
                        return;
                    try {
                        // Create the folder if it doesn't exist
                        await cloudinary.api.create_folder(newStorageFolderName);
                        // Upload each file to the folder
                        const uploadPromises = files.map(async (file) => {
                            const filePath = file.path; // Assuming this is the path to the file
                            // Read the content of the file and create a Buffer
                            const fileBuffer = fs.readFileSync(filePath);
                            const result = await cloudinary.uploader
                                .upload_stream({
                                folder: newStorageFolderName,
                                public_id: file.filename.replace(/\.[^/.]+$/, ""),
                            }, (error, result) => {
                                if (error) {
                                    console.error(`Error uploading ${file.filename}:`, error);
                                }
                                else {
                                    console.log(`Uploaded ${result?.original_filename} to ${result?.url}`);
                                }
                            })
                                .end(fileBuffer);
                        });
                        // Wait for all uploads to complete
                        await Promise.all(uploadPromises);
                        clearUploadsFolder();
                        console.log("All files uploaded successfully.");
                    }
                    catch (error) {
                        console.error("Error uploading files:", error);
                    }
                }
                // Call the function to upload files to the folder
                uploadImages();
            }
            const newLesson = {
                lessonData: {
                    headline,
                    description,
                    instructions,
                    language,
                    classAgeGroup,
                },
                classId,
                orgCode,
                createdAt: new Date().toISOString(),
                createdBy: userId,
                createdByInfo: {
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    profilePic: user?.profilePic,
                },
                participants: [userId],
                imagesToScan: files && files.length ? files.length : null,
            };
            if (mostRecentLessonId && mostRecentLessonId.lessonId) {
                newLesson.lessonId = mostRecentLessonId.lessonId + 1;
            }
            else {
                newLesson.lessonId = 1;
            }
            const addedLesson = await mongo.createLesson(newLesson, "lessons");
            await Promise.all([
                mongo.updateCollection({ userId }, {
                    $push: { activeLessons: classId },
                }, "users"),
                mongo.updateCollection({ orgCode }, { $push: { activeLessons: classId } }, "organizations"),
            ]);
            res.status(200).send(JSON.stringify(addedLesson));
        }
        catch (e) {
            console.log("create-lesson catch", e);
        }
    }
    return null;
}
