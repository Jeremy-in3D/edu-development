import { MongoClient } from "mongodb";
export const isDevelopment = process.env.isDevelopment;
export class MongoDB {
    client;
    constructor(uri) {
        this.client = new MongoClient(uri);
    }
    connect() {
        return this.client.connect();
    }
    close() {
        return this.client.close();
    }
    insertToCollection(payload, collectionId) {
        const collection = this.getCollection(collectionId).insertOne(payload);
        return collection;
    }
    createLesson(payload, collectionId) {
        const collection = this.getCollection(collectionId).insertOne(payload);
        return collection;
    }
    find(payload, collectionId, limit) {
        const collection = this.getCollection(collectionId).findOne(payload);
        return collection;
    }
    findLatest(collectionId) {
        const collection = this.getCollection(collectionId).findOne({}, {
            sort: { _id: -1 },
            projection: { _id: 0, lessonId: 1 },
        });
        return collection;
    }
    getActiveLessons(lessons) {
        const activeLessons = this.getCollection("lessons").findOne({
            lessonId: lessons,
        });
        return activeLessons;
    }
    login(payload, collectionId) {
        const collection = this.getCollection(collectionId).findOne({
            email: payload,
        });
        return collection;
    }
    signup(payload, collectionId) {
        const collection = this.getCollection(collectionId).insertOne(payload);
        return collection;
    }
    updateCollection(payload, update, collectionId) {
        const collection = this.getCollection(collectionId).updateOne(payload, update);
        return collection;
    }
    //This makes the collection your are querying more dynamic in individual endpoints
    getCollection(collectionId) {
        return this.client.db("education").collection(collectionId);
    }
}
