import mongoose from "mongoose";
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  username: String,
  password: String,
});

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
