import React from "react";
import CodeSnippets from "./CodeSnippets";

function CodeExamples(props) {
  return (
    <div>
      <h2>{props.title}</h2>
      {props.content.map((example, index) => (
        <div key={index}>
          <h3>{example.subtitle}</h3>
          <CodeSnippets code={example.code} />
        </div>
      ))}
    </div>
  );
}

export default CodeExamples;
