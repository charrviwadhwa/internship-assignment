import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

export const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      role: role || "VIEWER",
    }).returning();

    res.status(201).json({ 
      message: "User created successfully", 
      userId: newUser.id 
    });
  } catch (error) {
    
    res.status(500).json({ error: error.message });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ 
      message: "Login successful",
      token, 
      role: user.role 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
