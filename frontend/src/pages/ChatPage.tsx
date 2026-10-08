import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useApi } from "../lib/api";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

type ModalStep = "choice" | "customize" | null;

const paceOptions = ["Adventurous", "Laid back", "A mix of both"];

const ChatPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const api = useApi();
  const destination = (location.state as { destination?: string })?.destination || "your trip";

  const [modalStep, setModalStep] = useState<ModalStep>("choice");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Customize form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pace, setPace] = useState("");
  const [groupSize, setGroupSize] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const pushBotResponse = async (userText: string, contextOverride?: string) => {
    setIsTyping(true);
    try {
      const res = await api.post("/api/chat", {
        message: userText,
        destination,
        context: contextOverride,
      });
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "bot", text: res.data.reply },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: "Sorry, something went wrong reaching the assistant. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUseProfile = () => {
    const saved = localStorage.getItem("travelProfile");

    if (!saved) {
      setMessages([
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: `Looks like you haven't built a Travel Profile yet. Head to "Travel Profile" in the nav to set your preferences, or choose "Customize This Trip" instead.`,
        },
      ]);
      setModalStep(null);
      return;
    }

    const profile = JSON.parse(saved);
    const summary = `Plan a trip to ${destination} using my travel profile — Name: ${profile.name || "N/A"}, Trips/year: ${profile.tripsPerYear || "N/A"}, Ideal trip length: ${profile.tripLength || "N/A"}, Travels with: ${profile.travelWith || "N/A"}, Pace: ${profile.pace || "N/A"}, Budget: ${profile.budget || "N/A"}, Accommodation: ${profile.accommodation || "N/A"}, Vacation goals: ${(profile.vacationGoals || []).join(", ") || "N/A"}.`;

    setMessages([
      { id: crypto.randomUUID(), sender: "user", text: summary },
    ]);
    setModalStep(null);
    pushBotResponse(summary, summary);
  };

  const handleCustomizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const summary = `Plan a trip to ${destination} — Dates: ${startDate || "N/A"} to ${endDate || "N/A"}, Pace: ${pace || "N/A"}, Group size: ${groupSize || "N/A"}.`;

    setMessages([
      { id: crypto.randomUUID(), sender: "user", text: summary },
    ]);
    setModalStep(null);
    pushBotResponse(summary, summary);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "user", text: trimmed }]);
    setInput("");
    pushBotResponse(trimmed);
  };

  return (
    <div className="relative max-w-3xl mx-auto px-4 py-8 h-[calc(100vh-72px)] flex flex-col">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Planning: <span className="text-indigo-800">{destination}</span>
      </h2>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-md border border-slate-200 px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-md text-sm leading-relaxed ${
                msg.sender === "user"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
            >
            {msg.sender === "bot" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
            ) : (
                msg.text
            )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-3.5 py-2.5 rounded-md flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={modalStep !== null}
          className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800 transition-all disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || modalStep !== null}
          className="bg-indigo-800 text-white font-medium px-5 py-2.5 rounded-md shadow-md shadow-indigo-800/30 hover:bg-indigo-800 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      {/* Modal */}
      {modalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-md shadow-lg shadow-slate-900/30 w-full max-w-md p-6">
            {modalStep === "choice" && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Plan your trip to {destination}
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  How would you like to build this itinerary?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleUseProfile}
                    className="w-full bg-indigo-800 text-white font-semibold px-5 py-3 rounded-md shadow-md shadow-indigo-800/30 hover:bg-indigo-800 transition-all duration-150"
                  >
                    Use My Travel Profile
                  </button>
                  <button
                    onClick={() => setModalStep("customize")}
                    className="w-full bg-white text-slate-700 font-semibold px-5 py-3 rounded-md border border-slate-300 hover:border-slate-400 transition-all duration-150"
                  >
                    Customize This Trip
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="text-sm text-slate-400 hover:text-slate-600 mt-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalStep === "customize" && (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Customize your trip
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Answer a few quick questions to get started.
                </p>
                <form onSubmit={handleCustomizeSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-slate-300 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-slate-300 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Adventurous or laid back?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {paceOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPace(opt)}
                          className={`px-3.5 py-2 rounded-md text-sm font-medium border transition-all duration-150 ${
                            pace === opt
                              ? "bg-indigo-800 text-white border-indigo-800"
                              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">How many people?</label>
                    <input
                      type="number"
                      min={1}
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full border border-slate-300 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep("choice")}
                      className="flex-1 bg-white text-slate-700 font-medium px-4 py-2.5 rounded-md border border-slate-300 hover:border-slate-400 transition-all duration-150"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-800 text-white font-semibold px-4 py-2.5 rounded-md shadow-md shadow-indigo-800/30 hover:bg-indigo-800 transition-all duration-150"
                    >
                      Start Planning
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;