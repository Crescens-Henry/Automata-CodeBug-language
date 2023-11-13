import React, { useState } from "react";
import Monaco from "@monaco-editor/react";

function CodeValidator() {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);
  const [esValido, setEsValido] = useState(false);

  function validarCodigo() {
    try {
      // Paso 1: Analizador léxico (tokenización)
      const tokens = analizarCodigo(codigo);

      // Paso 2: Verificar la existencia de paréntesis y llaves
      if (!validarParentesisYLlaves(codigo)) {
        setError("Error de sintaxis: Falta algún paréntesis o llave.");
        setEsValido(false);
        return;
      }
      // Paso 2.1: Verificar la presencia de dos puntos en el bucle "for"
      if (!validarDosPuntosEnFor(codigo)) {
        setError(
          "Error de sintaxis: Falta el segundo punto y coma en el bucle 'for'."
        );
        setEsValido(false);
        return;
      }

      // Paso 3: Analizador sintáctico (construcción del AST)
      const ast = construirAST(tokens);

      // Paso 4: Validación del AST
      const esValido = validarAST(ast);

      // Paso 5: Validación de llaves
      const llavesValidas = validarLlaves(codigo);

      if (esValido && llavesValidas) {
        setError(null);
        setEsValido(true);
      } else {
        setError(
          "Error de sintaxis: El código no cumple con las reglas gramaticales o tiene problemas con las llaves."
        );
        setEsValido(false);
      }
    } catch (e) {
      console.log("Error inesperado: " + e.message);
    }
  }

  function validarLlaves(codigo) {
    const pilaLlaves = [];

    for (let i = 0; i < codigo.length; i++) {
      const caracter = codigo[i];

      if (caracter === "{") {
        pilaLlaves.push("{");
      } else if (caracter === "}") {
        if (pilaLlaves.length === 0) {
          // Se encontró una llave de cierre sin su correspondiente llave de apertura
          return false;
        }
        pilaLlaves.pop(); // Se encontró una llave de cierre correspondiente
      }
    }

    return pilaLlaves.length === 0; // Si la pila está vacía, todas las llaves tienen su correspondiente
  }

  function validarParentesisYLlaves(codigo) {
    const pilaParentesis = [];
    const pilaLlaves = [];

    for (let i = 0; i < codigo.length; i++) {
      const caracter = codigo[i];

      if (caracter === "(") {
        pilaParentesis.push("(");
      } else if (caracter === ")") {
        if (pilaParentesis.length === 0) {
          return false; // Se encontró un paréntesis de cierre sin su correspondiente paréntesis de apertura
        }
        pilaParentesis.pop(); // Se encontró un paréntesis de cierre correspondiente
      } else if (caracter === "{") {
        pilaLlaves.push("{");
      } else if (caracter === "}") {
        if (pilaLlaves.length === 0) {
          return false; // Se encontró una llave de cierre sin su correspondiente llave de apertura
        }
        pilaLlaves.pop(); // Se encontró una llave de cierre correspondiente
      }
    }

    return pilaParentesis.length === 0 && pilaLlaves.length === 0;
  }

  function handleValidarClick() {
    validarCodigo();
  }

  function analizarCodigo(codigo) {
    const tokens = [];
    const palabrasReservadas = ["fc", "for", "if"];
    const operadoresComparacion = ["==", "!=", "<", ">", "<=", ">="];
    let nivelAnidacion = 0;
    const pilaBloques = [];

    codigo = codigo.replace(/\s+/g, " ").trim();

    const lineas = codigo.split("\n");

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      // Asegurarse de que 'linea' no sea undefined

      if (!linea || linea.trim() === "") {
        continue; // Ignorar líneas en blanco o undefined
      }

      const palabras = linea.trim().split(/\s+/); // Dividir la línea en palabras
      let esDeclaracion = false;
      for (const palabra of palabras) {
        // Declaración de variable: <nombre de variable>:<valor>
        if (palabra.includes(":")) {
          const [nombre, valor] = palabra.split(":");

          // Verificar que el nombre y el valor no estén vacíos
          if (nombre.trim() !== "" && valor.trim() !== "") {
            tokens.push({
              tipo: "DeclaracionVariable",
              nombre,
              valor,
              nivelAnidacion,
            });
            esDeclaracion = true;
          } else {
            // Manejar el caso en que nombre o valor estén vacíos
            console.log("Error: El nombre o valor de la variable está vacío");
          }
        } else if (palabra === "return") {
          const valor = palabras[palabras.indexOf(palabra) + 1];
          tokens.push({
            tipo: "DeclaracionReturn",
            valor,
          });
          esDeclaracion = true;
        }

        // Declaración de función: fc <nombre de funcion> (<parametros>) <tipo de valor a retornar> { return valor }
        else if (palabra === "fc") {
          const nombreFuncion = palabras[palabras.indexOf(palabra) + 1];
          const parametrosIndex = linea.indexOf("(");
          const tipoRetorno = palabras[palabras.indexOf(")") + 1];
          const contenido = [];
          const parametros = linea
            .substring(parametrosIndex + 1, linea.indexOf(")"))
            .split(",")
            .map((param) => param.trim());

          tokens.push({
            tipo: "DeclaracionFuncion",
            nombreFuncion,
            parametros,
            tipoRetorno,
            contenido,
            nivelAnidacion,
          });
          esDeclaracion = true;

          pilaBloques.push({
            tipo: "DeclaracionFuncion",
            nivel: nivelAnidacion,
          });
          nivelAnidacion++;
          i++; // Avanzar a la siguiente línea para procesar el contenido
          while (i < lineas.length) {
            const lineaContenido = lineas[i].trim();
            if (lineaContenido === "}") {
              nivelAnidacion--;
              break; // Se encontró el cierre de la función
            }
            if (lineaContenido !== "") {
              contenido.push(lineaContenido);
            }
            i++;
          }
          i--; // Retroceder una línea para evitar saltar una línea
        }
        // Estructura "for": for <inicializacion>; <condicion>; <incremento> { contenido }
        else if (palabra === "for") {
          // Utilizar una expresión regular para dividir la línea del bucle "for"
          const regexFor = /for\s*(.*?);(.*?);(.*?)\s*{/;
          const match = linea.match(regexFor);

          if (match) {
            const inicializacion = match[1].trim();
            const condicion = match[2].trim();
            const incremento = match[3].trim();

            const bucleForPartes = linea.split(";");

            // Corregir la parte del incremento para excluir las llaves
            const incrementoSinLlaves = incremento.replace(/{|}/g, "").trim();

            tokens.push({
              tipo: "BucleFor",
              inicializacion,
              condicion,
              incremento: incrementoSinLlaves, // Usar la versión corregida del incremento
              contenido: [], // Agregar un array para almacenar el contenido del bucle
              nivelAnidacion,
            });
            esDeclaracion = true;
            pilaBloques.push({ tipo: "BucleFor", nivel: nivelAnidacion });
            nivelAnidacion++;
            i++; // Avanzar a la siguiente línea para procesar el contenido
            while (i < lineas.length) {
              const lineaContenido = lineas[i].trim();
              if (lineaContenido === "}") {
                nivelAnidacion--;
                break; // Se encontró el cierre del bucle "for"
              }
              if (lineaContenido !== "") {
                // Almacenar las líneas de contenido en el array correspondiente
                tokens[tokens.length - 1].contenido.push(lineaContenido);
              }
              i++;
            }
            i--; // Retroceder una línea para evitar saltar una línea
          } else {
            console.log("Error al analizar la línea del bucle 'for'");
          }
        }

        // Estructura "if": if (<condicion>) { contenido }
        else if (palabra === "if") {
          // Buscar el índice del paréntesis de apertura
          const aperturaParentesisIndex = palabras.findIndex((word) =>
            word.includes("(")
          );
          // Buscar el índice del paréntesis de cierre
          const cierreParentesisIndex = palabras.findIndex((word) =>
            word.includes(")")
          );

          // Verificar que existan los paréntesis de apertura y las llaves
          if (aperturaParentesisIndex !== -1 && cierreParentesisIndex !== -1) {
            // Obtener la condición entre los paréntesis
            const condicion = palabras
              .slice(aperturaParentesisIndex + 1, cierreParentesisIndex)
              .join(" ");
            const contenido = [];
            const estructuraIf = {
              tipo: "EstructuraIf",
              condicion,
              contenido,
              nivelAnidacion,
            };
            tokens.push(estructuraIf);
            esDeclaracion = true;
            pilaBloques.push({
              tipo: "EstructuraIf",
              nivel: nivelAnidacion,
              estructuraIf,
            });
            nivelAnidacion++;
            i++; // Avanzar a la siguiente línea para procesar el contenido
            while (i < lineas.length) {
              const lineaContenido = lineas[i].trim();
              if (lineaContenido === "}") {
                nivelAnidacion--;
                break; // Se encontró el cierre de la estructura "if"
              }
              if (lineaContenido !== "") {
                contenido.push(lineaContenido);
              }
              i++;
            }
            i--; // Retroceder una línea para evitar saltar una línea
          }
        }
      }

      if (!esDeclaracion) {
        // Si no es una declaración, puede ser una línea de código o error
        // Aquí puedes agregar más lógica para identificar y manejar errores
        tokens.push({
          tipo: "LineaDeCodigo",
          contenido: linea,
          nivelAnidacion,
        });
      }
    }
    return tokens;
  }

  // Función para construir el árbol sintáctico abstracto (AST) a partir de los tokens
  function construirAST(tokens) {
    const ast = [];
    const pila = [ast]; // Inicializar la pila con el AST principal
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.tipo === "DeclaracionVariable") {
        // Construir un nodo para la declaración de variable en el AST
        const nodoDeclaracion = {
          tipo: "DeclaracionVariable",
          nombre: token.nombre,
          valor: token.valor,
        };
        pila[pila.length - 1].push(nodoDeclaracion);
      } else if (token.tipo === "DeclaracionFuncion") {
        // Construir un nodo para la declaración de función en el AST
        const nodoFuncion = {
          tipo: "DeclaracionFuncion",
          nombreFuncion: token.nombreFuncion,
          parametros: token.parametros,
          tipoRetorno: token.tipoRetorno,
          contenido: [],
        };
        pila[pila.length - 1].push(nodoFuncion);
        pila.push(nodoFuncion.contenido);
      } else if (token.tipo === "BucleFor") {
        // Construir un nodo para el bucle "for" en el AST
        const nodoFor = {
          tipo: "BucleFor",
          inicializacion: token.inicializacion,
          condicion: token.condicion,
          incremento: token.incremento,
        };
        pila[pila.length - 1].push(nodoFor);
        pila.push(nodoFor.contenido);
      } else if (token.tipo === "EstructuraIf") {
        // Construir un nodo para la estructura "if" en el AST
        const nodoIf = {
          tipo: "EstructuraIf",
          condicion: token.condicion,
          contenido: [],
        };
        pila[pila.length - 1].push(nodoIf);
        pila.push(nodoIf.contenido);
      } else if (token.tipo === "LineaDeCodigo") {
        // Puede ser una línea de código, aquí puedes manejarla según tus necesidades
        // Por ejemplo, agregarlas al bloque actual en la pila
        pila[pila.length - 1].push({
          tipo: "LineaDeCodigo",
          contenido: token.contenido,
        });
      } else if (token.tipo == "DeclaracionReturn") {
        const nodoReturn = {
          tipo: "DeclaracionReturn",
          valor: token.valor,
        };
        pila[pila.length - 1].push(nodoReturn);
      }
    }
    console.log(ast);

    return ast;
  }
  // Función para validar el AST según las reglas gramaticales del lenguaje
  function validarAST(ast) {
    for (const nodo of ast) {
      if (nodo.tipo === "DeclaracionVariable") {
        // Validar la declaración de variable
        if (!validarDeclaracionVariable(nodo)) {
          return false; // La declaración de variable es inválida
        }
      } else if (nodo.tipo === "DeclaracionFuncion") {
        // Validar la declaración de función
        if (!validarDeclaracionFuncion(nodo)) {
          return false; // La declaración de función es inválida
        }
      } else if (nodo.tipo === "BucleFor") {
        // Validar el bucle "for"
        if (!validarBucleFor(nodo)) {
          return false; // El bucle "for" es inválido
        }
      } else if (nodo.tipo === "EstructuraIf") {
        // Validar la estructura "if"
        if (!validarEstructuraIf(nodo)) {
          return false; // La estructura "if" es inválida
        }
      }
    }

    // Si todas las validaciones pasan, el código es válido
    return true;
  }

  function validarDeclaracionVariable(nodo) {
    if (nodo.nombre && nodo.valor !== null) {
      if (!/^[a-zA-Z_]\w*$/.test(nodo.nombre)) {
        console.log("El nombre de la variable es inválido");
        return false; // El nombre de la variable es inválido
      }

      if (!nodo.valor.trim()) {
        console.log("El valor de la variable está vacío");
        return false; // El valor de la variable es inválido si está vacío
      }
      console.log("El valor de la variable paso sin problemas");
      return true; // La declaración de variable es válida
    }

    console.log("La declaración de variable es inválida porque faltan datos");
    return false; // La declaración de variable es inválida si faltan datos
  }

  function validarDeclaracionFuncion(nodo) {
    if (
      nodo.nombreFuncion &&
      Array.isArray(nodo.parametros) &&
      nodo.parametros.length > 0 &&
      nodo.tipoRetorno &&
      nodo.contenido
    ) {
      if (!/^[a-zA-Z_]\w*$/.test(nodo.nombreFuncion)) {
        console.log("error en nombre de funcion");

        return false; // El nombre de la función es inválido
      }

      // Valida los parámetros de la función
      for (const parametro of nodo.parametros) {
        if (!/^[a-zA-Z_]\w*$/.test(parametro)) {
          console.log("error en parametros");
          return false; // Nombre de parámetro inválido
        }
      }
      if (!/^(int|float|string)$/.test(nodo.tipoRetorno)) {
        console.log("error en tipo de retorno");
        return false; // El tipo de retorno es inválido
      }

      // Valida el contenido de la función llamando a validarAST nuevamente
      if (!validarAST(nodo.contenido)) {
        console.log("Error en contenido", e);
        return false; // El contenido de la función es inválido
      }

      if (!nodo.contenido.length != 0) {
        console.log("entro a contenido porque es nulo");
        return false;
      }
      if (!/^[a-zA-Z\d]+$/.test(nodo.nodoReturn)) {
        console.log("error en tipo de retorno en contenido");
        return false; // El tipo de retorno es inválido
      }

      return true; // La declaración de función es válida
    }
    console.log("error es que falta algo que no se que es XD ");
    return false; // La declaración de función es inválida si faltan datos
  }

  function validarBucleFor(nodo) {
    if (!nodo.inicializacion || !nodo.condicion || !nodo.incremento) {
      console.log("Error en el bucle 'for': Falta algún componente");
      return false;
    }
    // Validar la inicialización del bucle 'for'
    const regexInicializacion = /^[a-zA-Z_]\w*$|\d+/;
    if (!regexInicializacion.test(nodo.inicializacion)) {
      console.log("Error en la inicialización del bucle 'for'");
      return false;
    }

    // Validar la condición del bucle 'for'
    const regexCondicion = /^[a-zA-Z_]\w*$|\d+/;
    // /^[a-zA-Z_]\w*([!=<>]==?|[<>])[a-zA-Z_]\w*|\d+([!=<>]==?|[<>])\d+/;
    if (!regexCondicion.test(nodo.condicion)) {
      console.log("Error en la condición del bucle 'for'");
      return false;
    }

    // Validar el incremento del bucle 'for'
    const regexIncremento = /^\d+\+\+$/;
    if (!regexIncremento.test(nodo.incremento)) {
      console.log("Error en el incremento del bucle 'for'");
      return false;
    }
    return true;
  }

  // Nueva función para validar dos puntos en el bucle "for"
  function validarDosPuntosEnFor(codigo) {
    console.log("entre en validar dos puintos ");
    const lineas = codigo.split("\n");

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();

      // Asegurarse de que la línea comienza con "for"
      if (linea.startsWith("for")) {
        // Dividir la línea en partes usando puntos y coma como delimitador
        const partes = linea.split(";");

        // Verificar que haya al menos tres partes en la línea del bucle "for"
        if (partes.length < 3) {
          console.log(
            "Error en la línea del bucle 'for': Falta algún componente"
          );
          return false;
        }
      }
    }

    // Se encontraron al menos tres partes en todas las líneas del bucle "for"
    return true;
  }

  function validarEstructuraIf(nodo) {
    if (nodo.condicion !== null) {
      if (nodo.condicion.trim() === "" || nodo.contenido.length === 0) {
        return false; // La condición del if es inválida si está vacía o si el contenido está vacío
      }

      const regexCondicion =
        /^[a-zA-Z_]\w*\s*([!=<>]==?|[<>])\s*[a-zA-Z_]\w*|\d+\s*([!=<>]==?|[<>])\s*\d+$/;

      if (!regexCondicion.test(nodo.condicion)) {
        console.log("la condicion no se cumplio");
        return false;
      }
      return true; // La estructura "if" es válida
    }
  }

  function setEditorTheme(monaco) {
    monaco.editor.defineTheme("codebug", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#141417",
        "editor.lineHighlightBackground": "#FFFFFF0F",
      },
    });
  }

  return (
    <div className="area">
      <Monaco
        beforeMount={setEditorTheme}
        width="800"
        height="50vh"
        language="javascript"
        theme="codebug"
        value={codigo}
        options={{
          selectOnLineNumbers: false,
          mouseStyle: "text",
          acceptSuggestionOnEnter: "off",
          quickSuggestions: false,
        }}
        onChange={(newValue) => setCodigo(newValue)}
      />
      <div className="line-validator">
        <button onClick={handleValidarClick}>Validar Código</button>
        {esValido && <div className="success">¡La sintaxis es correcta!</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

export default CodeValidator;
