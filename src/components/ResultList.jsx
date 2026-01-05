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
          padding: "0.4rem",
          width: "100%",
          maxWidth: "300px",
          marginBottom: "0.75rem"
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
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #ddd",
            padding: "0.5rem",
            borderRadius: "6px"
          }}
        >
          {filteredUsers.map((username, index) => (
            <li key={index}>{username}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResultList;
