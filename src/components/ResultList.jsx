import { useState, useMemo } from "react";

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
            <li key={index} style={{ marginBottom: "0.35rem" }}>
              <a
                href={`https://www.instagram.com/${username}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "#2563eb",
                  fontWeight: 500
                }}
              >
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
