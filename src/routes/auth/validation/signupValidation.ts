import { NextFunction, Response, Request } from "express";
import Joi from "joi";

export const userSchemaSignup = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required(),
  orgCode: Joi.string().required(),
});

export const signupValidateMiddleware =
  (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    console.log("inside signup VALIDATION");
    console.log(req.body);
    const { error } = schema.validate(req.body);
    console.log(error);
    if (error) return res.status(400).send(error.details[0].message);
    console.log("we made it past the signup middleware!");
    next();
  };
