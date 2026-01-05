import { useState } from "react";

function FileUpload() {
  const [followersFile, setFollowersFile] = useState(null);
  const [followingFile, setFollowingFile] = useState(null);

  const handleSubmit = () => {
    if (!followersFile || !followingFile) {
      alert("Please upload both followers and following JSON files.");
      return;
    }

    console.log("Followers file:", followersFile);
    console.log("Following file:", followingFile);
  };

  return (
    <div>
      <div>
        <label>Followers JSON</label><br />
        <input
          type="file"
          accept=".json"
          onChange={(e) => setFollowersFile(e.target.files[0])}
        />
      </div>

      <br />

      <div>
        <label>Following JSON</label><br />
        <input
          type="file"
          accept=".json"
          onChange={(e) => setFollowingFile(e.target.files[0])}
        />
      </div>

      <br />

      <button onClick={handleSubmit}>Analyze</button>
    </div>
  );
}

export default FileUpload;
