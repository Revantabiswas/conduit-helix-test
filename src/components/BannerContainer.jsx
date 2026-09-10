// BannerContainer (ported from frontend/src/components/BannerContainer). Presentational.

export default function BannerContainer({ children }) {
  return (
    <div className="banner">
      <div className="container">{children}</div>
    </div>
  );
}
