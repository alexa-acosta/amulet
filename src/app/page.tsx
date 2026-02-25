import LoginButton from '../components/loginButton';

export default function Home() {
  return (
    <main className="h-screen bg-wild-berry flex flex-col pt-6 px-6 pb-0 overflow-hidden font-maitree">
      
      <nav className="flex justify-between px-6 py-4 text-ivory-cream text-sm tracking-widest">
        <div className="flex gap-10">
        </div>
      </nav>

      <div className="flex-1 bg-powder-grey rounded-t-[80px] rounded-b-none flex flex-col items-center justify-center shadow-2xl overflow-hidden relative">
        <h1 className="text-[14rem] font-bold text-wild-berry leading-none tracking-tighter mb-4">
          amulet
        </h1>

        <div className="w-full mb-12 overflow-hidden flex">
          <div className="flex animate-marquee whitespace-nowrap">
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
          </div>
          <div className="flex animate-marquee whitespace-nowrap">
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
            <span className="text-2xl font-light italic text-wild-berry mx-12">your shared space, simplified</span>
          </div>
        </div>

        <LoginButton />
      </div>
    </main>
  );
}