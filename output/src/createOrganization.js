import { v4 as uuidv4 } from "uuid";
// import { MongoDB } from "./mongodb.js";
const orgName = "Demo"; // org name
const admins = ["jeremy@in3dTech.com"]; // enter admin email addresses here
const teachers = ["jeremy@in3dTech.com"]; // enter teacher email addresses here
export async function createOrg({ mongo }) {
    if (!mongo) {
        console.log("error connecting to mongo");
        return;
    }
    function generateRandomCode(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
        return result;
    }
    let code;
    let codeExists = true;
    while (codeExists) {
        code = generateRandomCode(6);
        const existingOrg = await mongo.find({ orgCode: code }, "organizations");
        codeExists = !!existingOrg; // Check if an organization with the generated code exists
    }
    if (!codeExists) {
        const newOrg = {
            createdAt: new Date().toISOString(),
            orgId: uuidv4(),
            orgCode: code,
            orgName,
            admins,
            teachers,
        };
        const createdOrg = await mongo.insertToCollection(newOrg, "organizations");
        if (createdOrg) {
            console.log("successfully added a new organization");
        }
        else {
            console.log("error adding organization");
        }
    }
}
