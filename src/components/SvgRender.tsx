export function SvgRender({
  compiledVase,
}: {
  compiledVase: {
    path: string;
    viewBox: string;
    width: number;
    height: number;
  };
}) {
  const { path, width, height } = compiledVase;

  const renderWidth = width * 4;
  const renderHeight = height * 4;

  const strokePadding = 2;

  const viewBox = `${-strokePadding} ${-strokePadding} ${
    width + strokePadding
  } ${height + strokePadding}`;

  return (
    <svg
      style={{
        width: renderWidth + strokePadding * 2,
        height: renderHeight + strokePadding * 2,
      }}
      width={width + strokePadding * 2}
      height={height + strokePadding * 2}
      strokeLinejoin="round"
      viewBox={viewBox}
      fill="#000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={path} stroke="#fff8" fill="#0008" strokeWidth="0.5" />
    </svg>
  );
}
