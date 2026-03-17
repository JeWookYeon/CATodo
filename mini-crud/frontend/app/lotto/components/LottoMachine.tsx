"use client";

import { useMemo, useState } from "react";

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

function generateLottoNumbers(): number[] {
  const picked = new Set<number>();

  while (picked.size < 6) {
    const value = Math.floor(Math.random() * 45) + 1;
    picked.add(value);
  }

  return Array.from(picked).sort((a, b) => a - b);
}

export default function LottoMachine() {
  const [numbers, setNumbers] = useState<number[]>([]);

  const smallBalls = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ((i * 4) % 45) + 1),
    []
  );

  const handleDraw = () => {
    setNumbers(generateLottoNumbers());
  };

  return (
    <aside
      style={{
        width: "100%",
        maxWidth: 340,
        padding: 20,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(255,255,255,0.5)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "8px solid #a8b6c8",
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(220,230,240,0.78) 58%, rgba(190,205,220,0.96) 100%)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "inset 0 6px 14px rgba(255,255,255,0.8), inset 0 -10px 20px rgba(80,100,120,0.18)",
          }}
        >
          {smallBalls.map((num, index) => {
            const positions = [
              { top: 24, left: 52 },
              { top: 54, left: 124 },
              { top: 88, left: 26 },
              { top: 98, left: 94 },
              { top: 128, left: 150 },
              { top: 148, left: 70 },
              { top: 48, left: 162 },
              { top: 144, left: 28 },
              { top: 118, left: 116 },
              { top: 72, left: 66 },
            ];
            const position = positions[index];

            return (
              <div
                key={`${num}-${index}`}
                style={{
                  position: "absolute",
                  top: position.top,
                  left: position.left,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: getBallColor(num),
                  color: getBallTextColor(num),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
                }}
              >
                {num}
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, #d9e2ec, #aab7c4 70%, #8a98a8 100%)",
              border: "6px solid #7a8795",
            }}
          />
        </div>

        <div
          style={{
            width: 120,
            height: 80,
            borderRadius: 16,
            background:
              "linear-gradient(180deg, #90a4b8 0%, #73879b 100%)",
            position: "relative",
            boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              width: 64,
              height: 18,
              borderRadius: 999,
              backgroundColor: "#dfe7ee",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleDraw}
          aria-label="로또 번호 뽑기"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background:
              "linear-gradient(180deg, #ff8a8a 0%, #e74c3c 100%)",
            boxShadow: "0 10px 18px rgba(231,76,60,0.28)",
          }}
        />

        <div
          style={{
            minHeight: 56,
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {numbers.map((num) => (
            <div
              key={num}
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
                boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
              }}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}