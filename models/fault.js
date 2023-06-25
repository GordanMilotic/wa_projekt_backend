import mongoose from "mongoose";
const Schema = mongoose.Schema;

const faultSchema = new Schema({
  pool: String,
  owner: String,
  description: String,
  dateReported: String,
  reportedBy: String,
});

const Fault = mongoose.model("Fault", faultSchema);
export default Fault;
