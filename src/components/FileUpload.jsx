import { useState } from "react";
import { parseFollowers, parseFollowing } from "../utils/instagramParser";
import ResultList from "./ResultList";

function FileUpload() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [mutual, setMutual] = useState([]);
  const [notFollowBack, setNotFollowBack] = useState([]);
  const [youNotFollowBack, setYouNotFollowBack] = useState([]);

  const [activeView, setActiveView] = useState(null);

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
      const followersJSON = await readJSON(followersFile);
      const followingJSON = await readJSON(followingFile);

      const followersList = parseFollowers(followersJSON);
      const followingList = parseFollowing(followingJSON);

      setFollowers(followersList);
      setFollowing(followingList);

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

      setMutual(mutualResult);
      setNotFollowBack(notFollowBackResult);
      setYouNotFollowBack(youNotFollowBackResult);

      // reset menu setiap analyze ulang
      setActiveView(null);

    } catch (error) {
      alert("Failed to read or process JSON files.");
      console.error(error);
    }
  };

  const buttonStyle = (isActive, color) => ({
    backgroundColor: isActive ? color : "#e5e7eb",
    color: isActive ? "#fff" : "#000",
    border: "none",
    padding: "0.45rem 0.85rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500
  });

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

      <h3>Show User List</h3>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setActiveView("mutual")}
          style={buttonStyle(activeView === "mutual", "#2563eb")}
        >
          Mutual ({mutual.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveView("notFollowBack")}
          style={buttonStyle(activeView === "notFollowBack", "#dc2626")}
        >
          Not Follow Back ({notFollowBack.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveView("youNotFollowBack")}
          style={buttonStyle(activeView === "youNotFollowBack", "#ca8a04")}
        >
          You Don’t Follow Back ({youNotFollowBack.length})
        </button>
      </div>

      {activeView === "mutual" && (
        <ResultList title="Mutual Followers" users={mutual} />
      )}

      {activeView === "notFollowBack" && (
        <ResultList title="Not Follow Back" users={notFollowBack} />
      )}

      {activeView === "youNotFollowBack" && (
        <ResultList title="You Don’t Follow Back" users={youNotFollowBack} />
      )}
    </div>
  );
}

export default FileUpload;
