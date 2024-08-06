import { ClientConfig, getServerConfig, getTemplates } from "@/util/config";

import { NextRequest, NextResponse } from "next/server";
import { getToken, JWT } from "next-auth/jwt";
import { getFilteredPronouns, PRONOUNS } from "@/util/pronouns";
import { ProfileRoles } from "@/util/auth";

async function handler(req: NextRequest) {
  // @ts-ignore
  const token: (JWT & ProfileRoles) | null = await getToken({ req });

  if (!token) {
    return new NextResponse("", {
      status: 403,
    });
  }
  const serverConfig = await getServerConfig();
  const templates = await getTemplates();

  const domain = token.email?.split("@")[1];

  const clientConfig: ClientConfig = {
    languages: serverConfig.languages,
    pronouns: serverConfig.pronouns ? await getFilteredPronouns() : null,
    organisations: {},
  };

  for (const [orgId, org] of Object.entries(serverConfig.organisations)) {
    let orgTemplates = templates[orgId];
    if (!orgTemplates) {
      throw new Error(`no matching template for org ${orgId}`);
    }

    const clientOrg = {
      name: org.name,
      positions: org.positions,
      templates: orgTemplates,
    };

    if (!org.enforce_access) {
      clientConfig.organisations[orgId] = clientOrg;
      continue;
    }

    if (org.domains !== undefined && domain !== undefined) {
      if (org.domains.includes(domain)) {
        clientConfig.organisations[orgId] = clientOrg;
        continue;
      }
    }

    if (token.roles && org.roles !== undefined) {
      if (
        token.roles.filter((role) => {
          org.roles?.includes(role);
        }).length >= 1
      ) {
        clientConfig.organisations[orgId] = clientOrg;
      }
    }
  }

  return Response.json(clientConfig);
}

export { handler as GET };
