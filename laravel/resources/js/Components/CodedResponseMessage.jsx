import CodeSnippet from "@/Components/CodeSnippet";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Fragment } from "react";

export default function CodeResponseMessage({ content }) {
  const codeSnippetStyle = {
    margin: "0",
    padding: "10px",
    overflow: "auto",
    borderRadius: "0 0 .5rem .5rem",
  };

  const message = JSON.parse(content);
  return (
    <div>
      {message.map((item, key) => (
        <Fragment key={key}>
          {typeof item !== "string" ? (
            <CodeSnippet
              value={item}
              codeStyle={oneLight}
              customCodeStyle={codeSnippetStyle}
            />
          ) : (
            <pre className="whitespace-pre-wrap" key={key}>
              {item}
            </pre>
          )}
        </Fragment>
      ))}
    </div>
  );
}
