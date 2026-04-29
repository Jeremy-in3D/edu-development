import { mongo } from "../../index.js";
const getAccountMethod = "getAccountDetails";
const updateAccount = "updateAccountDetails";
export async function handleAccountDetails(req, res) {
    const { method, userId } = req.body;
    if (method == getAccountMethod) {
        const user = await mongo.find({ userId }, "users");
        if (!user)
            return;
        const objToSend = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profilePic: user.profilePic || undefined,
        };
        res.send(objToSend);
    }
    if (method == updateAccount) {
    }
}
