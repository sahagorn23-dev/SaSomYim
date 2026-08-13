import dynamic from "next/dynamic";

const RootClient = dynamic(() => import("./_root-client"), {
  ssr: false,
});

export default function RootPage() {
  return <RootClient />;
}
