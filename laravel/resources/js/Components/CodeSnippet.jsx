import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function CodeSnippet({ codeStyle, customCodeStyle, value }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const textTemp = document.createElement("textarea");
    textTemp.name = value.code;
    textTemp.value = value.code;
    document.body.appendChild(textTemp);
    textTemp.select();
    document.execCommand("copy");
    document.body.removeChild(textTemp);
    setCopied(true);
  };
  return (
    <div>
      {value && (
        <div>
          <div className="flex items-center relative text-white bg-gray-500 px-3 py-2 text-xs font-sans justify-between rounded-t-md">
            <span>{value.language}</span>
            <button className="flex ml-auto gap-1" onClick={copyCode}>
              <div className="flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                <span>{copied ? "Copied!" : "Copy code"}</span>
              </div>
            </button>
          </div>
          <SyntaxHighlighter
            language={value.language}
            style={codeStyle}
            customStyle={customCodeStyle}
          >
            {value.code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
