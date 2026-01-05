function ResultList({ title, users }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3>{title}</h3>

      {users.length === 0 ? (
        <p>No data to display.</p>
      ) : (
        <ul style={{ maxHeight: "300px", overflowY: "auto" }}>
          {users.map((username, index) => (
            <li key={index}>{username}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResultList;
