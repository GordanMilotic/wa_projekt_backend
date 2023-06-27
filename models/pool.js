import mongoose from "mongoose";

const poolSchema = new mongoose.Schema({
  name: String,
  phLevel: Number,
  clLevel: Number,
  tabletCount: Number,
  cleaningMethods: [String],
  chemicalsPoured: String,
  chemicalsQuantity: Number,
  startPictures: [
    {
      data: Buffer,
      contentType: String,
    },
  ],
  endPictures: [
    {
      data: Buffer,
      contentType: String,
    },
  ],
  username: String,
  napomena: String,
});
const Pool = mongoose.model("Pool", poolSchema);
export default Pool;
