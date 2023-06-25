import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";

import Owner from "../models/owner.js";
import Employee from "../models/employee.js";
import Pool from "../models/pool.js";
import Fault from "../models/fault.js";

const app = express();
const port = 4001;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
app.use(bodyParser.json());

app.listen(port, () => {
  console.log("hello", port);
});

const uri =
  "mongodb+srv://GordanMilotic:gordan@cluster0.j5zzqsk.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: {
      version: "1",
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(() => console.log("You successfully connected to MongoDB!"))
  .catch((error) => console.error("Error connecting to MongoDB: ", error));

const predefinedUsers = async () => {
  const employees = [
    { username: "Gordan", password: "abc" },
    { username: "Pero", password: "123" },
  ];

  for (const employeeData of employees) {
    const { username, password } = employeeData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingEmployee = await Employee.findOne({ username });

    if (!existingEmployee) {
      const employee = new Employee({ username, password: hashedPassword });
      await employee.save();
    }
  }

  const owners = [
    {
      name: "Eric",
      surname: "Ostoni",
      password: "eric",
      pool_id: ["abc123", "abb111", "abc999"],
    },
  ];

  for (const ownerData of owners) {
    const { name, surname, password, pool_id } = ownerData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingOwner = await Owner.findOne({ name, surname });

    if (!existingOwner) {
      const owner = new Owner({
        name,
        surname,
        password: hashedPassword,
        pool_id,
      });
      await owner.save();
    }
  }

  console.log("Spremljeni korisnici");
};

predefinedUsers();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/employee/login", async (req, res) => {
  const { username, password } = req.body;

  const employee = await Employee.findOne({ username });

  if (!employee) {
    return res.status(400).json({ message: "Zaposlenik ne postoji" });
  }

  const isMatch = await bcrypt.compare(password, employee.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Pogrešna lozinka!" });
  }

  res.status(200).json({ message: "Zaposlenik uspješno prijavljen!" });
});

app.post("/owner/login", async (req, res) => {
  const { name, surname, password, pool_id } = req.body;

  const owner = await Owner.findOne({ name, surname });

  if (!owner) {
    return res.status(400).json({ message: "Vlasnik ne postoji!" });
  }

  const isMatch = await bcrypt.compare(password, owner.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Pogrešna lozinka!" });
  }

  if (!owner.pool_id.includes(pool_id)) {
    return res.status(400).json({ message: "Niste vlasnik tog bazena!" });
  }

  res.status(200).json({ message: "Vlasnik uspješno prijavljen!" });
});

app.post(
  "/pool",
  upload.fields([
    { name: "startPictures", maxCount: 3 },
    { name: "endPictures", maxCount: 3 },
  ]),
  async (req, res) => {
    const {
      username,
      name,
      phLevel,
      clLevel,
      tabletCount,
      cleaningMethods,
      chemicalsPoured,
      chemicalsQuantity,
      napomena,
    } = req.body;

    if (!name || !phLevel || !clLevel || !username) {
      return res
        .status(400)
        .json({ message: "Sva polja moraju biti popunjena!" });
    }

    const isNumeric = (value) => !isNaN(parseFloat(value)) && isFinite(value);
    if (tabletCount !== "" && !isNumeric(tabletCount)) {
      return res.status(400).json({ message: "Neispravan broj tableta!" });
    }

    const validCleaningMethods = [
      "Usisavanje",
      "Četkanje",
      "Pranje rubne linije",
    ];

    if (
      cleaningMethods &&
      !cleaningMethods.every((method) => validCleaningMethods.includes(method))
    ) {
      return res
        .status(400)
        .json({ message: "Morate izabrati valjanu metodu čišćenja!" });
    }

    const validChemicals = ["PH minus", "PH plus", "Bez kemije"];
    if (
      chemicalsPoured !== "Bez kemije" &&
      !validChemicals.includes(chemicalsPoured)
    ) {
      return res
        .status(400)
        .json({ message: "Morate izabrati valjanu kemiju!" });
    }

    try {
      const startPictures = req.files["startPictures"].map((file) => ({
        data: fs.readFileSync(file.path),
        contentType: file.mimetype,
      }));

      const endPictures = req.files["endPictures"].map((file) => ({
        data: fs.readFileSync(file.path),
        contentType: file.mimetype,
      }));

      const pool = new Pool({
        username,
        name,
        phLevel,
        clLevel,
        tabletCount: tabletCount !== "" ? Number(tabletCount) : null,
        cleaningMethods: cleaningMethods ? cleaningMethods.split(",") : [],
        chemicalsPoured,
        chemicalsQuantity: isNumeric(chemicalsQuantity)
          ? Number(chemicalsQuantity)
          : null,
        startPictures,
        endPictures,
        napomena,
      });

      await pool.save();

      req.files["startPictures"].forEach((file) => fs.unlinkSync(file.path));
      req.files["endPictures"].forEach((file) => fs.unlinkSync(file.path));

      res
        .status(200)
        .json({ message: "Informacije o bazenu uspješno prijavljene!" });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Došlo je do interne greške na serveru." });
    }
  }
);

app.post("/fault", async (req, res) => {
  const { pool, owner, description, dateReported, reportedBy } = req.body;

  try {
    const fault = new Fault({
      pool,
      owner,
      description,
      dateReported,
      reportedBy,
    });

    await fault.save();

    res.status(200).json({
      message: "Informacije o kvaru/nedostatku uspješno prijavljene!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/employee/logout", async (req, res) => {
  res.status(200).json({ message: "Zaposlenik uspješno odjavljen!" });
});

app.post("/owner/logout", async (req, res) => {
  res.status(200).json({ message: "Vlasnik uspješno odjavljen" });
});
