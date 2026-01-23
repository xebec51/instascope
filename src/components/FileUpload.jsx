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

  return (
    <div className="card">
      <form onSubmit={handleAnalyze} className="upload-section">
        <div className="file-input-group">
          <label><strong>Followers JSON</strong></label>
          <input type="file" name="followers" accept=".json" />
        </div>

        <div className="file-input-group">
          <label><strong>Following JSON</strong></label>
          <input type="file" name="following" accept=".json" />
        </div>

        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          Analyze
        </button>
      </form>

      <hr />

      <h3>Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value">{followers.length}</span>
          <span className="stat-label">Total Followers</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{following.length}</span>
          <span className="stat-label">Total Following</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{mutual.length}</span>
          <span className="stat-label">Mutual Followers</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{notFollowBack.length}</span>
          <span className="stat-label">Not Follow Back</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{youNotFollowBack.length}</span>
          <span className="stat-label">You Don’t Follow Back</span>
        </div>
      </div>

      <h3>Show User List</h3>

      <div className="btn-group">
        <button
          type="button"
          onClick={() => setActiveView("mutual")}
          style={{
            backgroundColor: activeView === "mutual" ? "#2563eb" : undefined,
            color: activeView === "mutual" ? "white" : undefined
          }}
        >
          Mutual ({mutual.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveView("notFollowBack")}
          style={{
            backgroundColor: activeView === "notFollowBack" ? "#dc2626" : undefined,
            color: activeView === "notFollowBack" ? "white" : undefined
          }}
        >
          Not Follow Back ({notFollowBack.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveView("youNotFollowBack")}
          style={{
            backgroundColor: activeView === "youNotFollowBack" ? "#ca8a04" : undefined,
            color: activeView === "youNotFollowBack" ? "white" : undefined
          }}
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
