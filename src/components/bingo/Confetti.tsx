export function Confetti() {
  const pieces = Array.from({ length: 50 });
  const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--success))"];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: "-10vh",
            width: "10px",
            height: "14px",
            background: colors[i % colors.length],
            borderRadius: "2px",
            animation: `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 1.5}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
