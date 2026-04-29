import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { mongo } from "../../../index.js";

const DEMO_ORG_CODE = 0;

// export async function validateJwt(req: any, res: any, next: NextFunction) {
//   const authHeader = req.headers.authorization;
//   if (authHeader) {
//     try {
//       const accessToken = req.headers.authorization.split(" ")[1];
//       const decode = jwt.decode(accessToken, { complete: true });
//       const key = await JwksClient.getSigningKey(decode?.header.kid);
//       const signingKey = key.getPublicKey();
//       jwt.verify(accessToken, signingKey);

//       res.status(200).send(
//         JSON.stringify({
//           name: (decode as any).payload?.name,
//           username: (decode as any).payload?.unique_name,
//         })
//       );
//       next();
//     } catch (e) {
//       res.status(400).send("Invalid JWT Validation");
//     }
//   } else {
//     res.status(401).send("No authorization token provided");
//   }
// }
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "No token provided" });

  const SECRET_KEY = process.env.SECRET_KEY || "your_default_secret_key";

  jwt.verify(token, SECRET_KEY, async (err: any, decoded: any) => {
    if (err) return res.json({ error: "Failed to authenticate token" });

    if (decoded?.email) {
      const user = await mongo.find(
        { email: decoded.email, orgCode: decoded.orgCode },
        "users"
      );

      const tokenExistsInUser = user && token === user?.token;

      if (tokenExistsInUser) {
        res.send({
          name: user.firstName,
          userId: user.userId,
          email: user.email,
          orgCode: user.orgCode,
          orgName: user.orgName,
          isAdmin: user.isAdmin,
        });
        return;
      }
    } else if (decoded.orgCode) {
      const relevantOrg = await mongo.find(
        { orgCode: decoded.orgCode },
        "organizations"
      );
      if (decoded.orgCode == DEMO_ORG_CODE) {
        res.send({
          isDemo: true,
          orgName: relevantOrg?.name,
          orgCode: decoded.orgCode,
          name: "Demo User",
          role: "teacher",
        });
        return;
      }
      if (relevantOrg) {
        res.send({
          isDemo: false,
          orgName: relevantOrg?.name,
          orgCode: decoded.orgCode,
          name: "",
          role: "teacher",
        });
        return;
      }
    }

    next();
  });
};

type User = {
  name: string;
  password?: string;
  email?: string;
  userId: string;
  orgCode?: string | undefined;
  orgName?: string | undefined;
  token?: any;
  isAdmin?: boolean;
};
