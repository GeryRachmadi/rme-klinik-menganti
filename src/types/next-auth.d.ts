import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "ADMIN" | "PENDAFTARAN" | "PERAWAT" | "DOKTER";
  }
}