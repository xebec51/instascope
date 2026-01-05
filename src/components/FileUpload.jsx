import { useState } from "react";
import { parseFollowers, parseFollowing } from "../utils/instagramParser";

function FileUpload() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const readJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(JSON.parse(e.target.result));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const followersFile = e.target.followers.files[0];
    const followingFile = e.target.following.files[0];

    if (!followersFile || !followingFile) {
      alert("Please upload both JSON files.");
      return;
    }

    try {
      const followersJSON = await readJSON(followersFile);
      const followingJSON = await readJSON(followingFile);

      const followersList = parseFollowers(followersJSON);
      const followingList = parseFollowing(followingJSON);

      setFollowers(followersList);
      setFollowing(followingList);

      console.log("Followers:", followersList);
      console.log("Following:", followingList);

    } catch (error) {
      alert("Failed to read JSON files.");
      console.error(error);
    }
  };

  return (
    <div>
      <form onSubmit={handleAnalyze}>
        <div>
          <label>Followers JSON</label><br />
          <input type="file" name="followers" accept=".json" />
        </div>

        <br />

        <div>
          <label>Following JSON</label><br />
          <input type="file" name="following" accept=".json" />
        </div>

        <br />

        <button type="submit">Analyze</button>
      </form>

      <hr />

      <p>Total Followers: <strong>{followers.length}</strong></p>
      <p>Total Following: <strong>{following.length}</strong></p>
    </div>
  );
}

export default FileUpload;
