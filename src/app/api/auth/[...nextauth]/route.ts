import NextAuth from "next-auth";
import { authOptions } from "@/util/auth";

// @ts-ignore
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
