import { useState, useMemo } from "react";

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ marginRight: "6px" }}
    >
      <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 
      2.243 5 5 5h10c2.757 0 5-2.243 
      5-5V7c0-2.757-2.243-5-5-5H7zm10 
      2c1.654 0 3 1.346 3 3v10c0 
      1.654-1.346 3-3 3H7c-1.654 
      0-3-1.346-3-3V7c0-1.654 
      1.346-3 3-3h10zm-5 
      3a5 5 0 100 10 5 5 0 000-10zm0 
      2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1.25 
      1.25 0 100 2.5 1.25 1.25 0 
      000-2.5z"/>
    </svg>
  );
}

function ResultList({ title, users }) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.toLowerCase().includes(query.toLowerCase())
    );
  }, [users, query]);

  return (
    <div className="result-list-container">
      <h3>{title}</h3>

      <input
        type="text"
        className="search-input"
        placeholder="Search username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <p>
        Showing <strong>{filteredUsers.length}</strong> of{" "}
        <strong>{users.length}</strong>
      </p>

      {filteredUsers.length === 0 ? (
        <p>No matching users.</p>
      ) : (
        <ul className="user-list">
          {filteredUsers.map((username, index) => (
            <li key={index} className="user-item">
              <a
                href={`https://www.instagram.com/${username}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="user-link"
              >
                <InstagramIcon />
                @{username}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResultList;
