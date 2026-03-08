import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { SiteFrame } from "./components/layout/SiteFrame";
import { useLocalSessions } from "./hooks/useLocalSessions";

const Home = lazy(() =>
  import("./routes/Home").then((module) => ({ default: module.Home }))
);
const Studio = lazy(() =>
  import("./routes/Studio").then((module) => ({ default: module.Studio }))
);
const ReviewCenter = lazy(() =>
  import("./routes/ReviewCenter").then((module) => ({ default: module.ReviewCenter }))
);
const Batch = lazy(() =>
  import("./routes/Batch").then((module) => ({ default: module.Batch }))
);
const SyntheticLab = lazy(() =>
  import("./routes/SyntheticLab").then((module) => ({ default: module.SyntheticLab }))
);
const Cases = lazy(() =>
  import("./routes/Cases").then((module) => ({ default: module.Cases }))
);
const About = lazy(() =>
  import("./routes/About").then((module) => ({ default: module.About }))
);
const Architecture = lazy(() =>
  import("./routes/Architecture").then((module) => ({ default: module.Architecture }))
);
const ReportPreview = lazy(() =>
  import("./routes/ReportPreview").then((module) => ({ default: module.ReportPreview }))
);
const Reports = lazy(() =>
  import("./routes/Reports").then((module) => ({ default: module.Reports }))
);

function AppRoutes() {
  useLocalSessions();

  return (
    <SiteFrame>
      <Suspense
        fallback={
          <div className="px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px] panel-shell">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.42]">
                Loading route
              </div>
              <div className="mt-3 font-display text-4xl text-white">
                Building the next signal view.
              </div>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/review" element={<ReviewCenter />} />
          <Route path="/batch" element={<Batch />} />
          <Route path="/synthetic" element={<SyntheticLab />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/about" element={<About />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/report-preview" element={<ReportPreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SiteFrame>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
