import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useApi } from "../lib/api";
import { ChatTurn, DayChatResponse, DayContent, DayPlan, contentOf, formatDate } from "../lib/trips";
import { accentFor } from "./DayTile";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  updatedDay?: boolean; // this reply changed the day
}

// Kept by the board per day, so reopening a day's chat picks up where it left off
export interface DayChatState {
  messages: ChatMessage[];
  undoStack: DayContent[]; // day contents before each AI change
}

export const emptyChatState: DayChatState = { messages: [], undoStack: [] };

const suggestions = [
  "Make this day more relaxed",
  "Swap dinner for somewhere cheaper",
  "Add a coffee stop in the morning",
  "Find a hotel closer to these activities",
];

const errorMessage = (err: unknown) => {
  const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
  return typeof detail === "string" ? detail : "Sorry, something went wrong. Please try again.";
};

interface DayChatPanelProps {
  tripId: string;
  day: DayPlan;
  chat: DayChatState;
  onChatChange: (chat: DayChatState) => void;
  onDayUpdated: (day: DayPlan) => void;
  onClose: () => void;
}

const DayChatPanel: React.FC<DayChatPanelProps> = ({ tripId, day, chat, onChatChange, onDayUpdated, onClose }) => {
  const api = useApi();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Latest chat state, so async handlers don't append to a stale copy
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const addMessage = (message: Omit<ChatMessage, "id">, undoStack = chatRef.current.undoStack) =>
    onChatChange({
      messages: [...chatRef.current.messages, { id: crypto.randomUUID(), ...message }],
      undoStack,
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, busy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [day.day]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;

    const history: ChatTurn[] = chatRef.current.messages.map(({ role, text }) => ({ role, text }));
    const before = contentOf(day);
    addMessage({ role: "user", text: message });
    setInput("");
    setBusy(true);
    try {
      const res = await api.post<DayChatResponse>(`/api/trips/${tripId}/days/${day.day}/chat`, { message, history });
      if (res.data.updated) onDayUpdated(res.data.day);
      addMessage(
        { role: "assistant", text: res.data.reply, updatedDay: res.data.updated },
        res.data.updated ? [...chatRef.current.undoStack, before] : chatRef.current.undoStack,
      );
    } catch (err) {
      console.error("Day chat failed:", err);
      addMessage({ role: "assistant", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    const stack = chatRef.current.undoStack;
    const previous = stack[stack.length - 1];
    if (!previous || busy) return;
    setBusy(true);
    try {
      const res = await api.put<DayPlan>(`/api/trips/${tripId}/days/${day.day}`, previous);
      onDayUpdated(res.data);
      addMessage({ role: "assistant", text: "Undid the last change.", updatedDay: true }, stack.slice(0, -1));
    } catch (err) {
      console.error("Undo failed:", err);
      addMessage({ role: "assistant", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl shadow-slate-900/30 border-l border-slate-200 flex flex-col">
      <div className={`${accentFor(day.day)} text-white px-5 py-4 flex items-start justify-between gap-3`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            ✨ Editing Day {day.day}
            {day.date && ` · ${formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}`}
          </p>
          <h3 className="mt-1 font-bold leading-snug">{day.title}</h3>
        </div>
        <button onClick={onClose} aria-label="Close chat" className="text-white/80 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-3">
        <div className="flex justify-start">
          <div className="max-w-[85%] px-3.5 py-2.5 rounded-md text-sm bg-white text-slate-700 border border-slate-200">
            What would you like to change about Day {day.day}? I can swap activities, restaurants or your hotel, change the
            pace, or answer questions about the day.
          </div>
        </div>

        {chat.messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={busy}
                className="text-xs font-medium text-indigo-800 bg-white border border-indigo-200 rounded-full px-3 py-1.5 hover:border-indigo-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {chat.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-md text-sm leading-relaxed ${
                msg.role === "user" ? "bg-indigo-800 text-white" : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
              {msg.updatedDay && (
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">✓ Day updated</p>
              )}
            </div>
          </div>
        ))}

        {busy && (
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

      <div className="border-t border-slate-200 p-4 space-y-2">
        {chat.undoStack.length > 0 && (
          <button onClick={undo} disabled={busy} className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50">
            ↶ Undo last change
          </button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder="e.g. Make dinner vegetarian"
            className="flex-1 border border-slate-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-800 focus:border-indigo-800"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="bg-indigo-800 text-white font-medium px-4 py-2.5 rounded-md shadow-md shadow-indigo-800/30 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </aside>
  );
};

export default DayChatPanel;
