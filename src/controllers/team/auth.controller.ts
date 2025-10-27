import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOtp } from "../../utils/otpGenerator";
import { sendOtpEmail } from "../../utils/mailer";
import { blacklistToken } from "../../services/tokenService";

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateProfileRequest {
  name?: string;
  newEmail?: string;
}

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isActive: boolean;
  };
}

const saltRounds = 12;

const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.userTeam.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "Email sudah terdaftar" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const otp = generateOtp();

    // Create user
    const user = await prisma.userTeam.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        otp,
        isActive: false,
      },
    });

    // Send OTP email - YANG SUDAH DIPERBAIKI
    await sendOtpEmail({ email, otp });

    res.status(201).json({
      message: "Registrasi berhasil. Silakan check email untuk OTP",
      userId: user.id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyOtp = async (
  req: Request<{}, {}, VerifyOtpRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.userTeam.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(400).json({ error: "User tidak ditemukan" });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ error: "OTP salah" });
      return;
    }

    // Update user to active
    await prisma.userTeam.update({
      where: { email },
      data: {
        isActive: true,
        otp: null,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Verifikasi berhasil",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.userTeam.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      res.status(400).json({ error: "Email atau password salah" });
      return;
    }

    if (!user.isActive) {
      const otp = generateOtp();
      await prisma.userTeam.update({
        where: { email },
        data: { otp },
      });

      // YANG SUDAH DIPERBAIKI
      await sendOtpEmail({ email, otp });

      res.status(400).json({
        error: "Akun belum aktif. OTP baru telah dikirim ke email Anda",
        needsVerification: true,
      });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: "Email atau password salah" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasProfile: !!user.profile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, newEmail } = req.body as UpdateProfileRequest;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.userTeam.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User tidak ditemukan" });
      return;
    }

    const updateData: any = {};

    // Update name jika provided
    if (name !== undefined) updateData.name = name;

    // Update email jika provided
    if (newEmail && newEmail !== user.email) {
      const existingEmail = await prisma.userTeam.findUnique({
        where: { email: newEmail },
      });

      if (existingEmail) {
        res.status(400).json({ error: "Email sudah digunakan" });
        return;
      }

      const otp = generateOtp();
      updateData.email = newEmail;
      updateData.isActive = false; // Non-aktifkan sampai verifikasi OTP
      updateData.otp = otp;
    }

    const updatedUser = await prisma.userTeam.update({
      where: { id: userId },
      data: updateData,
    });

    // Kirim OTP hanya jika update email
    if (newEmail && newEmail !== user.email) {
      await sendOtpEmail({ email: newEmail, otp: updateData.otp });
    }

    res.json({
      message: newEmail
        ? "Email berhasil diubah. Silakan verifikasi email baru"
        : "Profile berhasil diupdate",
      needsVerification: !!newEmail,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(400).json({ error: "Token tidak ditemukan" });
      return;
    }

    // Decode token untuk mendapatkan expiry time
    const decoded = jwt.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000); // Convert to milliseconds

    // MASUKKAN TOKEN KE BLACKLIST
    await blacklistToken(token, expiresAt);

    res.json({
      message: "Logout berhasil",
      logout: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { register, verifyOtp, login, updateProfile, logout };
