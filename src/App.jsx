import FileUpload from "./components/FileUpload";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>InstaScope</h1>
      <p>Analyze Instagram followers and following from JSON export.</p>

      {/* INI WAJIB ADA */}
      <FileUpload />
    </div>
  );
}

export default App;
