import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import crypto from "crypto";
import { sendVerificationEmail } from "./email.service.js";

export const registerUser = async ({ username, email, password }) => {
  console.log("REGISTER USER SERVICE CALLED");
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });


  if (existingUser) {
    if (existingUser.username === username) {
      throw new Error("Username already exists");
    }

    if (existingUser.email === email) {
      throw new Error("Email already exists");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const verificationExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,

      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    },

    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  // Send verification email
  await sendVerificationEmail(
    user.email,
    user.username,
    verificationToken
  );

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  // Don't allow unverified users to login
  if (!user.emailVerified) {
    throw new Error(
      "Please verify your email before logging in"
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  };
};