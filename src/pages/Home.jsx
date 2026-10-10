import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-linear-to-b from-[#F5F5F5] to-white">
      <h1 className="text-5xl font-bold text-[#111111] mb-4 max-w-3xl">
        Global Society of <span className="text-[#00BFFF]">International Relations</span>
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-8">
        Analysis, activism, and insight on the issues shaping our world — climate, conflict, economy, and human rights.
      </p>
      <div className="flex gap-4">
        <Link
          to="/articles"
          className="bg-[#004D4D] text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
        >
          Explore Articles
        </Link>
        <Link
          to="/signup"
          className="border border-[#004D4D] text-[#004D4D] px-6 py-3 rounded-md font-semibold hover:bg-[#004D4D] hover:text-white transition-colors"
        >
          Join Us
        </Link>
      </div>
    </div>
  )
}

export default Home