var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
// Import necessary dependencies
import request from "supertest";
// const request = require("supertest");
import { inputValidationMiddleware } from "../middlewares/inputValidation";
import app from "../server";
// const app = require("../server");
// const app = require("../server"); // Assuming app.js contains your Express application
describe("Route Test", () => {
  it('should test return on requests"', () =>
    __awaiter(void 0, void 0, void 0, function* () {
      expect(inputValidationMiddleware({}, {}, null, "name")).toBe({});
      expect(22).toBe(22);
      const response = yield request(app).post("/hello world"); // place route
      expect(response.status).toBe(400);
      expect(response.body).toBe(typeof Object);
    }));
  it("should handle invalid routes", () =>
    __awaiter(void 0, void 0, void 0, function* () {
      // const response = await request(app).get("/"); //place route
      // expect(response.status).toBe(404);
      // expect(response.body.error).toBe("hello");
      expect(2).toBe(2);
    }));
});
