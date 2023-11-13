import "./App.css";
import CodeBugDocs from "./CodeBugDocs";
import CodeValidator from "./CodeValidator";

function App() {
  return (
    <>
      <div className="title">
        <h1>CodeBug</h1>
        <h2>Crescencio Perez Santiz</h2>
        <h2>Kristell Perez Mateos</h2>
      </div>
      <CodeValidator />
      <CodeBugDocs />
    </>
  );
}

export default App;
