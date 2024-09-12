import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
require("dotenv").config();
const secretKey = process.env.BCRY_PASS;
const saltRounds = 10;
const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());
app.get("/api/v1/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/v1/blog", async (req, res) => {
  try {
    const userdata = await prisma.blog.findMany();
    res.status(200).json(userdata);
  } catch {
    res.send("something went wrong!!");
  }
});
app.get("/api/v1/blog/:id", async (req, res) => {
  const blogid = req.params.id;
  const data = await prisma.blog.findUnique({
    where: {
      id: blogid,
    },
  });
  res.status(200).json(data);
});
app.post("/api/v1/create", async (req, res) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ msg: "Token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secretKey") as JwtPayload;

    const data = req.body;

    // Ensure decoded object has id property
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return res.status(403).json({ msg: "Invalid token payload" });
    }

    const createdData = await prisma.blog.create({
      data: {
        title: data.title,
        authorId: decoded.id,
        likes: data.likes,
        content: data.content,
        comments: {
          create: data.comments.map(
            (comment: { user: string; comment: string }) => ({
              content: comment.comment,
              user: {
                connectOrCreate: {
                  where: { email: comment.user }, // Assuming you can identify users by email
                  create: { email: comment.user, password: "" }, // You might want to handle passwords differently
                },
              },
            })
          ),
        },
      },
    });

    res.status(200).json(createdData);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      msg: "Something went wrong!",
    });
  }
});
app.post("/api/v1/createuser", async (req, res) => {
  try {
    const email = req.headers["email"] as string; // Retrieve 'email' from headers
    const password = req.headers["password"] as string;
    const hashPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password:", hashPassword);

    // Create user in the database
    const createData = await prisma.user.create({
      data: {
        email: email,
        password: hashPassword,
      },
    });

    res.status(200).json({
      msg: "Account created successful",
    });
  } catch {
    res.status(500).json({
      msg: "Something when wrong",
    });
  }
});
app.get("/api/v1/login", async (req, res) => {
  try {
    const email = req.headers["email"] as string;
    const password = req.headers["password"] as string;
    // const hashPassword = await bcrypt.hash(password, saltRounds);
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        const token = jwt.sign({ id: user.id }, "secretKey");
        res.status(201).json({
          token: `Bearer ${token}`,
        });
      } else {
        res.status(400).json({
          msg: "wrong credentials",
        });
      }
    }
  } catch {}
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
