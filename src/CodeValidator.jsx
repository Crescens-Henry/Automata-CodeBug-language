import React, { useState } from "react";

function CodeValidator() {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);
  const [esValido, setEsValido] = useState(false);

  function validarCodigo() {
    try {
      // Paso 1: Analizador léxico (tokenización)
      const tokens = analizarCodigo(codigo);
      // Verificar si se encontraron tokens válidos

      // Paso 2: Analizador sintáctico (construcción del AST)
      const ast = construirAST(tokens);

      // Paso 3: Validación del AST
      const esValido = validarAST(ast);

      if (esValido) {
        setError(null); // Si el código es válido, borra cualquier mensaje de error previo
        setEsValido(true);
      } else {
        setError(
          "Error de sintaxis: El código no cumple con las reglas gramaticales."
        ); // Solo establece el error si el código es inválido
        setEsValido(false);
      }
    } catch (e) {
      setError("Error inesperado: " + e.message);
    }
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
      const linea = lineas[i].trim();
      console.log("Tipo de linea:", typeof linea);

      if (linea === "") {
        continue; // Ignorar líneas en blanco
      }

      const palabras = linea.split(/\s+/); // Dividir la línea en palabras
      let esDeclaracion = false;

      for (const palabra of palabras) {
        console.log("Tipo de palabra en el bucle interno:", typeof palabra);
        // Declaración de variable: <nombre de variable> : <valor>
        if (palabra.includes(":")) {
          const [nombre, valor] = palabra.split(":");
          tokens.push({
            tipo: "DeclaracionVariable",
            nombre,
            valor,
            nivelAnidacion,
          });
          esDeclaracion = true;
        }
        // Declaración de función: fc <nombre de funcion> (<parametros>) <tipo de valor a retornar> { return: contenido }
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
            // Buscar 'return' en cualquier parte de la línea
            const returnIndex = lineaContenido.indexOf("return");
            if (returnIndex !== -1) {
              const retorno = lineaContenido
                .substring(returnIndex + "return".length)
                .trim();
              if (retorno !== "") {
                // Agregar la declaración 'return' como un token
                contenido.push({
                  tipo: "ReturnStatement",
                  valor: retorno,
                });
              } else {
                // El valor de 'return' no puede estar vacío
                throw new Error(
                  "Error: El valor de 'return' no puede estar vacío."
                );
              }
            } else if (lineaContenido !== "") {
              contenido.push(lineaContenido);
            }
            i++;
          }
          i--; // Retroceder una línea para evitar saltar una línea
        }
        // Bucle "for": for <inicializacion>; <condicion>; <incremento>
        else if (palabra === "for") {
          const inicializacion = palabras[palabras.indexOf(palabra) + 1];
          const condicion = palabras[palabras.indexOf(";") + 1];
          const incremento = palabras[palabras.indexOf(";") + 2];
          tokens.push({
            tipo: "BucleFor",
            inicializacion,
            condicion,
            incremento,
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
              contenido.push(lineaContenido);
            }
            i++;
          }
          i--; // Retroceder una línea para evitar saltar una línea
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
        console.log("Contenido de 'linea' antes de push:", linea);
        // Si no es una declaración, puede ser una línea de código o error
        // Aquí puedes agregar más lógica para identificar y manejar errores
        tokens.push({
          tipo: "LineaDeCodigo",
          contenido: linea,
          nivelAnidacion,
        });
      }
      console.log("Tipo de linea al final del bucle interno:", typeof linea);
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
      }
    }
    console.log(ast);

    return ast;
  }
  // Función para validar el AST según las reglas gramaticales del lenguaje
  function validarAST(ast) {
    console.log("Entrando en validarAST");

    for (const nodo of ast) {
      console.log("Tipo de nodo:", nodo.tipo);

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
    if (nodo.nombre && nodo.valor) {
      if (!/^[a-zA-Z_]\w*$/.test(nodo.nombre)) {
        return false; // El nombre de la variable es inválido
      }

      if (nodo.valor.trim() === "") {
        return false; // El valor de la variable es inválido si está vacío
      }

      return true; // La declaración de variable es válida
    }
    return false; // La declaración de variable es inválida si faltan datos
  }

  function validarDeclaracionFuncion(nodo) {
    if (
      nodo.nombreFuncion &&
      Array.isArray(nodo.parametros) &&
      nodo.parametros.length > 0 &&
      nodo.tipoRetorno !== undefined && // Corrección: Cambiado de '&&' a '!=='
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
      // Corrección: Movido el bloque de validación del tipo de retorno fuera del bucle de parámetros
      if (!/^(int|float|string)$/.test(nodo.tipoRetorno)) {
        console.log("error en tipo de retorno");
        return false; // El tipo de retorno es inválido
      }

      // Valida el contenido de la función
      const hasReturnStatement = nodo.contenido.some((linea) => {
        const trimmedLine = linea.trim();
        console.log("Línea actual:", trimmedLine);
        return trimmedLine.startsWith("return ");
      });

      if (!hasReturnStatement) {
        console.log("Error: Falta declaración 'return' en la función");
        return false; // El contenido de la función no contiene una declaración 'return'
      }

      // Valida el contenido de la función llamando a validarAST nuevamente
      if (!validarAST(nodo.contenido)) {
        console.log("Error contenido");
        return false; // El contenido de la función es inválido
      }

      return true; // La declaración de función es válida
    }
    console.log("error es que falta algo que no se que es XD ");
    return false; // La declaración de función es inválida si faltan datos
  }

  function validarBucleFor(nodo) {
    if (nodo.inicializacion && nodo.condicion && nodo.incremento) {
      // Ejemplo de validación: Verificar que la inicialización, condición e incremento no estén vacíos
      if (
        nodo.inicializacion.trim() === "" ||
        nodo.condicion.trim() === "" ||
        (nodo.incremento.trim() === "") === null
      ) {
        return false;
      }
      // Otras validaciones específicas aquí...
      return true; // El bucle "for" es válido
    }
    return false; // El bucle "for" es inválido si faltan datos
  }

  function validarEstructuraIf(nodo) {
    if (nodo.condicion !== null) {
      if (nodo.condicion.trim() === "" || nodo.contenido.length === 0) {
        return false; // La condición del if es inválida si está vacía o si el contenido está vacío
      }
      return true; // La estructura "if" es válida
    }
  }

  return (
    <div>
      <textarea
        value={codigo}
        onChange={(e) => {
          setCodigo(e.target.value);
        }}
        placeholder="Ingrese su código aquí"
        rows={20}
      ></textarea>
      <div className="line-validator">
        <button onClick={handleValidarClick}>Validar Código</button>
        {esValido && <div className="success">¡La sintaxis es correcta!</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

export default CodeValidator;