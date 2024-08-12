import { getServerConfig } from "@/util/config";

type PronounList = {
  parts: number;
  subject: string[];
  object: string[];
};

type LocalizedPronounList = {
  [lang: string]: PronounList;
};

const PRONOUNS: LocalizedPronounList = {
  en: {
    parts: 2,
    subject: ["he", "she", "they"],
    object: ["him", "her", "them"],
  },
  de: {
    parts: 2,
    subject: ["er", "sie", "es"],
    object: ["ihm", "ihr", "sein"],
  },
  fr: {
    parts: 2,
    subject: ["il", "elle", "ils"],
    object: ["lui", "elle", "eux"],
  },
};

export type GeneratedPronounList = {
  [lang: string]: string[];
};

export const GENERATED_PRONOUNS = (() => {
  let list: GeneratedPronounList = {};
  for (const lang in PRONOUNS) {
    list[lang] = getPronounStringOptions(PRONOUNS, lang);
  }
  return list;
})();

let filteredPronouons: GeneratedPronounList | undefined = undefined;

export async function getFilteredPronouns(): Promise<GeneratedPronounList> {
  if (filteredPronouons !== undefined) {
    return filteredPronouons;
  }

  let tmpFilteredPronouns: GeneratedPronounList = {};

  const serverConfig = await getServerConfig();

  for (const lang in serverConfig.languages) {
    if (GENERATED_PRONOUNS[lang] !== undefined) {
      tmpFilteredPronouns[lang] = GENERATED_PRONOUNS[lang];
    } else {
      throw new Error(
        `pronouns for language "${lang}" not implemented. Please deactivate this function or create a pull request`
      );
    }
  }

  filteredPronouons = tmpFilteredPronouns;
  return tmpFilteredPronouns;
}

function getPronounStringOptions(
  pronouns: LocalizedPronounList,
  language: string
): string[] {
  const localPronouns = pronouns[language];
  if (localPronouns === undefined) {
    throw Error("unknown language");
  }

  if (localPronouns.parts !== 2) {
    return localPronouns.subject;
  }

  let pronounList: string[] = [];

  for (const subject of localPronouns.subject) {
    for (const object of localPronouns.object) {
      pronounList.push(`${subject}/${object}`);
    }
  }

  return pronounList;
}
