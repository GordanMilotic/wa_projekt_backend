import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ownerSchema = new Schema({
  name: String,
  surname: String,
  password: String,
  pool_id: String,
});

const Owner = mongoose.model("Owner", ownerSchema);
export default Owner;
