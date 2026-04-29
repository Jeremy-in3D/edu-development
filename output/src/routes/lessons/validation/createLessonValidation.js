import Joi from "joi";
export const newLessonSchema = Joi.object({
    headline: Joi.string().required(),
    description: Joi.string().required(),
    instructions: Joi.string().required(),
    language: Joi.string(),
    class: Joi.string(),
    userId: Joi.string(),
});
export const createLessonValidateMiddleware = (schema) => (req, res, next) => {
    console.log("inside create LESSson VALIDATION");
    console.log(req.body);
    const { error } = schema.validate(req.body);
    console.log(error);
    if (error)
        return res.status(400).send(error.details[0].message);
    console.log("we made it past the create-lesson middleware!");
    next();
};
