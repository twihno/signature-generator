import {
  ClientConfig,
  ClientOrg,
  getServerConfig,
  getTemplates,
} from "@/util/config";

import { ProfileRoles } from "@/util/auth";
import { getFilteredPronouns } from "@/util/pronouns";
import { getToken, JWT } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

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
    pronouns: serverConfig.pronouns ? await getFilteredPronouns() : undefined,
    organizations: {},
  };

  for (const [orgId, org] of Object.entries(serverConfig.organizations)) {
    let orgTemplates = templates[orgId];
    if (!orgTemplates) {
      throw new Error(`no matching template for org ${orgId}`);
    }

    const clientOrg: ClientOrg = {
      templates: orgTemplates,
      name: org.name,
      positions: org.positions,
      maxPositions: org.maxPositions,
      templateFields: org.templateFields,
      genderRequired: org.genderRequired,
      address: org.address,
    };

    if (!org.enforce_access) {
      clientConfig.organizations[orgId] = clientOrg;
      continue;
    }

    if (org.domains !== undefined && domain !== undefined) {
      if (org.domains.includes(domain)) {
        clientConfig.organizations[orgId] = clientOrg;
        continue;
      }
    }

    if (token.roles && org.roles !== undefined) {
      if (
        token.roles.filter((role) => {
          org.roles?.includes(role);
        }).length >= 1
      ) {
        clientConfig.organizations[orgId] = clientOrg;
      }
    }
  }

  return Response.json(clientConfig);
}

export { handler as GET };
