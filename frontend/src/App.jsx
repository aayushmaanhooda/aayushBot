import { useState } from "react";
import { sendChatMessage } from "./api/chat.js";

function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      const response = await sendChatMessage(
        "Hello from frontend! Testing the connection."
      );
      alert(`Backend Response: ${response.answer}`);
    } catch (error) {
      alert(
        `Error: ${error.message}. Make sure the backend is running on http://localhost:8000`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 animate-pulse-slow">
            Welcome to
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-bounce-slow">
            AayushBot 2.0
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Your intelligent AI assistant is ready to help you with anything you
            need
          </p>
        </div>

        {/* Animated Button */}
        <div className="pt-8">
          <button
            onClick={handleGetStarted}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
            className={`
              relative px-8 py-4 text-lg font-semibold text-white
              bg-gradient-to-r from-blue-500 to-purple-600
              rounded-full shadow-lg
              transform transition-all duration-300 ease-in-out
              hover:scale-110 hover:shadow-2xl
              active:scale-95
              ${isHovered ? "animate-glow" : ""}
              ${isLoading ? "opacity-75 cursor-not-allowed" : ""}
              focus:outline-none focus:ring-4 focus:ring-blue-300
            `}
          >
            <span className="relative z-10">
              {isLoading ? "Connecting..." : "Get Started"}
            </span>

            {/* Animated background overlay */}
            <div
              className={`
              absolute inset-0 rounded-full
              bg-gradient-to-r from-purple-500 to-pink-500
              opacity-0 transition-opacity duration-300
              ${isHovered ? "opacity-100" : "opacity-0"}
            `}
            />

            {/* Ripple effect */}
            <div
              className={`
              absolute inset-0 rounded-full
              bg-white opacity-20
              transform scale-0 transition-transform duration-500
              ${isHovered ? "scale-110" : "scale-0"}
            `}
            />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-20 animate-bounce-slow"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-500 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-5 w-12 h-12 bg-pink-500 rounded-full opacity-20 animate-bounce"></div>
      </div>
    </div>
  );
}

export default App;
