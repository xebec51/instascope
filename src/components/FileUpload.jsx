import { useState } from "react";
import { parseFollowers, parseFollowing } from "../utils/instagramParser";

function FileUpload() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [mutual, setMutual] = useState([]);
  const [notFollowBack, setNotFollowBack] = useState([]);
  const [youNotFollowBack, setYouNotFollowBack] = useState([]);

  const readJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(JSON.parse(e.target.result));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const followersFile = e.target.followers.files[0];
    const followingFile = e.target.following.files[0];

    if (!followersFile || !followingFile) {
      alert("Please upload both followers and following JSON files.");
      return;
    }

    try {
      // Read JSON files
      const followersJSON = await readJSON(followersFile);
      const followingJSON = await readJSON(followingFile);

      // Parse usernames
      const followersList = parseFollowers(followersJSON);
      const followingList = parseFollowing(followingJSON);

      // Save raw data
      setFollowers(followersList);
      setFollowing(followingList);

      // Analysis using Set (fast & accurate)
      const followersSet = new Set(followersList);
      const followingSet = new Set(followingList);

      const mutualResult = followersList.filter((u) =>
        followingSet.has(u)
      );

      const notFollowBackResult = followingList.filter(
        (u) => !followersSet.has(u)
      );

      const youNotFollowBackResult = followersList.filter(
        (u) => !followingSet.has(u)
      );

      // Save analysis results
      setMutual(mutualResult);
      setNotFollowBack(notFollowBackResult);
      setYouNotFollowBack(youNotFollowBackResult);

      // Debug (optional)
      console.log("Followers:", followersList);
      console.log("Following:", followingList);
      console.log("Mutual:", mutualResult);
      console.log("Not Follow Back:", notFollowBackResult);
      console.log("You Don't Follow Back:", youNotFollowBackResult);

    } catch (error) {
      alert("Failed to read or process JSON files.");
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

      <h3>Statistics</h3>
      <ul>
        <li>Total Followers: <strong>{followers.length}</strong></li>
        <li>Total Following: <strong>{following.length}</strong></li>
        <li>Mutual Followers: <strong>{mutual.length}</strong></li>
        <li>Not Follow Back: <strong>{notFollowBack.length}</strong></li>
        <li>You Don’t Follow Back: <strong>{youNotFollowBack.length}</strong></li>
      </ul>
    </div>
  );
}

export default FileUpload;
