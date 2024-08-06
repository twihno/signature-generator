import { getServerConfig } from "@/util/config";

export type PronounList = {
  parts: number;
  subject: string[];
  object: string[];
};

export type LocalisedPronounList = {
  [lang: string]: PronounList;
};

export const PRONOUNS: LocalisedPronounList = {
  en: {
    parts: 2,
    subject: ["he", "she", "they"],
    object: ["him", "her", "them"],
  },
  de: {
    parts: 2,
    subject: ["er", "sie", "es"],
    object: ["ihn", "sie", "es"],
  },
  fr: {
    parts: 2,
    subject: ["il", "elle", "ils"],
    object: ["lui", "elle", "eux"],
  },
};

let filteredPronouons: LocalisedPronounList | undefined = undefined;

export async function getFilteredPronouns(): Promise<LocalisedPronounList> {
  if (filteredPronouons !== undefined) {
    return filteredPronouons;
  }

  let tmpFilteredPronouns: LocalisedPronounList = {};

  const serverConfig = await getServerConfig();

  for (const lang of serverConfig.languages) {
    if (PRONOUNS[lang] !== undefined) {
      tmpFilteredPronouns[lang] = PRONOUNS[lang];
    } else {
      throw new Error(
        `pronouns for language "${lang}" not implemented. Please deactivate this function or create a pull request`,
      );
    }
  }

  filteredPronouons = tmpFilteredPronouns;
  return tmpFilteredPronouns;
}
