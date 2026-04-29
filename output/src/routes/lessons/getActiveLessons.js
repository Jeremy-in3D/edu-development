import { mongo } from "../../index.js";
export async function getActiveLessons(req, res) {
    const { userId, orgCode } = req.body;
    // if (!userId) {
    //   res.status(404).send({ error: "Error fetching active lessons" });
    //   return;
    // }
    if (userId) {
        try {
            const user = await mongo.find({ userId }, "users");
            const activeLessonsPromises = user.activeLessons.map(async (lesson) => {
                const lessonData = await mongo.find({ classId: lesson }, "lessons");
                return lessonData;
            });
            const activeLessons = await Promise.all(activeLessonsPromises);
            res.send(activeLessons);
            return;
        }
        catch (e) {
            console.log("lessons userId catch", e);
        }
    }
    if (orgCode || orgCode === "0") {
        try {
            const orgData = await mongo.find({ orgCode }, "organizations");
            const activeLessonsPromises = orgData.activeLessons.map(async (lesson) => {
                const lessonData = await mongo.find({ classId: lesson }, "lessons");
                return lessonData;
            });
            const activeLessons = await Promise.all(activeLessonsPromises);
            res.send(activeLessons);
        }
        catch (e) {
            console.log("lessons orgCode catch", e);
        }
        return null;
    }
}
