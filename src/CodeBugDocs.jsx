import CodeCard from "./components/CodeCard";

function CodeBugDocs() {
  const ExamplesCodes = [
    {
      title: "Funciones",
      content: [
        {
          subtitle: "Funcion con retorno (opcion 1)",
          code: `fc Suma ( param1, param2 ) int {\n\treturn\n}`,
        },
        {
          subtitle: "Funcion con retorno (opcion 2)",
          code: `fc Suma ( param1, param2) int {\n\treturn 20\n}`,
        },
      ],
    },
    {
      title: "Declaracion variables",
      content: [
        {
          subtitle: "",
          code: `variable:20`,
        },
      ],
    },
    {
      title: "Declaracion del ciclo For",
      content: [
        {
          subtitle: "",
          code: `for i; j; 1++ {\n\treturn 20\n}`,
        },
      ],
    },
    {
      title: "Declaración de estructuras de control",
      content: [
        {
          subtitle: "Metodo unico",
          code: `if ( x>10 ) {\n\treturn 20\n}`,
        },
      ],
    },
  ];

  return (
    <>
      <div>
        <div>
          {ExamplesCodes.map((example, index) => {
            return (
              <CodeCard
                key={index}
                title={example.title}
                content={example.content}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default CodeBugDocs;
