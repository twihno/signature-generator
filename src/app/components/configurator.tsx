"use client";

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { ClientConfig, GrammaticalGender, Position } from "../../util/config";

import styles from "./configurator.module.css";
import { Add_24dp } from "./icons/material/add_24dp";
import { Delete_24dp } from "./icons/material/delete_24dp";
import {
  convertPositionToText,
  HtmlTemplate,
  TemplateConfig,
  TextTemplate,
} from "./renderedTemplate";

function TextConfigLine(props: {
  label: string;
  value: string;
  setValue: (arg0: string) => void;
  textArea?: boolean;
  inputMode?:
    | "none"
    | "search"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal";
  modified?: boolean;
  onReset?: () => void;
}) {
  const ref = useId();

  return (
    <div className={styles["input-wrapper"]}>
      <label className={styles["label-big"]} htmlFor={ref}>
        {props.label}
      </label>
      <div className={styles["input-line"]}>
        {props.textArea === true ? (
          <textarea
            value={props.value}
            onChange={(event) => props.setValue(event.target.value)}
            className={styles["input"]}
          />
        ) : (
          <input
            type="text"
            value={props.value}
            onChange={(event) => props.setValue(event.target.value)}
            inputMode={props.inputMode}
            className={styles["input"]}
            autoComplete="off"
          />
        )}
        {props.onReset && props.modified ? (
          <button className={styles["delete-button"]} onClick={props.onReset}>
            <Delete_24dp />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CheckboxLine(props: {
  label?: string;
  value: boolean;
  onClick?: () => void;
}) {
  const id = useId();
  return (
    <div className={styles["checkbox-line"]}>
      {props.label ? (
        <label className={styles["label-big"]} htmlFor={id}>
          {props.label}
        </label>
      ) : null}
      <input
        id={id}
        type="checkbox"
        checked={props.value}
        onChange={props.onClick}
      />
    </div>
  );
}

function SelectorLine(props: {
  label?: string;
  values: { value: string; displayValue: string }[];
  setCurrentValue: (id: string) => void;
  currentValue: string;
  onDelete?: () => void;
}) {
  const id = useId();

  let options = props.values.map((entry) => (
    <option key={entry.value} value={entry.value}>
      {entry.displayValue}
    </option>
  ));

  return (
    <div className={styles["input-wrapper"]}>
      {props.label ? (
        <label className={styles["label-big"]} htmlFor={id}>
          {props.label}
        </label>
      ) : null}
      <div className={styles["input-line"]}>
        <select
          value={props.currentValue}
          onChange={(event) => props.setCurrentValue(event.target.value)}
          id={id}
          className={styles["input"]}
        >
          {options}
        </select>
        {props.onDelete !== undefined ? (
          <button className={styles["delete-button"]} onClick={props.onDelete}>
            <Delete_24dp />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PositionSelector(props: {
  positions: number[];
  positionList: Position[];
  maxPositions: number;
  language: string;
  preferredGender: GrammaticalGender;
  setPositions: (positions: number[]) => void;
}) {
  const displayPositionNames = props.positionList.map((position) => {
    return convertPositionToText(
      position,
      props.language,
      props.preferredGender
    );
  });

  let selectValues = displayPositionNames.map((position, index) => {
    return {
      value: index.toString(),
      displayValue: position,
    };
  });

  let selectedPositions = [];
  for (let i = 0; i < props.positions.length; i++) {
    selectedPositions.push(
      <div key={`${displayPositionNames[i]}-i`}>
        <SelectorLine
          values={selectValues}
          currentValue={props.positions[i].toString()}
          setCurrentValue={(value) => {
            const newPositions = [...props.positions];
            newPositions[i] = Number.parseInt(value);
            props.setPositions(newPositions);
            console.log(newPositions);
          }}
          onDelete={() => {
            const newPositions = [...props.positions];
            newPositions.splice(i, 1);
            props.setPositions(newPositions);
          }}
        />
      </div>
    );
  }
  return (
    <div>
      <label className={styles["label-big"]}>Positions</label>
      {selectedPositions}
      {props.maxPositions === 0 ||
      props.positions.length < props.maxPositions ? (
        <button
          onClick={() => {
            props.setPositions(props.positions.concat([0]));
          }}
          className={styles["input"]}
        >
          <Add_24dp />
        </button>
      ) : null}
    </div>
  );
}

function getInitialTemplateValues(
  session: Session,
  config: ClientConfig,
  initialLanguage: string,
  maxPositions: number
): TemplateConfig {
  const initialValues: TemplateConfig = {
    name: undefined,
    positions: [],
    maxPositions: maxPositions,
    address: undefined,
    email: undefined,
    phone: undefined,
    pronouns: undefined,
  };

  if (session.user !== undefined) {
    if (session.user.name) {
      initialValues.name = session.user.name;
    }
    if (session.user.email) {
      initialValues.email = session.user.email;
    }
  }

  if (config.pronouns !== undefined) {
    initialValues.pronouns = config.pronouns[initialLanguage][0];
  }

  return initialValues;
}

function Configurator(props: { session: Session; config: ClientConfig }) {
  const [currentOrgId, setCurrentOrgId] = useState(
    Object.keys(props.config.organizations)[0]
  );
  const currentOrg = props.config.organizations[currentOrgId];

  const [currentLanguage, setCurrentLanguage] = useState<string>(
    Object.keys(props.config.languages)[0]
  );

  const currentTemplates = currentOrg.templates[currentLanguage];

  const [grammaticalGender, setGrammaticalGender] =
    useState<GrammaticalGender>("neutral");

  const [templateValues, setTemplateValues] = useState<TemplateConfig>(
    getInitialTemplateValues(
      props.session,
      props.config,
      currentLanguage,
      currentOrg.maxPositions
    )
  );

  const [plaintext, setPlainText] = useState<boolean>(
    currentTemplates.html === undefined
  );

  const [addressModified, setAddressModified] = useState<boolean>(false);
  const [nameModified, setNameModified] = useState<boolean>(
    !(props.session.user?.name !== undefined)
  );
  const [emailModified, setEmailModified] = useState<boolean>(
    !(props.session.user?.email !== undefined)
  );

  return (
    <div className={styles["wrapper"]}>
      <div className={styles["wrapper-config"]}>
        {/* Language selection */}
        {Object.keys(props.config.languages).length > 1 ? (
          <SelectorLine
            label="Language"
            currentValue={currentLanguage}
            setCurrentValue={(value) => {
              setCurrentLanguage(value);
            }}
            values={Object.entries(props.config.languages).map((lang) => {
              return { value: lang[0], displayValue: lang[1] };
            })}
          />
        ) : null}
        {/* Org selection */}
        {Object.keys(props.config.organizations).length > 1 ? (
          <SelectorLine
            label="Organization"
            currentValue={currentOrgId}
            setCurrentValue={(value) => {
              const newOrg = props.config.organizations[value];

              setCurrentOrgId(value);

              const newTemplateValues = { ...templateValues };
              if (!addressModified) {
                newTemplateValues.address = newOrg.address;
              }

              if (
                newOrg.templates[currentLanguage].html === undefined &&
                !plaintext
              ) {
                setPlainText(true);
              } else if (
                newOrg.templates[currentLanguage].txt === undefined &&
                plaintext
              ) {
                setPlainText(false);
              }

              newTemplateValues.positions = [];

              setTemplateValues(newTemplateValues);
            }}
            values={Object.entries(props.config.organizations).map((org) => {
              return { value: org[0], displayValue: org[1].name };
            })}
          />
        ) : null}
        {/* Pronoun selection */}
        {props.config.pronouns !== undefined &&
        templateValues.pronouns !== undefined &&
        currentOrg.templateFields.pronouns === true ? (
          <SelectorLine
            label="Pronouns"
            currentValue={templateValues.pronouns}
            setCurrentValue={(value) => {
              setTemplateValues({ ...templateValues, pronouns: value });
            }}
            values={props.config.pronouns[currentLanguage].map((value) => {
              return { value, displayValue: value };
            })}
          />
        ) : null}
        {/* Grammatical gender */}
        {currentOrg.genderRequired ? (
          <SelectorLine
            label="Preferred grammatical gender"
            currentValue={grammaticalGender}
            setCurrentValue={(value) => {
              setGrammaticalGender(value as GrammaticalGender);
            }}
            values={[
              { value: "male", displayValue: "male" },
              { value: "female", displayValue: "female" },
            ]}
          />
        ) : null}
        {/* Name */}
        {currentOrg.templateFields.name ? (
          <TextConfigLine
            label="Name"
            value={templateValues.name || ""}
            setValue={(value) => {
              setTemplateValues({ ...templateValues, name: value });
              if (nameModified === false) {
                setNameModified(true);
              }
            }}
            modified={props.session.user?.name !== undefined && nameModified}
            onReset={() => {
              if (props.session.user && props.session.user.name) {
                setNameModified(false);
                setTemplateValues({
                  ...templateValues,
                  name: props.session.user.name,
                });
              }
            }}
          />
        ) : null}
        {/* E-Mail */}
        {currentOrg.templateFields.email ? (
          <TextConfigLine
            label="E-Mail"
            inputMode="email"
            value={templateValues.email || ""}
            setValue={(value) => {
              setTemplateValues({ ...templateValues, email: value });
              if (emailModified === false) {
                setEmailModified(true);
              }
            }}
            modified={props.session.user?.email !== undefined && emailModified}
            onReset={() => {
              if (props.session.user && props.session.user.email) {
                setEmailModified(false);
                setTemplateValues({
                  ...templateValues,
                  email: props.session.user.email,
                });
              }
            }}
          />
        ) : null}
        {/* Phone */}
        {currentOrg.templateFields.phone ? (
          <TextConfigLine
            label="Phone number"
            inputMode="tel"
            value={templateValues.phone || ""}
            setValue={(value) => {
              setTemplateValues({ ...templateValues, phone: value });
            }}
          />
        ) : null}
        {/* Address */}
        {currentOrg.templateFields.address ? (
          <TextConfigLine
            label="Address"
            textArea={true}
            value={templateValues.address || ""}
            setValue={(value) => {
              setTemplateValues({ ...templateValues, address: value });
              if (!addressModified) {
                setAddressModified(true);
              }
            }}
            modified={addressModified}
            onReset={() => {
              setAddressModified(false),
                setTemplateValues({
                  ...templateValues,
                  address: currentOrg.address,
                });
            }}
          />
        ) : null}
        {/* Position */}
        {currentOrg.templateFields.positions !== undefined ? (
          <PositionSelector
            maxPositions={currentOrg.maxPositions}
            positions={templateValues.positions || []}
            positionList={currentOrg.positions}
            setPositions={(values) => {
              console.log("YOLO" + values);
              setTemplateValues({ ...templateValues, positions: values });
            }}
            preferredGender={grammaticalGender}
            language={currentLanguage}
          />
        ) : null}
        {/* Plaintext option */}
        {currentTemplates.txt !== undefined &&
        currentTemplates.html !== undefined ? (
          <CheckboxLine
            label="Plaintext"
            value={plaintext}
            onClick={() => {
              setPlainText(!plaintext);
            }}
          />
        ) : null}
      </div>
      <div className={styles["wrapper-preview"]}>
        {plaintext ? (
          <TextTemplate
            template={currentOrg.templates[currentLanguage].txt!}
            config={templateValues}
            language={currentLanguage}
            preferredGender={grammaticalGender}
            positionList={currentOrg.positions}
          />
        ) : (
          <HtmlTemplate
            template={currentOrg.templates[currentLanguage].html!}
            config={templateValues}
            language={currentLanguage}
            preferredGender={grammaticalGender}
            positionList={currentOrg.positions}
          />
        )}
      </div>
    </div>
  );
}

function ClientWrapper() {
  return (
    <SessionProvider>
      <ConfigWrapper />
    </SessionProvider>
  );
}

function ConfigWrapper() {
  let session = useSession();

  let [error, setError] = useState<string | undefined>(undefined);
  let [clientConfig, setClientConfig] = useState<ClientConfig | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configResponse = await fetch("/api/config");

        if (!configResponse.ok) {
          setError(
            `Error ${configResponse.status} - ${configResponse.statusText}`
          );
          return;
        }

        let config: ClientConfig = await configResponse.json();

        if (Object.keys(config.organizations).length <= 0) {
          setError(`Config on server has no organizations listed`);
          return;
        }

        setClientConfig(config);
      } catch (e) {
        setError(`${e}`);
      }
    };

    fetchConfig();
  }, [error]);

  if (error !== undefined) {
    return (
      <div>
        {error}
        <button
          onClick={() => {
            setError(undefined);
            setClientConfig(undefined);
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  if (
    session !== undefined &&
    session.data !== null &&
    session.data !== undefined &&
    clientConfig !== undefined
  ) {
    return <Configurator session={session.data} config={clientConfig} />;
  }

  return (
    <div className={styles["wrapper-loader"]}>
      <span className={styles["loader"]}></span>
    </div>
  );
}

export { ClientWrapper as Configurator };
