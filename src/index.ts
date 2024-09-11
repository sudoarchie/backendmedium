import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(bodyparser());
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
  const data = req.body;
  try {
    const createdData = await prisma.blog.create({
      data: {
        title: data.title,
        authorId: data.authorId,
        likes: data.likes,
        comments: data.comments,
        content: data.content,
      },
    });
    res.status(200).json(createdData);
  } catch {
    res.status(500).json({
      msg: "Something when wrong!!",
    });
  }
});
app.post("/api/v1/createUser", async (req, res) => {
  try {
    const email = req.headers["email"]; // Retrieve 'email' from headers
    const password = req.headers["password"];
    const createData = await prisma.user.create({
      data: {
        email: <string>email,
        password: <string>password,
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
app.get("/api/v1/login",async (req,res)=>{
  try{
    const email = req.headers["email"]
    const password = req.headers["password"]
    
  }
})

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
function bodyparser(): any {
  throw new Error("Function not implemented.");
}
