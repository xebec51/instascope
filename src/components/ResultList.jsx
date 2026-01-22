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
    <div style={{ marginTop: "1.5rem" }}>
      <h3>{title}</h3>

      <input
        type="text"
        placeholder="Search username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "0.45rem",
          width: "100%",
          maxWidth: "320px",
          marginBottom: "0.75rem",
          borderRadius: "6px",
          border: "1px solid #ccc"
        }}
      />

      <p>
        Showing <strong>{filteredUsers.length}</strong> of{" "}
        <strong>{users.length}</strong>
      </p>

      {filteredUsers.length === 0 ? (
        <p>No matching users.</p>
      ) : (
        <ul
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            border: "1px solid #ddd",
            padding: "0.5rem",
            borderRadius: "6px",
            listStyle: "none"
          }}
        >
          {filteredUsers.map((username, index) => (
            <li key={index} style={{ marginBottom: "0.4rem" }}>
              <a
                href={`https://www.instagram.com/${username}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "#2563eb",
                  fontWeight: 500
                }}
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
