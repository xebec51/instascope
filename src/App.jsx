import FileUpload from "./components/FileUpload";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>InstaScope</h1>
        <p>Analyze Instagram followers and following from JSON export.</p>
      </header>

      {/* INI WAJIB ADA */}
      <FileUpload />
    </div>
  );
}

export default App;
