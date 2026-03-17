import Link from "next/link";
import LottoMachine from "./components/LottoMachine";

type LottoItem = {
  round_no: number;
  draw_date: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus: number;
  source: string;
  created_at: string;
  updated_at: string;
};

type LottoResponse = {
  page: number;
  size: number;
  total: number;
  total_pages: number;
  items: LottoItem[];
};

type LottoPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

async function getLottoResults(page: number): Promise<LottoResponse> {
  const url = `http://backend:8000/lotto/results?page=${page}&size=20`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 요청 실패: ${res.status} ${res.statusText} / ${text}`);
  }

  return res.json();
}

function getBallColor(num: number): string {
  if (num >= 1 && num <= 9) return "#f6c343";
  if (num >= 10 && num <= 19) return "#4a90e2";
  if (num >= 20 && num <= 29) return "#e74c3c";
  if (num >= 30 && num <= 39) return "#4a90e2";
  return "#222222";
}

function getBallTextColor(num: number): string {
  if (num >= 40) return "#ffffff";
  return "#111111";
}

function parsePage(value?: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function getRandomLottoLetterColors(): string[] {
  const colors = [
    "#f6c343",
    "#4a90e2",
    "#e74c3c",
    "#222222",
    "#2e8b57",
  ];

  const shuffled = [...colors];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export default async function LottoPage({ searchParams }: LottoPageProps) {
  try {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const currentPage = parsePage(resolvedSearchParams?.page);

    const data = await getLottoResults(currentPage);
    const titleColors = getRandomLottoLetterColors();
    const titleLetters = ["L", "o", "t", "t", "o"];

    return (
      <main
        style={{
          padding: 24,
          minHeight: "100vh",
          color: "#111111",
        }}
      >
        <h1
          style={{
            marginBottom: 8,
            display: "flex",
            gap: 2,
            alignItems: "center",
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {titleLetters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              style={{
                color: titleColors[index],
              }}
            >
              {letter}
            </span>
          ))}
        </h1>

        <p style={{ marginBottom: 16, color: "#333333" }}>
          {data.page}페이지 / 전체 {data.total_pages}페이지 / 최신 회차부터 {data.items.length}개 표시
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              flex: "1 1 760px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.items.map((item) => (
                <div
                  key={item.round_no}
                  style={{
                    padding: 16,
                    border: "1px solid #d9d9d9",
                    borderRadius: 12,
                    backgroundColor: "#f3f3f3",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: 18, color: "#111111" }}>
                    {item.round_no}회
                  </div>

                  <div style={{ fontSize: 14, color: "#444444" }}>
                    추첨일: {item.draw_date}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {[item.num1, item.num2, item.num3, item.num4, item.num5, item.num6].map(
                      (num, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            backgroundColor: getBallColor(num),
                            color: getBallTextColor(num),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: 14,
                          }}
                        >
                          {num}
                        </div>
                      )
                    )}

                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#555555",
                        margin: "0 2px",
                      }}
                    >
                      +
                    </div>

                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: getBallColor(item.bonus),
                        color: getBallTextColor(item.bonus),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      {item.bonus}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 24,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((pageNumber) => {
                const isCurrent = pageNumber === data.page;

                return (
                  <Link
                    key={pageNumber}
                    href={`/lotto?page=${pageNumber}`}
                    style={{
                      minWidth: 40,
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #cccccc",
                      backgroundColor: isCurrent ? "#111111" : "#ffffff",
                      color: isCurrent ? "#ffffff" : "#111111",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    {pageNumber}
                  </Link>
                );
              })}
            </div>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: 340,
              flex: "0 1 340px",
            }}
          >
            <LottoMachine />
          </div>
        </div>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    return (
      <main
        style={{
          padding: 24,
          minHeight: "100vh",
          color: "#111111",
        }}
      >
        <h1
          style={{
            marginBottom: 8,
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          Lotto
        </h1>
        <p>데이터 로딩 중 오류가 발생했습니다.</p>
        <pre style={{ color: "red" }}>{message}</pre>
      </main>
    );
  }
}