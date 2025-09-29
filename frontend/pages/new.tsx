import Buttons from "../components/Buttons";
export default function New() {
  return (
    <main style={{padding:24}}>
      <h1>AI Trader - New Trading Session</h1>
      <p>Connected to: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
      <Buttons />
    </main>
  );
}