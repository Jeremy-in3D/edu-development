import { Request, Response } from "express";
// import { mongo } from "../..";

export async function getOrgMembers(req: Request, res: Response) {
  const { orgCode, usersToQuery } = req.body;

  // const members = await mongo.find({ orgCode }, "organizations");
}
