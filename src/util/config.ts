import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import { LocalisedPronounList, PRONOUNS } from "@/util/pronouns";
import path from "node:path";

export type ServerConfig = {
  languages: string[];
  pronouns: boolean;
  organisations: {
    [id: string]: {
      name: string;
      domains: string[] | undefined;
      roles: string[] | undefined;
      enforce_access: boolean | undefined;
      positions: {
        [lang: string]: {
          neutral: string | undefined;
          female: string | undefined;
          male: string | undefined;
        };
      }[];
      html: boolean;
      txt: boolean;
    };
  };
};

export type ClientConfig = {
  languages: string[];
  pronouns: LocalisedPronounList | null;
  organisations: {
    [id: string]: {
      name: string;
      positions: {
        [lang: string]: {
          neutral: string | undefined;
          female: string | undefined;
          male: string | undefined;
        };
      }[];
      templates: LocalisedTemplateList;
    };
  };
};

export type LocalisedTemplateList = {
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
    const loadedConfig = JSON.parse(configFile);
    if (!validateConfig(loadedConfig)) {
      throw new Error("Invalid server config");
    }
    serverConfigOnDisk = loadedConfig;
    return loadedConfig;
  } catch (error) {
    console.error("Error loading server config:", error);
    throw error;
  }
}

function validateConfig(serverConfig: ServerConfig): boolean {
  if (Object.keys(serverConfig.organisations).length <= 0) {
    console.error("Empty organisations object");
    return false;
  }

  return true;
}

export type CompleteTemplateList = {
  [organisation: string]: LocalisedTemplateList;
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
    for (const [orgId, org] of Object.entries(serverConfig.organisations)) {
      newTemplates[orgId] = {};
      for (const lang of serverConfig.languages) {
        let tmpTemplates: TemplateList = {
          html: undefined,
          txt: undefined,
        };

        let txtPath = path.join(rootDir, `${orgId}-${lang}.txt`);
        console.log(txtPath);
        if (org.txt) {
          if (fsSync.existsSync(txtPath)) {
            try {
              tmpTemplates.txt = await fs.readFile(txtPath, "utf-8");
            } catch (error) {
              throw error;
            }
          } else {
            throw new Error(
              `txt template for "${orgId}" in language "${lang}" was marked as available but corresponding file doesn't exist`,
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
              `html template for "${orgId}" in language "${lang}" was marked as available but corresponding file doesn't exist`,
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
