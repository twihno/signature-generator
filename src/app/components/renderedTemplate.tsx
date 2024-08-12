import DOMPurify from "dompurify";
import { useId, useState } from "react";
import { GrammaticalGender, Position } from "../../util/config";

export type TemplateConfig = {
  name?: string;
  positions?: number[];
  maxPositions: number;
  address?: string;
  email?: string;
  phone?: string;
  pronouns?: string;
};

export function HtmlTemplate(props: {
  template: string;
  config: TemplateConfig;
  language: string;
  positionList: Position[];
  preferredGender: GrammaticalGender;
}) {
  const id = useId();
  return (
    <div>
      <div
        id={id}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            fillTemplate(
              props.template,
              props.config,
              props.language,
              props.positionList,
              props.preferredGender
            )
          ),
        }}
      ></div>
      <CopyButton
        onClick={() => {
          const signature = document.getElementById(id)?.outerHTML || "";
          console.log(signature);
          navigator.clipboard.write([
            new ClipboardItem({
              ["text/html"]: new Blob([signature], { type: "text/html" }),
            }),
          ]);
        }}
      />
    </div>
  );
}

export function TextTemplate(props: {
  template: string;
  config: TemplateConfig;
  language: string;
  positionList: Position[];
  preferredGender: GrammaticalGender;
}) {
  const signature = fillTemplate(
    props.template,
    props.config,
    props.language,
    props.positionList,
    props.preferredGender
  );

  return (
    <div>
      <textarea value={signature} disabled />
      <CopyButton
        onClick={() => {
          navigator.clipboard.writeText(signature);
        }}
      />
    </div>
  );
}

export function CopyButton(props: { onClick: () => void }) {
  const [timeoutHandle, setTimeoutHandle] = useState<
    NodeJS.Timeout | undefined
  >(undefined);
  const [label, setLabel] = useState<string>("Copy");

  return (
    <button
      onClick={() => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        setLabel("Copied");
        setTimeoutHandle(
          setTimeout(() => {
            setLabel("Copy");
          }, 1000)
        );

        props.onClick();
      }}
    >
      {label}
    </button>
  );
}

function fillTemplate(
  template: string,
  config: TemplateConfig,
  language: string,
  positionList: Position[],
  preferredGender: GrammaticalGender
) {
  let content = template;

  if (config.name !== undefined) {
    content = content.replace("{{name}}", config.name);
  }
  if (config.positions !== undefined) {
    const convertedPositions = config.positions.map((id) => {
      return convertPositionToText(positionList[id], language, preferredGender);
    });

    content = content.replace(
      "{{all_positions}}",
      convertedPositions.join("\n")
    );

    let maxPositionsReplacements = Math.min(
      config.maxPositions,
      convertedPositions.length
    );
    for (let i = 0; i < maxPositionsReplacements; i++) {
      content = content.replace("{{position}}", convertedPositions[i]);
    }
  }
  if (config.email !== undefined) {
    content = content.replace("{{email}}", config.email);
  }
  if (config.address !== undefined) {
    content = content.replace("{{address}}", config.address);
  }
  if (config.pronouns !== undefined) {
    content = content.replace("{{pronouns}}", config.pronouns);
  }
  if (config.phone !== undefined) {
    content = content.replace("{{phone}}", config.phone);
  }

  // Remove all unfilled fields
  content = content.replaceAll("{{name}}", "");
  content = content.replaceAll("{{all_positions}}", "");
  content = content.replaceAll("{{position}}", "");
  content = content.replaceAll("{{address}}", "");
  content = content.replaceAll("{{pronouns}}", "");
  content = content.replaceAll("{{phone}}", "");
  // Remove double linebreaks
  // content = content.replaceAll("\n\n", "\n");

  return content;
}

export function convertPositionToText(
  position: Position,
  language: string,
  preferredGender: GrammaticalGender
) {
  const translatedPosition = position[language];
  if (translatedPosition.neutral !== undefined) {
    return translatedPosition.neutral;
  }

  if (translatedPosition[preferredGender] !== undefined) {
    return translatedPosition[preferredGender];
  }

  if (translatedPosition.male !== undefined) {
    return translatedPosition.male;
  }

  if (translatedPosition.female !== undefined) {
    return translatedPosition.female;
  }

  return "";
}
