import { NextFunction, Response, Request } from "express";
import Joi from "joi";

export const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const studentSchema = Joi.object({
  orgCode: Joi.alternatives().try(
    Joi.string().length(6),
    Joi.string().length(1).required()
  ),
});

export const loginValidateMiddleware =
  (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = req.body.orgCode
      ? studentSchema.validate(req.body)
      : schema.validate(req.body);
    if (error)
      return res.status(400).send({ error: "Issue with organization code" });
    next();
  };

// Usage
//   app.post('/api/signup', validateMiddleware(userSchema), async (req, res) => {
//     try {
//       const user = new User(req.body);
//       await user.save();
//       res.send('User registered successfully');
//     } catch (err) {
//       res.status(500).send('Internal Server Error');
//     }
//   });
