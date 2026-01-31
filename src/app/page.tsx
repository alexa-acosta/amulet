import LoginButton from "../components/loginButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl font-bold text-slate-900">Amulet</h1>
        <p className="text-slate-600">Your shared space starts here.</p>
        <LoginButton />
      </div>
    </main>
  );
}