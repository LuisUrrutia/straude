const PLACEHOLDER_DATA = [
  { rank: 1, username: "claude_maximalist", sessions: 847, tokens: "2.4M", streak: 32, score: 29961 },
  { rank: 2, username: "terminal_poet", sessions: 712, tokens: "1.9M", streak: 28, score: 29901 },
  { rank: 3, username: "async_andrea", sessions: 698, tokens: "1.8M", streak: 45, score: 29892 },
  { rank: 4, username: "rust_evangelist", sessions: 634, tokens: "1.7M", streak: 21, score: 29855 },
  { rank: 5, username: "vim_or_die", sessions: 589, tokens: "1.5M", streak: 19, score: 29756 },
  { rank: 6, username: "monorepo_mike", sessions: 567, tokens: "1.4M", streak: 33, score: 29741 },
  { rank: 7, username: "type_safe_tina", sessions: 534, tokens: "1.3M", streak: 17, score: 29735 },
  { rank: 8, username: "git_bisect_pro", sessions: 512, tokens: "1.2M", streak: 26, score: 29705 },
  { rank: 9, username: "docker_dan", sessions: 489, tokens: "1.1M", streak: 14, score: 29678 },
  { rank: 10, username: "nextjs_ninja", sessions: 467, tokens: "1.0M", streak: 22, score: 29634 },
  { rank: 11, username: "lambda_lover", sessions: 445, tokens: "980K", streak: 11, score: 29589 },
  { rank: 12, username: "webpack_wizard", sessions: 423, tokens: "920K", streak: 18, score: 29545 },
];

const REGIONS = ["Global", "Americas", "Europe", "Asia", "Oceania"] as const;

export function Leaderboard() {
  return (
    <div className="w-full max-w-4xl font-body text-dark">
      {/* Region tabs */}
      <div className="mb-6 flex items-center gap-6 border-b border-gray/30">
        <span className="border-b-2 border-dark pb-2 font-heading text-xs font-semibold tracking-wider uppercase">
          Global
        </span>
        {REGIONS.slice(1).map((region) => (
          <span
            key={region}
            className="pb-2 font-heading text-xs font-medium tracking-wider text-accent uppercase"
          >
            {region}
          </span>
        ))}
      </div>

      {/* Table header */}
      <div className="mb-2 grid grid-cols-[3rem_1fr_5rem_5rem_4rem_5rem] gap-4 px-2 font-heading text-[10px] font-semibold tracking-wider text-gray uppercase">
        <span />
        <span>Username</span>
        <span className="text-right">Sessions</span>
        <span className="text-right">Tokens</span>
        <span className="text-right">Streak</span>
        <span className="text-right">Score</span>
      </div>

      {/* Table rows */}
      <div className="flex flex-col">
        {PLACEHOLDER_DATA.map((row) => {
          const isHighlighted = row.rank === 1 || row.rank === 3;
          return (
            <div
              key={row.rank}
              className={`grid grid-cols-[3rem_1fr_5rem_5rem_4rem_5rem] items-center gap-4 border-b border-dashed border-gray/20 px-2 py-3 ${
                isHighlighted ? "bg-accent/10" : ""
              }`}
            >
              {/* Rank badge */}
              <div className="flex justify-center">
                <span
                  className={`flex size-7 items-center justify-center rounded font-heading text-xs font-bold ${
                    isHighlighted
                      ? "bg-accent text-light"
                      : "bg-gray/20 text-dark"
                  }`}
                >
                  {row.rank}
                </span>
              </div>

              {/* Username */}
              <span className="truncate font-medium">{row.username}</span>

              {/* Sessions */}
              <span className="text-right font-mono text-sm tabular-nums">
                {row.sessions}
              </span>

              {/* Tokens */}
              <span className="text-right font-mono text-sm tabular-nums">
                {row.tokens}
              </span>

              {/* Streak */}
              <span className="text-right font-mono text-sm tabular-nums">
                {row.streak}
              </span>

              {/* Score */}
              <span
                className={`text-right font-heading text-sm font-semibold tabular-nums ${
                  isHighlighted ? "text-accent" : ""
                }`}
              >
                {row.score.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
