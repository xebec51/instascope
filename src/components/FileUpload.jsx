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
  const [isLoading, setIsLoading] = useState(false);

  const hasAnalyzed = followers.length > 0 || following.length > 0;

  const readJSON = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(JSON.parse(e.target.result));
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleAnalyze = async (e) => {
    e.preventDefault();

    const followersFile = e.target.followers.files[0];
    const followingFile = e.target.following.files[0];

    if (!followersFile || !followingFile) {
      alert("Please upload both followers and following JSON files.");
      return;
    }

    try {
      setIsLoading(true);

      const followersJSON = await readJSON(followersFile);
      const followingJSON = await readJSON(followingFile);

      const followersList = parseFollowers(followersJSON);
      const followingList = parseFollowing(followingJSON);

      setFollowers(followersList);
      setFollowing(followingList);

      const followersSet = new Set(followersList);
      const followingSet = new Set(followingList);

      setMutual(followersList.filter((u) => followingSet.has(u)));
      setNotFollowBack(followingList.filter((u) => !followersSet.has(u)));
      setYouNotFollowBack(followersList.filter((u) => !followingSet.has(u)));

      setActiveView(null);
    } catch (error) {
      alert("Failed to read or process JSON files.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>

      {/* HERO HEADER */}
      <section className="hero">
        <h1>InstaScope 📊</h1>
        <p>
          Analyze your Instagram followers & following instantly —  
          private, fast, and fully local.
        </p>
      </section>

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

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {/* EMPTY STATE */}
        {!hasAnalyzed && (
          <div className="empty-state">
            <h3>🚀 Ready to analyze your account?</h3>
            <p>
              Upload your Instagram JSON files above and click Analyze.
              Your data never leaves your device.
            </p>
          </div>
        )}

        {hasAnalyzed && (
          <>
            <hr />

            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{followers.length}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{following.length}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{mutual.length}</span>
                <span className="stat-label">Mutual</span>
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
              <button onClick={() => setActiveView("mutual")} type="button">
                Mutual ({mutual.length})
              </button>
              <button onClick={() => setActiveView("notFollowBack")} type="button">
                Not Follow Back ({notFollowBack.length})
              </button>
              <button onClick={() => setActiveView("youNotFollowBack")} type="button">
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
          </>
        )}
      </div>
    </div>
  );
}

export default FileUpload;