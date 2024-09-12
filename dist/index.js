"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv").config();
const secretKey = process.env.BCRY_PASS;
const saltRounds = 10;
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.get("/api/v1/", (req, res) => {
    res.send("Hello World!");
});
app.get("/api/v1/blog", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userdata = yield prisma.blog.findMany();
        res.status(200).json(userdata);
    }
    catch (_a) {
        res.send("something went wrong!!");
    }
}));
app.get("/api/v1/blog/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const blogid = req.params.id;
    const data = yield prisma.blog.findUnique({
        where: {
            id: blogid,
        },
    });
    res.status(200).json(data);
}));
app.post("/api/v1/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(403).json({ msg: "Token is required" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, "secretKey");
        const data = req.body;
        // Ensure decoded object has id property
        if (!decoded || typeof decoded !== "object" || !decoded.id) {
            return res.status(403).json({ msg: "Invalid token payload" });
        }
        const createdData = yield prisma.blog.create({
            data: {
                title: data.title,
                authorId: decoded.id,
                likes: data.likes,
                content: data.content,
                comments: {
                    create: data.comments.map((comment) => ({
                        content: comment.comment,
                        user: {
                            connectOrCreate: {
                                where: { email: comment.user }, // Assuming you can identify users by email
                                create: { email: comment.user, password: "" }, // You might want to handle passwords differently
                            },
                        },
                    })),
                },
            },
        });
        res.status(200).json(createdData);
    }
    catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            msg: "Something went wrong!",
        });
    }
}));
app.post("/api/v1/createuser", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.headers["email"]; // Retrieve 'email' from headers
        const password = req.headers["password"];
        const hashPassword = yield bcrypt_1.default.hash(password, saltRounds);
        console.log("Hashed Password:", hashPassword);
        // Create user in the database
        const createData = yield prisma.user.create({
            data: {
                email: email,
                password: hashPassword,
            },
        });
        res.status(200).json({
            msg: "Account created successful",
        });
    }
    catch (_a) {
        res.status(500).json({
            msg: "Something when wrong",
        });
    }
}));
app.get("/api/v1/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.headers["email"];
        const password = req.headers["password"];
        // const hashPassword = await bcrypt.hash(password, saltRounds);
        const user = yield prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (user) {
            const valid = yield bcrypt_1.default.compare(password, user.password);
            if (valid) {
                const token = jsonwebtoken_1.default.sign({ id: user.id }, "secretKey");
                res.status(201).json({
                    token: `Bearer ${token}`,
                });
            }
            else {
                res.status(400).json({
                    msg: "wrong credentials",
                });
            }
        }
    }
    catch (_a) { }
}));
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
