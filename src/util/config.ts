import { GeneratedPronounList } from "@/util/pronouns";
import * as fsSync from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";

export type AvailableTemplateFields = {
  name?: boolean;
  positions?: boolean;
  address?: boolean;
  email?: boolean;
  phone?: boolean;
  pronouns?: boolean;
};

export type LanguageConfig = { [code: string]: string };

export type GrammaticalGender = "male" | "female" | "neutral";

export type RawServerConfig = {
  languages: LanguageConfig;
  pronouns: boolean;
  organizations: {
    [id: string]: {
      name: string;
      domains?: string[];
      roles?: string[];
      enforce_access?: boolean;
      address?: string;
      positions: Position[];
      maxPositions?: number;
      templateFields?: Partial<AvailableTemplateFields>;
      html: boolean;
      txt: boolean;
    };
  };
};

export type ValidOrg = {
  [id: string]: {
    name: string;
    domains?: string[];
    roles?: string[];
    enforce_access?: boolean;
    address?: string;
    positions: Position[];
    genderRequired: boolean;
    maxPositions: number;
    templateFields: AvailableTemplateFields;
    html: boolean;
    txt: boolean;
  };
};

export type ServerConfig = {
  languages: LanguageConfig;
  pronouns: boolean;
  organizations: ValidOrg;
};

export type Position = {
  [lang: string]: {
    neutral?: string;
    female?: string;
    male?: string;
  };
};

export type ClientOrg = {
  name: string;
  address?: string;
  positions: Position[];
  genderRequired: boolean;
  maxPositions: number;
  templateFields: AvailableTemplateFields;
  templates: LocalizedTemplateList;
};

export type ClientConfig = {
  languages: LanguageConfig;
  pronouns?: GeneratedPronounList;
  organizations: {
    [id: string]: ClientOrg;
  };
};

export type LocalizedTemplateList = {
  [lang: string]: TemplateList;
};

export type TemplateList = {
  html: string | undefined;
  txt: string | undefined;
};

let serverConfigOnDisk: ServerConfig | undefined = undefined;

export async function getServerConfig(): Promise<ServerConfig> {
  if (serverConfigOnDisk !== undefined) {
    return serverConfigOnDisk;
  }

  const configPath = process.env.CONFIG_FILE;
  if (!configPath) {
    console.error("No config path provided");
    throw new Error("No config path provided");
  }

  try {
    if (!fsSync.existsSync(configPath)) {
      throw new Error("Server config.json doesn't exist at the given path");
    }

    const configFile = await fs.readFile(configPath, "utf-8");
    let loadedConfig = JSON.parse(configFile);
    if (!validateConfig(loadedConfig)) {
      throw new Error("Invalid server config");
    }
    loadedConfig = prepareConfig(loadedConfig);
    serverConfigOnDisk = loadedConfig;
    return loadedConfig;
  } catch (error) {
    console.error("Error loading server config:", error);
    throw error;
  }
}

function prepareConfig(rawConfig: RawServerConfig): ServerConfig {
  // Default values for new converted config
  const config: ServerConfig = {
    pronouns: rawConfig.pronouns,
    languages: rawConfig.languages,
    organizations: {},
  };

  // Fix stuff for every org
  for (const [key, org] of Object.entries(rawConfig.organizations)) {
    // Set/clip max position count
    let maxPositions =
      org.maxPositions === undefined || org.maxPositions < 0
        ? 0
        : org.maxPositions;

    // Detect if gender selection is required
    let genderRequired = false;
    loopGenderRequired: for (const position of org.positions) {
      for (const translatedPosition of Object.values(position)) {
        if (
          translatedPosition.female !== undefined ||
          translatedPosition.male !== undefined
        ) {
          genderRequired = true;
          break loopGenderRequired;
        }
      }
    }

    // Fix template fields
    let templateFields: AvailableTemplateFields = {
      name: false,
      address: false,
      email: false,
      phone: false,
      positions: false,
      pronouns: false,
    };
    if (org.templateFields !== undefined) {
      for (const key of Object.keys(
        templateFields
      ) as (keyof AvailableTemplateFields)[]) {
        if (org.templateFields[key] !== undefined) {
          templateFields[key] = org.templateFields[key];
        }
      }
    }

    config.organizations[key] = {
      ...org,
      address: org.address !== undefined ? org.address : "",
      templateFields,
      genderRequired,
      maxPositions,
    };
  }

  return config;
}

function validateConfig(serverConfig: ServerConfig): boolean {
  if (Object.keys(serverConfig.organizations).length <= 0) {
    console.error("Empty organizations object");
    return false;
  }

  return true;
}

export type CompleteTemplateList = {
  [organization: string]: LocalizedTemplateList;
};

let templatesOnDisk: CompleteTemplateList | undefined = undefined;

export async function getTemplates(): Promise<CompleteTemplateList> {
  if (templatesOnDisk !== undefined) {
    return templatesOnDisk;
  }

  const serverConfig = await getServerConfig();

  const rootDir = process.env.TEMPLATE_DIR;
  if (!rootDir) {
    console.error("No template path provided");
    throw new Error("No template path provided");
  }

  let newTemplates: CompleteTemplateList = {};

  try {
    for (const [orgId, org] of Object.entries(serverConfig.organizations)) {
      newTemplates[orgId] = {};
      for (const lang in serverConfig.languages) {
        let tmpTemplates: TemplateList = {
          html: undefined,
          txt: undefined,
        };

        let txtPath = path.join(rootDir, `${orgId}-${lang}.txt`);
        if (org.txt) {
          if (fsSync.existsSync(txtPath)) {
            try {
              tmpTemplates.txt = await fs.readFile(txtPath, "utf-8");
            } catch (error) {
              throw error;
            }
          } else {
            throw new Error(
              `txt template for "${orgId}" in language "${lang}" was marked as available but corresponding file doesn't exist`
            );
          }
        }

        let htmlPath = path.join(rootDir, `${orgId}-${lang}.html`);
        if (org.html) {
          if (fsSync.existsSync(htmlPath)) {
            try {
              tmpTemplates.html = await fs.readFile(htmlPath, "utf-8");
            } catch (error) {
              throw error;
            }
          } else {
            throw new Error(
              `html template for "${orgId}" in language "${lang}" was marked as available but corresponding file doesn't exist`
            );
          }
        }

        newTemplates[orgId][lang] = tmpTemplates;
      }
    }
  } catch (error) {
    console.error("Error reading templates:", error);
    throw error;
  }

  templatesOnDisk = newTemplates;
  return newTemplates;
}
