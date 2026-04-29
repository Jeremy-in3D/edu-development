import { Collection, MongoClient } from "mongodb";
import { SignupObj } from "./src/routes/auth/signup.js";

export const isDevelopment = process.env.isDevelopment;

type CollectionIds = "users" | "lessons" | "organizations";

export class MongoDB {
  client: MongoClient;

  constructor(uri: string) {
    this.client = new MongoClient(uri);
  }
  connect() {
    return this.client.connect();
  }

  close() {
    return this.client.close();
  }

  insertToCollection(payload: any, collectionId: CollectionIds) {
    const collection = this.getCollection(collectionId).insertOne(payload);
    return collection;
  }

  createLesson(payload: any, collectionId: CollectionIds) {
    const collection = this.getCollection(collectionId).insertOne(payload);
    return collection;
  }

  find(payload: any, collectionId: string, limit?: number) {
    const collection = this.getCollection(collectionId).findOne(payload);
    return collection;
  }

  findLatest(collectionId: string) {
    const collection = this.getCollection(collectionId).findOne(
      {},
      {
        sort: { _id: -1 },
        projection: { _id: 0, lessonId: 1 },
      }
    );
    return collection;
  }

  getActiveLessons(lessons: any) {
    const activeLessons = this.getCollection("lessons").findOne({
      lessonId: lessons,
    });
    return activeLessons;
  }

  login(payload: string, collectionId: CollectionIds) {
    const collection = this.getCollection(collectionId).findOne({
      email: payload,
    });
    return collection;
  }

  signup(payload: SignupObj, collectionId: CollectionIds) {
    const collection = this.getCollection(collectionId).insertOne(payload);
    return collection;
  }

  updateCollection(payload: any, update: any, collectionId: CollectionIds) {
    const collection = this.getCollection(collectionId).updateOne(
      payload,
      update
    );
    return collection;
  }

  //This makes the collection your are querying more dynamic in individual endpoints
  getCollection(collectionId: string): Collection {
    return this.client.db("education").collection(collectionId);
  }
}
