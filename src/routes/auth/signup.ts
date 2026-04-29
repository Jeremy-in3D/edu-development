// import { Sign } from "crypto";
import { mongo } from "../../index.js";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function signup(req: Request, res: Response) {
  const response: ResponseObj = {};

  const { firstName, lastName, email, orgCode, password } = req.body;
  const SECRET_KEY = process.env.SECRET_KEY || "your_default_secret_key";

  let isAdmin = false;
  let orgName;

  console.log("inside SIGNUP!");

  const userId = uuidv4();

  if (req.body) {
    // const firstCharacterOfOrgCode = Array.from(orgCode)[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const orgData = await mongo.find({ orgCode }, "organizations");

      console.log(orgData);

      if (!orgData) {
        res.send({ error: "Organization code not found" });
        return;
      }
      if (!orgData.members.includes(email)) {
        res.send({ error: "Not a member of the orgnanization" });
        return;
      }

      const signupObj: SignupObj = {
        firstName,
        lastName,
        userId,
        activeLessons: [],
        password: hashedPassword,
        orgCode,
        email,
        isAdmin,
        createdAt: new Date().toISOString(),
      };
      console.log("so we here eh");
      if (orgData?.admins.includes(email)) {
        signupObj.isAdmin = true;
      }

      signupObj.orgName = orgData?.name;

      const newUser = await mongo.signup(signupObj, "users");

      console.log("did we just sign up?");
      console.log(newUser.acknowledged);
      console.log(orgData.members);

      if (
        newUser.acknowledged == true &&
        orgData &&
        orgData.members &&
        orgData.members.length &&
        orgData.members.includes(email)
      ) {
        orgName = orgData.name;

        response.user = {
          name: firstName,
          email,
          isAdmin,
          orgCode: orgData.orgCode,
          orgName: orgData.orgName,
          userId,
        };

        const token = jwt.sign({ orgCode, email }, SECRET_KEY, {
          expiresIn: "1d",
        });

        response.token = token;
      } else {
        response.error = "Email not found in organization";
      }
    } catch (e) {
      console.log("signup catch", e);
    }
  }
  console.log("BOITTOM OF FUNCTIOLN");
  console.log(response);
  res.status(200).send(response);
}

export type SignupObj = {
  firstName: string;
  lastName: string;
  orgCode?: string | number;
  userId: string | number;
  activeLessons: any[];
  email?: string;
  password: string;
  createdAt: string;
  isAdmin?: boolean;
  orgName?: string;
};

type User = {
  name: string;
  password?: string;
  email?: string;
  isAdmin?: boolean;
  orgCode: string;
  orgName: string;
  userId: string;
};

type ResponseObj = {
  user?: User | undefined;
  token?: any;
  error?: string;
};
