import { authOptions, ProfileRoles } from "@/util/auth";
import { getServerSession as getServerSessionNative } from "next-auth";
import { Session } from "next-auth";

export async function getServerSession(): Promise<Session | null> {
  // @ts-ignore
  return await getServerSessionNative(authOptions);
}
