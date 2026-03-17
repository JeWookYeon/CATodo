type FrequencyItem = {
  number: number;
  frequency: number;
};

type FrequencyResponse = {
  limit: number;
  items: FrequencyItem[];
};

type RoundItem = {
  round_no: number;
  draw_date: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus: number;
};

type NumberRoundsResponse = {
  number: number;
  count: number;
  rounds: RoundItem[];
};

type BallColorKey = "red" | "yellow" | "green" | "black" | "blue";

const BACKEND_BASE_URL = "http://backend:8000";

const BALL_COLOR_MAP: Record<
  BallColorKey,
  { background: string; color: string; border: string }
> = {
  red: {
    background: "#ef4444",
    color: "#ffffff",
    border: "#dc2626",
  },
  yellow: {
    background: "#facc15",
    color: "#111827",
    border: "#eab308",
  },
  green: {
    background: "#22c55e",
    color: "#ffffff",
    border: "#16a34a",
  },
  black: {
    background: "#111827",
    color: "#ffffff",
    border: "#000000",
  },
  blue: {
    background: "#3b82f6",
    color: "#ffffff",
    border: "#2563eb",
  },
};

const BALL_COLOR_KEYS: BallColorKey[] = [
  "red",
  "yellow",
  "green",
  "black",
  "blue",
];

async function getTopFrequencies(): Promise<FrequencyResponse | null> {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/lotto/stats/frequencies?limit=10`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Top frequencies fetch 실패:", error);
    return null;
  }
}

async function getRoundsByNumber(
  number: number
): Promise<NumberRoundsResponse | null> {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/lotto/stats/numbers/${number}/rounds`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error(`번호 ${number} 회차 조회 실패:`, error);
    return null;
  }
}

function formatDate(dateString: string) {
  return dateString;
}

function getHighlightColorByNumber(number: number): BallColorKey {
  return BALL_COLOR_KEYS[number % BALL_COLOR_KEYS.length];
}

function NumberBall({
  value,
  highlightColor,
}: {
  value: number;
  highlightColor?: BallColorKey;
}) {
  const palette = highlightColor
    ? BALL_COLOR_MAP[highlightColor]
    : {
        background: "#ffffff",
        color: "#111827",
        border: "#d1d5db",
      };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: `1px solid ${palette.border}`,
        fontSize: 14,
        fontWeight: 700,
        background: palette.background,
        color: palette.color,
      }}
    >
      {value}
    </span>
  );
}

export default async function StatsPage() {
  const frequencyData = await getTopFrequencies();

  const roundHistories = frequencyData
    ? await Promise.all(
        frequencyData.items.map(async (item) => {
          const roundsData = await getRoundsByNumber(item.number);
          return {
            number: item.number,
            data: roundsData,
          };
        })
      )
    : [];

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>통계</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        가장 많이 나온 번호 TOP10과 번호별 등장 회차입니다.
      </p>

      {!frequencyData ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            background: "#ffffff",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            번호 TOP10
          </h2>
          <p style={{ color: "#dc2626", margin: 0 }}>
            통계 데이터를 불러오지 못했습니다. 백엔드 API 또는 Docker 네트워크를
            확인해주세요.
          </p>
        </section>
      ) : frequencyData.items.length === 0 ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            background: "#ffffff",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            번호 TOP10
          </h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            아직 로또 데이터가 없습니다. 먼저 백필을 실행해주세요.
          </p>
        </section>
      ) : (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            background: "#ffffff",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            번호 TOP10
          </h2>

          <div style={{ display: "grid", gap: 12 }}>
            {frequencyData.items.map((item, index) => {
              const history = roundHistories.find(
                (roundItem) => roundItem.number === item.number
              )?.data;

              const highlightColor = getHighlightColorByNumber(item.number);

              return (
                <details
                  key={item.number}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16,
                    background: "#f9fafb",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      listStyle: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            minWidth: 32,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#6b7280",
                          }}
                        >
                          TOP {index + 1}
                        </span>

                        <NumberBall
                          value={item.number}
                          highlightColor={highlightColor}
                        />

                        <span style={{ fontSize: 18, fontWeight: 700 }}>
                          {item.number}번
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {item.frequency}회 출현
                      </span>
                    </div>
                  </summary>

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    {!history ? (
                      <p style={{ margin: 0, color: "#dc2626" }}>
                        회차 정보를 불러오지 못했습니다.
                      </p>
                    ) : history.rounds.length === 0 ? (
                      <p style={{ margin: 0, color: "#6b7280" }}>
                        등장한 회차가 없습니다.
                      </p>
                    ) : (
                      <>
                        <p
                          style={{
                            marginTop: 0,
                            marginBottom: 12,
                            fontSize: 14,
                            color: "#4b5563",
                          }}
                        >
                          총 {history.count}회 등장
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          {history.rounds.map((round) => (
                            <div
                              key={round.round_no}
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: 10,
                                padding: 12,
                                background: "#ffffff",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: 10,
                                  gap: 12,
                                  flexWrap: "wrap",
                                }}
                              >
                                <strong>{round.round_no}회</strong>
                                <span
                                  style={{
                                    fontSize: 14,
                                    color: "#6b7280",
                                  }}
                                >
                                  {formatDate(round.draw_date)}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <NumberBall
                                  value={round.num1}
                                  highlightColor={
                                    round.num1 === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                                <NumberBall
                                  value={round.num2}
                                  highlightColor={
                                    round.num2 === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                                <NumberBall
                                  value={round.num3}
                                  highlightColor={
                                    round.num3 === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                                <NumberBall
                                  value={round.num4}
                                  highlightColor={
                                    round.num4 === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                                <NumberBall
                                  value={round.num5}
                                  highlightColor={
                                    round.num5 === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                                <NumberBall
                                  value={round.num6}
                                  highlightColor={
                                    round.num6 === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                                <span
                                  style={{
                                    margin: "0 4px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                  }}
                                >
                                  +
                                </span>
                                <NumberBall
                                  value={round.bonus}
                                  highlightColor={
                                    round.bonus === item.number
                                      ? highlightColor
                                      : undefined
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}