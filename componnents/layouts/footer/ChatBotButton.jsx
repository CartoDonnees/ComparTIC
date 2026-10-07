import DefaultLoader from "@/componnents/Loader/DefaultLoader";
import { getChatBotAnswer } from "@/services/api/assistant/chatbotApiService";
import { formatWordLikeText } from "@/services/tools/helper";
import React, { useEffect, useRef, useState } from "react";

export default function ChatBotButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Bonjour 👋 Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");

  const [lexiaQuery, setLexiaQuery] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [iaResult, setIaResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
    }
  }, [open]);

  useEffect(() => {
    setLexiaQuery({
      question: null,
      history: [
        {
          role: "assistant",
          content: "Bonjour 👋 Comment puis-je vous aider ?",
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (iaResult) {
      const _lexiQuery = addToHistory(lexiaQuery, "assistant", iaResult?.data);
      // const _lexiQuery = addToHistory(
      //   lexiaQuery,
      //   "assistant",
      //   JSON.parse(iaRes)?.data
      // );
      setLexiaQuery(_lexiQuery);
      setIsLoading(false);
    }
  }, [iaResult]);

  useEffect(() => {
    scrollToBottom();
  }, [lexiaQuery]);

  const addToHistory = (prevObject, role, content) => {
    return {
      question: content,
      history: [
        ...(prevObject.history || []),
        {
          role,
          content: content ? content : "",
        },
      ],
    };
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur de copie :", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const _lexiQuery = addToHistory(lexiaQuery, "user", input);

    setLexiaQuery(_lexiQuery);
    setInput("");
    setIsLoading(true);

    const _result = await getChatBotAnswer(_lexiQuery);
    setIaResult(_result);
    
    // setTimeout(() => {
    //   const _result =
    //     `<div> Une offre de service, également appelée Offre de souscription (forfait/bundle/Package),
    // est une formule tarifaire qui donne droit à un ou plusieurs volumes de communications en contrepartie
    // du paiement d'un montant (tarif forfaitaire) fixé et utilisable sur une durée et/ou une période.</div>` +
    //     Date.now();
    //   setIaResult(_result);
    // }, 2000);

    // setLexiaQuery({
    //   question: "Bonjour 👋 Comment puis-je vous aider ?",
    //   history: [
    //     {
    //       role: "user",
    //       content: input,
    //     },
    //     {
    //       role: "assistant",
    //       content: null,
    //     },
    //   ],
    // });
    // setInput("");

    // const userMessage = { from: "user", text: input };

    // setMessages((prev) => [...prev, userMessage]);

    // Réponse automatique simulée
    // setTimeout(() => {
    //   setMessages((prev) => [
    //     ...prev,
    //     {
    //       from: "bot",
    //       text: "Merci pour votre message. Nous vous répondrons bientôt 😊",
    //     },
    //   ]);
    // }, 800);
  };

  useEffect(() => {
    scrollToBottom();
  }, [lexiaQuery]);

  return (
    <>
      <div className="chatbot-container">
        {!open && (
          <>
            <span className="chatbot-tooltip">Besoin d'aide 💡</span>
          </>
        )}

        <button
          className="chatbot-button pulse"
          aria-label="Chatbot"
          onClick={() => setOpen(true)}
        >
          <div className="icon-container">
            {/* <i className="bi bi-chat-text-fill icon-bot"></i> */}
            <i className="bi bi-robot icon-bot"></i>
          </div>
        </button>
      </div>
      {open && (
        <div className="chat-box">
          <div className="chat-header">
            Assistant virtuel
            <span
              className="text-white"
              onClick={() => setOpen(false)}
              style={{ color: "white" }}
            >
              <i className="bi bi-x-lg"></i>
            </span>
          </div>

          <div className="chat-messages">
            {lexiaQuery?.history.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatWordLikeText(msg.content),
                  }}
                />
              </div>
            ))}
            {isLoading && (
              <>
                <DefaultLoader
                  size={20}
                  titleSize={12}
                  color="green"
                  title="En cours de réflexion..."
                  titleColor="green"
                />
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Écrivez un message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading}
            />
            <button onClick={() => sendMessage()}>➤ </button>
          </div>
        </div>
      )}
    </>
  );
}
