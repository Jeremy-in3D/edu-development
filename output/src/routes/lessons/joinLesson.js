import { mongo } from "../../index.js";
export async function joinLesson(req, res) {
    const { lessonCode, userId } = req.body;
    if (!lessonCode || !userId)
        return null;
    if (typeof Number(lessonCode) != "number") {
        console.log("invalid lesson code");
        return;
    }
    try {
        const activeLesson = await mongo.find({ lessonId: Number(lessonCode) }, "lessons");
        if (activeLesson && activeLesson.classId) {
            mongo.updateCollection({ userId }, { $push: { activeLessons: activeLesson.classId } }, "users");
        }
        mongo.updateCollection({ classId: activeLesson?.classId }, { $push: { participants: userId } }, "lessons");
    }
    catch (err) {
        console.log(err);
    }
    return null;
}
