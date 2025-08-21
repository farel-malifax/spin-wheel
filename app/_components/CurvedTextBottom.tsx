export default function CurvedTextBottom() {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", bottom: 10, left: 0, pointerEvents: "none" }}
        >
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.7" />
                </filter>

                {/* Lengkung ke bawah */}
                <path
                    id="curve-bottom"
                    d="M 100,250 A 150,150 0 1,0 400,250"
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
            >
                <textPath href="#curve-bottom" startOffset="50%">
                    or press Ctrl + Enter
                </textPath>
            </text>
        </svg>
    );
}
