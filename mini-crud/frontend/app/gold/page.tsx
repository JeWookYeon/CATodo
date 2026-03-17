type GoldResponse = {
  price_usd_per_oz: number;
  price_usd_per_g: number;
  usd_krw: number;
  price_krw_per_g: number;
  gold_updated_at: string | null;
  fx_date: string | null;
  updated_at: string;
  gold_source: string;
  fx_source: string;
};

type GoldHistoryItem = {
  id: number;
  price_date: string;
  close_usd_per_oz: number;
  close_usd_per_g: number;
  usd_krw: number;
  close_krw_per_g: number;
  source_type: string;
  source_name: string;
  collected_at: string;
  created_at: string;
};

type GoldHistoryResponse = {
  count: number;
  limit: number;
  items: GoldHistoryItem[];
};

async function getGoldCurrent(): Promise<GoldResponse> {
  const url = "http://backend:8000/gold/current";

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`금시세 API 요청 실패: ${res.status} ${res.statusText} / ${text}`);
  }

  return res.json();
}

async function getGoldHistory(limit = 30): Promise<GoldHistoryResponse> {
  const url = `http://backend:8000/gold/history?limit=${limit}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`금시세 이력 API 요청 실패: ${res.status} ${res.statusText} / ${text}`);
  }

  return res.json();
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(value);
}

function ErrorBox({ message }: { message: string }) {
  return (
    <pre
      style={{
        marginTop: 12,
        padding: 12,
        background: "#f5f5f5",
        borderRadius: 8,
        whiteSpace: "pre-wrap",
      }}
    >
      {message}
    </pre>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 20,
        display: "grid",
        gap: 12,
        background: "#fff",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      {children}
    </section>
  );
}

export default async function GoldPage() {
  let currentData: GoldResponse | null = null;
  let historyData: GoldHistoryResponse | null = null;

  let currentError = "";
  let historyError = "";

  try {
    currentData = await getGoldCurrent();
  } catch (error) {
    currentError =
      error instanceof Error ? error.message : "현재 금시세 조회 중 알 수 없는 오류가 발생했습니다.";
  }

  try {
    historyData = await getGoldHistory(30);
  } catch (error) {
    historyError =
      error instanceof Error ? error.message : "금시세 이력 조회 중 알 수 없는 오류가 발생했습니다.";
  }

  return (
    <main
      style={{
        padding: 24,
        display: "grid",
        gap: 20,
      }}
    >
      <h1 style={{ margin: 0 }}>금시세</h1>

      <SectionCard title="현재 금시세">
        {currentData ? (
          <div
            style={{
              maxWidth: 640,
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <strong>1트로이온스(USD)</strong>
              <div>{formatNumber(currentData.price_usd_per_oz)} USD</div>
            </div>

            <div>
              <strong>1g(USD)</strong>
              <div>{formatNumber(currentData.price_usd_per_g, 4)} USD</div>
            </div>

            <div>
              <strong>USD/KRW 환율</strong>
              <div>{formatNumber(currentData.usd_krw, 4)}</div>
            </div>

            <div>
              <strong>1g(KRW)</strong>
              <div>{formatNumber(currentData.price_krw_per_g)} KRW</div>
            </div>

            <div>
              <strong>금 시세 기준 시각</strong>
              <div>{currentData.gold_updated_at ?? "-"}</div>
            </div>

            <div>
              <strong>환율 기준 일자</strong>
              <div>{currentData.fx_date ?? "-"}</div>
            </div>

            <div>
              <strong>수집 시각</strong>
              <div>{currentData.updated_at}</div>
            </div>

            <div>
              <strong>출처</strong>
              <div>
                금: {currentData.gold_source} / 환율: {currentData.fx_source}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ margin: 0 }}>현재 금시세를 불러오지 못했습니다.</p>
            <ErrorBox message={currentError} />
          </div>
        )}
      </SectionCard>

      <SectionCard title="최근 금시세 이력">
        {historyData ? (
          historyData.items.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 760,
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>날짜</th>
                    <th style={thStyle}>1toz(USD)</th>
                    <th style={thStyle}>1g(USD)</th>
                    <th style={thStyle}>환율</th>
                    <th style={thStyle}>1g(KRW)</th>
                    <th style={thStyle}>출처</th>
                    <th style={thStyle}>수집시각</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.items.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>{item.price_date}</td>
                      <td style={tdStyle}>{formatNumber(item.close_usd_per_oz)}</td>
                      <td style={tdStyle}>{formatNumber(item.close_usd_per_g, 4)}</td>
                      <td style={tdStyle}>{formatNumber(item.usd_krw, 4)}</td>
                      <td style={tdStyle}>{formatNumber(item.close_krw_per_g)}</td>
                      <td style={tdStyle}>
                        {item.source_name} ({item.source_type})
                      </td>
                      <td style={tdStyle}>{item.collected_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ margin: 0 }}>저장된 금시세 이력이 없습니다.</p>
          )
        ) : (
          <div>
            <p style={{ margin: 0 }}>금시세 이력을 불러오지 못했습니다.</p>
            <ErrorBox message={historyError} />
          </div>
        )}
      </SectionCard>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "10px 12px",
  background: "#fafafa",
  fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 12px",
  fontSize: 14,
  verticalAlign: "top",
};