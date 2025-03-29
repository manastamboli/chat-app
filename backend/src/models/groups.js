import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // User IDs
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin User ID
    createdAt: { type: Date, default: Date.now },
});

const Group=mongoose.model("Group",groupSchema)
export default Group;