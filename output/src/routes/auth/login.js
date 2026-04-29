import { mongo } from "../../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export async function login(req, res) {
    const { email, password, orgCode } = req.body;
    let orgData;
    // const tokenData: any = {};
    const SECRET_KEY = process.env.SECRET_KEY || "";
    if (email && password) {
        try {
            const user = await mongo.login(email, "users");
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.send({ error: "Invalid username or password" });
                return;
            }
            if (user) {
                const userObj = {
                    name: user.firstName,
                    userId: user.userId,
                    email: user.email,
                };
                const orgData = await mongo.find({ orgCode: user.orgCode }, "organizations");
                userObj.orgCode = orgData?.orgCode;
                userObj.orgName = orgData?.name;
                if (userObj.isAdmin) {
                    userObj.isAdmin = true;
                }
                // if (orgCode) {
                //   console.log("org code in create token");
                //   tokenData.orgCode = orgCode;
                // }
                // if (email) {
                //   console.log("email in create token");
                //   tokenData.email = email;
                // }
                const token = jwt.sign({ orgCode: user.orgCode, email }, SECRET_KEY, {
                    expiresIn: "1d",
                });
                if (email) {
                    const insertedTokenToUser = await mongo.updateCollection({ email }, { $set: { token } }, "users");
                }
                res.status(200).send({ userObj, token });
            }
            else {
                res.send({ error: "Invalid username or password" });
            }
        }
        catch (e) {
            console.log("signup catch", e);
        }
    }
    else if (orgCode) {
        if (orgCode.length == 6 || orgCode == "0") {
            const relevantOrg = await mongo.find({ orgCode }, "organizations");
            console.log("CREAing the JwT");
            console.log(orgCode);
            const token = jwt.sign({ orgCode, email }, SECRET_KEY, {
                expiresIn: "1d",
            });
            if (orgCode == "0") {
                orgData = {
                    isDemo: true,
                    orgName: relevantOrg?.name,
                    orgCode,
                    name: "Demo User",
                    role: "teacher",
                };
            }
            else {
                orgData = { name: relevantOrg?.name, orgCode };
            }
            // const orgData = { name: relevantOrg?.name, orgCode };
            res.status(200).send({ ...orgData, token });
        }
    }
}
