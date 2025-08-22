import { Typography } from "@mui/material";

export default function CurvedText() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", top: 20, left: 0, pointerEvents: "none", }}
        >
            <defs>

                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.7" />
                </filter>

                {/* geser Y path ke bawah biar tidak kepotong */}
                <path
                    id="curve"
                    d="M 100,250 A 150,150 0 1,1 400,250"
                    fill="transparent"
                />
            </defs>
            <text
                fill="white"
                fontSize="30"
                fontWeight="900"
                fontFamily="Roboto, sans-serif"
                textAnchor="middle"
                filter="url(#shadow)"
                style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
            >
                <textPath href="#curve" startOffset="50%">
                    Click to Spin
                </textPath>
            </text>
        </svg>

    );
}
