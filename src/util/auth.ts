import { Profile } from "next-auth";
import { JWT } from "next-auth/jwt";
import AzureAD from "next-auth/providers/azure-ad";

export type ProfileRoles = { roles: string[] };

export const authOptions = {
  providers: [
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      profile,
    }: {
      token: JWT;
      profile: Profile & { roles: string[] | undefined };
    }) {
      // If "roles" are provided in oidc callback, add them to the local jwt
      if (profile) {
        token.roles = profile.roles ? profile.roles : [];
      }
      return token;
    },
    // async session({
    //   session,
    //   token,
    // }: {
    //   session: Session & ProfileRoles;
    //   token: JWT & ProfileRoles;
    // }) {
    //   // Provide access to roles in session
    //   session.roles = token.roles;
    //
    //   return session;
    // },
  },
  session: {
    // Seconds - How long until an idle session expires and is no longer valid.
    // maxAge: 3 * 60, // 3 minutes
  },
};
