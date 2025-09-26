import { useState, useEffect, useRef } from "react";
import { sendChatMessage } from "./api/chat.js";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [backendStatus, setBackendStatus] = useState({
    status: "checking",
    message: "Checking backend...",
    responseTime: null,
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Social links - you can update these later
  const socialLinks = {
    github: "https://github.com/aayushmaanhooda", // Replace with your GitHub URL
    linkedin: "https://www.linkedin.com/in/aayushmaan-hooda-68ab64194/", // Replace with your LinkedIn URL
    resume: "/resume.pdf", // Replace with your Resume URL
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const testBackendConnection = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch("http://localhost:8000/healthz", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        return {
          status: "online",
          message: "Backend is online",
          responseTime: responseTime,
        };
      } else {
        return {
          status: "offline",
          message: "Backend is not responding",
          responseTime: null,
        };
      }
    } catch (error) {
      return {
        status: "offline",
        message: "Backend is not responding",
        responseTime: null,
      };
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check backend status on component mount
    const checkBackend = async () => {
      const result = await testBackendConnection();
      setBackendStatus(result);
    };
    checkBackend();
  }, []);

  useEffect(() => {
    // Stream the welcome message
    const welcomeText =
      "Hi! I’m Aayushmaan Bot 👋 Spoiler alert: my first reply might be slow (free-tier backend vibes 😅). But once I wake up, we can chat non-stop!";
    let currentText = "";
    let index = 0;

    const streamWelcome = () => {
      if (index < welcomeText.length) {
        currentText += welcomeText[index];
        setMessages([
          {
            id: 1,
            text: currentText,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        index++;
        setTimeout(streamWelcome, 50); // Typing speed
      } else {
        setShowWelcome(false);
        // Focus input after welcome message is complete
        setTimeout(() => inputRef.current?.focus(), 500);
      }
    };

    setTimeout(streamWelcome, 1000); // Delay before starting
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(inputMessage, sessionId);

      // Update session ID if it's the first message
      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.answer,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Update backend status on error
      setBackendStatus({
        status: "offline",
        message: "Backend is not responding",
      });

      const errorMessage = {
        id: Date.now() + 1,
        text:
          backendStatus.status === "offline"
            ? `🔴 Backend is currently down. Please try again later or contact support.`
            : `Sorry, I encountered an error: ${error.message}. Please try again.`,
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50/95 via-stone-50/90 to-slate-50/95 backdrop-blur-lg border-b border-gray-200/70 p-3 sm:p-4 shadow-2xl shadow-gray-400/40 drop-shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between">
          {/* Left side - Bot info */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full blur-sm animate-pulse"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/60">
                <img
                  src="/profile.png"
                  alt="Aayushmaan Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-base sm:text-lg truncate bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Aayushmaan Bot
              </h1>
              <p className="text-gray-700 text-xs sm:text-sm">
                When I'm away, I'm still here.
              </p>
            </div>

            {/* Backend Status Indicator */}
            <button
              onClick={async () => {
                setBackendStatus({
                  status: "checking",
                  message: "Checking backend...",
                });
                const result = await testBackendConnection();
                setBackendStatus(result);
              }}
              className="flex items-center space-x-2 ml-2 hover:bg-gray-100/50 rounded-lg px-2 py-1 transition-colors"
              title="Click to refresh backend status"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  backendStatus.status === "online"
                    ? "bg-green-500 animate-pulse"
                    : backendStatus.status === "offline"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
                }`}
              ></div>
              <span
                className={`text-xs hidden sm:block ${
                  backendStatus.status === "online"
                    ? "text-green-600"
                    : backendStatus.status === "offline"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {backendStatus.status === "online"
                  ? `Online (${backendStatus.responseTime}ms)`
                  : backendStatus.status === "offline"
                  ? "Backend Down"
                  : "Checking..."}
              </span>
            </button>
          </div>

          {/* Right side - Menu */}
          <div className="flex items-center">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50/60 hover:bg-gray-50/80 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-gray-300/60 ring-1 ring-gray-400/20 hover:ring-gray-400/40 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50/60 hover:bg-blue-50/80 transition-all duration-200 text-gray-700 hover:text-gray-900 border border-blue-300/60 ring-1 ring-blue-400/20 hover:ring-blue-400/40 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a
                href={socialLinks.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-white ring-1 ring-purple-400/30 hover:ring-purple-400/50 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Resume</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 border border-gray-300/50 shadow-sm hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50 tap-highlight-transparent"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-300/50">
            <div className="flex flex-col space-y-2">
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 transition-all duration-300 bg-gray-50/30 hover:bg-gray-50/70 shadow-sm hover:shadow-lg hover:shadow-gray-400/40 rounded-lg border border-gray-300/60 ring-1 ring-gray-400/20 hover:ring-gray-400/40"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 transition-all duration-300 bg-blue-50/30 hover:bg-blue-50/70 shadow-sm hover:shadow-lg hover:shadow-blue-400/40 rounded-lg border border-blue-300/60 ring-1 ring-blue-400/20 hover:ring-blue-400/40"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a
                href={socialLinks.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 transition-all duration-300 bg-purple-50/30 hover:bg-purple-50/70 shadow-sm hover:shadow-lg hover:shadow-purple-400/40 rounded-lg border border-purple-300/60 ring-1 ring-purple-400/20 hover:ring-purple-400/40"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Resume</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container with Footer - Combined Background */}
      <div className="flex-1 overflow-hidden flex bg-gradient-to-b from-white/90 via-blue-100/70 to-indigo-100/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto w-full flex flex-col px-2 sm:px-4">
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col justify-end">
            <div className="space-y-3 sm:space-y-4 relative">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start relative ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Background Circle for each message */}
                  <div
                    className={`absolute ${
                      message.sender === "user"
                        ? "-right-4 -top-2 w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-400/20"
                        : "-left-4 -top-2 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-cyan-400/20"
                    } rounded-full blur-xl -z-10 animate-pulse`}
                  ></div>
                  {message.sender === "user" ? (
                    /* User Message Layout - Profile on Right */
                    <>
                      {/* Message Bubble */}
                      <div className="max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg mr-2 sm:mr-3">
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </p>
                        <p className="text-xs opacity-70 mt-1 sm:mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {/* Profile Picture with Background Circle */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-sm animate-pulse"></div>
                        <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-white/50">
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">
                              U
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Bot Message Layout - Profile on Left */
                    <>
                      {/* Profile Picture with Background Circle */}
                      <div className="relative mr-2 sm:mr-3">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-sm animate-pulse"></div>
                        <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-white/50">
                          <img
                            src="/profile.png"
                            alt="Aayushmaan Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                          message.isError
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-gradient-to-r from-slate-100/80 to-blue-100/70 backdrop-blur-sm text-gray-700 border border-slate-300/60 shadow-lg"
                        } shadow-lg`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </p>
                        <p className="text-xs opacity-70 mt-1 sm:mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-2 sm:space-x-3 justify-start relative">
                  {/* Background Circle for Loading */}
                  <div className="absolute -left-4 -top-2 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl -z-10 animate-pulse"></div>
                  {/* Profile Picture for Loading with Background Circle */}
                  <div className="relative mr-2 sm:mr-3">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-sm animate-pulse"></div>
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-white/50">
                      <img
                        src="/profile.png"
                        alt="Aayushmaan Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Loading Bubble */}
                  <div className="bg-gradient-to-r from-slate-100/80 to-blue-100/70 backdrop-blur-sm text-gray-700 border border-slate-300/60 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg">
                    <div className="flex space-x-1 sm:space-x-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-2 sm:p-4 border-t border-blue-200/50">
            <div className="flex space-x-2 sm:space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Aayushmaan..."
                  className="w-full bg-gradient-to-r from-slate-100/80 to-blue-100/70 text-gray-700 placeholder-gray-500 border border-slate-300/60 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-lg text-sm sm:text-base"
                  rows="1"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                  disabled={showWelcome}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || showWelcome}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-1.5 sm:p-2 rounded-full hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer - Now inside the same background container */}
          <div className="border-t border-blue-200/50 py-3 sm:py-4">
            <div className="text-center">
              <div className="mt-1 text-xs text-gray-500">
                © 2025 • Powered by Aayushmaan's AI
              </div>
              <div className="flex items-center justify-center space-x-2 mt-2 text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                    <div
                      className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-pink-500 rounded-full animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements - Enhanced with more bubbles and varied animations */}
      <style jsx>{`
        @keyframes float-left-right {
          0%,
          100% {
            transform: translateX(0px) translateY(0px);
          }
          25% {
            transform: translateX(-20px) translateY(-10px);
          }
          50% {
            transform: translateX(20px) translateY(10px);
          }
          75% {
            transform: translateX(-10px) translateY(-5px);
          }
        }
        @keyframes float-up-down {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-15px) translateX(5px);
          }
          50% {
            transform: translateY(15px) translateX(-5px);
          }
          75% {
            transform: translateY(-8px) translateX(8px);
          }
        }
        @keyframes float-diagonal {
          0%,
          100% {
            transform: translate(0px, 0px);
          }
          25% {
            transform: translate(15px, -15px);
          }
          50% {
            transform: translate(-15px, 15px);
          }
          75% {
            transform: translate(10px, 10px);
          }
        }
        @keyframes float-circular {
          0% {
            transform: translate(0px, 0px);
          }
          25% {
            transform: translate(12px, -12px);
          }
          50% {
            transform: translate(0px, -24px);
          }
          75% {
            transform: translate(-12px, -12px);
          }
          100% {
            transform: translate(0px, 0px);
          }
        }
        .animate-float-lr {
          animation: float-left-right 6s ease-in-out infinite;
        }
        .animate-float-ud {
          animation: float-up-down 5s ease-in-out infinite;
        }
        .animate-float-diagonal {
          animation: float-diagonal 7s ease-in-out infinite;
        }
        .animate-float-circular {
          animation: float-circular 8s ease-in-out infinite;
        }
      `}</style>

      {/* Mobile-visible bouncing bubbles */}
      <div className="fixed top-16 sm:top-20 left-4 sm:left-10 w-8 h-8 sm:w-12 md:w-20 md:h-20 bg-gradient-to-r from-blue-500/50 sm:from-blue-500/60 to-purple-500/50 sm:to-purple-500/60 rounded-full blur-lg sm:blur-xl animate-bounce"></div>
      <div
        className="fixed bottom-16 sm:bottom-20 right-4 sm:right-10 w-6 h-6 sm:w-10 md:w-16 md:h-16 bg-gradient-to-r from-purple-500/50 sm:from-purple-500/60 to-pink-500/50 sm:to-pink-500/60 rounded-full blur-lg sm:blur-xl animate-bounce"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Mobile-visible floating bubbles - Enhanced */}
      <div
        className="fixed top-1/3 right-6 w-7 h-7 sm:w-8 md:w-12 md:h-12 bg-gradient-to-r from-emerald-500/40 sm:from-emerald-500/50 to-teal-500/40 sm:to-teal-500/50 rounded-full blur-md sm:blur-lg animate-float-lr"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="fixed bottom-1/3 left-6 w-4 h-4 sm:w-6 md:w-10 md:h-10 bg-gradient-to-r from-rose-500/40 sm:from-rose-500/50 to-pink-500/40 sm:to-pink-500/50 rounded-full blur-md sm:blur-lg animate-float-ud"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div
        className="fixed top-2/3 left-1/4 w-5 h-5 sm:w-5 md:w-7 md:h-7 bg-gradient-to-r from-cyan-500/40 sm:from-cyan-500/50 to-blue-500/40 sm:to-blue-500/50 rounded-full blur-sm sm:blur-md animate-float-circular"
        style={{ animationDelay: "2.8s" }}
      ></div>
      <div
        className="fixed top-1/4 left-8 w-6 h-6 sm:w-7 md:w-9 md:h-9 bg-gradient-to-r from-amber-500/40 sm:from-amber-500/50 to-orange-500/40 sm:to-orange-500/50 rounded-full blur-md sm:blur-lg animate-float-diagonal"
        style={{ animationDelay: "2.2s" }}
      ></div>
      <div
        className="fixed bottom-1/4 right-8 w-5 h-5 sm:w-5 md:w-7 md:h-7 bg-gradient-to-r from-indigo-500/40 sm:from-indigo-500/50 to-blue-500/40 sm:to-blue-500/50 rounded-full blur-sm sm:blur-md animate-float-circular"
        style={{ animationDelay: "3.5s" }}
      ></div>
      <div
        className="fixed top-1/2 left-4 w-7 h-7 sm:w-8 md:w-10 md:h-10 bg-gradient-to-r from-lime-500/35 sm:from-lime-500/40 to-green-500/35 sm:to-green-500/40 rounded-full blur-md sm:blur-lg animate-float-lr"
        style={{ animationDelay: "4.2s" }}
      ></div>
      <div
        className="fixed top-3/4 right-4 w-4 h-4 sm:w-6 md:w-8 md:h-8 bg-gradient-to-r from-fuchsia-500/35 sm:from-fuchsia-500/40 to-purple-500/35 sm:to-purple-500/40 rounded-full blur-md sm:blur-lg animate-float-ud"
        style={{ animationDelay: "5.1s" }}
      ></div>
      <div
        className="fixed bottom-1/6 left-1/3 w-5 h-5 sm:w-5 md:w-7 md:h-7 bg-gradient-to-r from-sky-500/35 sm:from-sky-500/40 to-cyan-500/35 sm:to-cyan-500/40 rounded-full blur-sm sm:blur-md animate-float-diagonal"
        style={{ animationDelay: "5.8s" }}
      ></div>
      <div
        className="fixed top-1/6 right-1/3 w-4 h-4 sm:w-6 md:w-8 md:h-8 bg-gradient-to-r from-red-500/35 sm:from-red-500/40 to-pink-500/35 sm:to-pink-500/40 rounded-full blur-md sm:blur-lg animate-float-circular"
        style={{ animationDelay: "0.8s" }}
      ></div>
      <div
        className="fixed top-5/6 left-1/5 w-5 h-5 sm:w-4 md:w-6 md:h-6 bg-gradient-to-r from-violet-500/35 sm:from-violet-500/40 to-indigo-500/35 sm:to-indigo-500/40 rounded-full blur-sm sm:blur-md animate-float-lr"
        style={{ animationDelay: "6.5s" }}
      ></div>
      <div
        className="fixed top-1/5 left-2/3 w-6 h-6 sm:w-6 md:w-8 md:h-8 bg-gradient-to-r from-teal-500/35 sm:from-teal-500/40 to-emerald-500/35 sm:to-emerald-500/40 rounded-full blur-md sm:blur-lg animate-float-ud"
        style={{ animationDelay: "1.2s" }}
      ></div>
      <div
        className="fixed bottom-2/3 right-1/4 w-5 h-5 sm:w-5 md:w-7 md:h-7 bg-gradient-to-r from-orange-500/35 sm:from-orange-500/40 to-red-500/35 sm:to-red-500/40 rounded-full blur-sm sm:blur-md animate-float-diagonal"
        style={{ animationDelay: "3.8s" }}
      ></div>

      {/* Desktop-only floating bubbles - Reduced */}
      <div
        className="hidden md:block fixed top-1/4 left-1/3 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 rounded-full blur-lg animate-float-lr"
        style={{ animationDelay: "0.5s" }}
      ></div>
      <div
        className="hidden lg:block fixed top-1/2 left-1/5 w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-r from-amber-500/50 to-orange-500/50 rounded-full blur-lg animate-float-diagonal"
        style={{ animationDelay: "2.5s" }}
      ></div>
      <div
        className="hidden xl:block fixed top-1/6 right-1/5 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-fuchsia-500/40 to-purple-500/40 rounded-full blur-md animate-float-ud"
        style={{ animationDelay: "5.5s" }}
      ></div>
      <div
        className="hidden xl:block fixed bottom-1/6 right-2/5 w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-r from-sky-500/40 to-cyan-500/40 rounded-full blur-md animate-float-diagonal"
        style={{ animationDelay: "6s" }}
      ></div>

      {/* Original positioned bubbles with new animations */}
      <div
        className="hidden md:block fixed top-1/2 right-2 sm:right-5 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500/60 to-orange-500/60 rounded-full blur-xl animate-float-ud"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="hidden lg:block fixed top-1/3 left-1/4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-500/50 to-blue-500/50 rounded-full blur-lg animate-float-circular"
        style={{ animationDelay: "3s" }}
      ></div>
      <div
        className="hidden lg:block fixed bottom-1/3 right-1/4 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-violet-500/50 to-purple-500/50 rounded-full blur-lg animate-float-diagonal"
        style={{ animationDelay: "4s" }}
      ></div>
    </div>
  );
}

export default App;
