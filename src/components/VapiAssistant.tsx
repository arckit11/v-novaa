import React, { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { useVoiceCommandHandlers } from "./useVoiceCommandHandlers";
import { useLanguage } from "@/context/LanguageContext";

const VapiAssistantComponent = () => {
  const { t, language } = useLanguage();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const mouseDownStartRef = useRef<{ x: number, y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const vapiRef = useRef<any>(null);
  const { processVoiceCommand } = useVoiceCommandHandlers();
  const wasActiveBeforeLanguageChange = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isInitialMountRef = useRef(true);
  const isLanguageChangeInProgress = useRef(false);

  const getAssistantId = () => {
    // Select Assistant ID based on current language
    const id = language === 'ar'
      ? import.meta.env.VITE_VAPI_ASSISTANT_ID_AR
      : import.meta.env.VITE_VAPI_ASSISTANT_ID;
    return id;
  };

  // Use a ref to always keep the latest version of processVoiceCommand
  // preventing stale closures in the Vapi event listener
  const processVoiceCommandRef = useRef(processVoiceCommand);

  useEffect(() => {
    processVoiceCommandRef.current = processVoiceCommand;
  }, [processVoiceCommand]);

  // Debugging Instance ID
  const instanceId = useRef(Math.random().toString(36).substring(7)).current;

  // Re-initialize Vapi when language changes
  useEffect(() => {
    // Initialize position on client-side mount (only once)
    if (!vapiRef.current) {
      setPosition({ x: 24, y: window.innerHeight - 80 });
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Track if call was active before language change
    const wasActive = isSessionActive;
    wasActiveBeforeLanguageChange.current = wasActive;

    // Mark that we're in the middle of a language change to prevent unwanted reconnections
    const isLanguageChange = !isInitialMountRef.current && vapiRef.current !== null;
    isLanguageChangeInProgress.current = isLanguageChange;

    console.log(`[VapiAssistant ${instanceId}] CONF UPDATE - Language: ${language} - Path: ${window.location.pathname} - WasActive: ${wasActive} - IsLanguageChange: ${isLanguageChange}`);

    // Select API Key based on language
    const API_KEY = language === 'ar'
      ? import.meta.env.VITE_VAPI_API_KEY_AR
      : import.meta.env.VITE_VAPI_API_KEY;

    if (!API_KEY) {
      console.error(`Missing Vapi API Key for language: ${language}`);
      return;
    }

    // Cleanup previous instance if it exists to strictly prevent duplicates
    if (vapiRef.current) {
      try {
        // Only stop if call was active (preserve state if it wasn't)
        if (wasActive) {
          console.log(`[VapiAssistant ${instanceId}] Stopping previous call due to language change`);
        }
        vapiRef.current.stop();
        vapiRef.current = null;
      } catch (e) {
        console.warn("Error stopping previous Vapi instance:", e);
      }
    }

    const vapi = new Vapi(API_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      console.log(`[VapiAssistant ${instanceId}] Call started`);
      setIsSessionActive(true);
      setIsSpeechActive(false);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful start
    });

    vapi.on("call-end", () => {
      console.log(`[VapiAssistant ${instanceId}] Call ended`);
      setIsSessionActive(false);
      setIsSpeechActive(false);

      // Don't attempt to reconnect if we're in the middle of a language change
      // (the new instance will be started automatically)
      if (isLanguageChangeInProgress.current) {
        console.log(`[VapiAssistant ${instanceId}] Call ended due to language change, skipping reconnection`);
        isLanguageChangeInProgress.current = false;
        reconnectAttemptsRef.current = 0;
        return;
      }

      // Attempt to reconnect if the call was active and ended unexpectedly
      // Only reconnect if it wasn't manually stopped and we haven't exceeded max attempts
      if (wasActiveBeforeLanguageChange.current && reconnectAttemptsRef.current < 3) {
        console.log(`[VapiAssistant ${instanceId}] Attempting to reconnect (attempt ${reconnectAttemptsRef.current + 1}/3)...`);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          const assistantId = getAssistantId();
          if (assistantId && vapiRef.current) {
            vapiRef.current.start(assistantId).catch((error: any) => {
              console.error(`[VapiAssistant ${instanceId}] Reconnection failed:`, error);
            });
          }
        }, 2000); // Wait 2 seconds before reconnecting
      } else {
        reconnectAttemptsRef.current = 0; // Reset if manually stopped or max attempts reached
      }
    });

    vapi.on("speech-start", () => {
      setIsSpeechActive(true);
    });

    vapi.on("speech-end", () => {
      setIsSpeechActive(false);
    });

    vapi.on("error", (error: any) => {
      console.error(`[VapiAssistant ${instanceId}] Vapi Error:`, JSON.stringify(error, null, 2));

      const errorMsg = error?.error?.msg || error?.message || "Unknown error";

      // Handle known startup errors
      // expanded check to catch more variations of ejection or auth errors
      if (
        (error?.type === 'daily-error') ||
        (errorMsg.includes('ejection')) ||
        (errorMsg.includes('401'))
      ) {
        console.error("CRITICAL: Vapi connection rejected/failed. Checking credentials...");
        reconnectAttemptsRef.current = 999; // Prevent reconnection attempts
        setIsSessionActive(false);
        setIsSpeechActive(false);

        // If we are in the reconnection loop, kill it
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        return;
      }

      setIsSessionActive(false);
      setIsSpeechActive(false);

      // Attempt to reconnect on non-auth errors
      if (reconnectAttemptsRef.current < 3) {
        console.log(`[VapiAssistant ${instanceId}] Attempting to reconnect after error (attempt ${reconnectAttemptsRef.current + 1}/3)...`);
        reconnectAttemptsRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          const assistantId = getAssistantId();
          if (assistantId && vapiRef.current) {
            vapiRef.current.start(assistantId).catch((err: any) => {
              console.error(`[VapiAssistant ${instanceId}] Reconnection after error failed:`, err);
            });
          }
        }, 3000); // Wait 3 seconds before reconnecting after error
      }
    });

    // Listen for transcripts instead of tool calls
    vapi.on("message", async (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const transcriptText = message.transcript;
        console.log(`[VapiAssistant ${instanceId}] Final transcript:`, transcriptText);

        // Pass the transcript to our restored client-side Gemini logic
        if (transcriptText) {
          await processVoiceCommandRef.current(transcriptText);
        }
      }
    });

    const assistantId = getAssistantId();
    if (assistantId) {
      // Auto-start on initial mount, or if call was active before language change
      const shouldAutoStart = isInitialMountRef.current || wasActive;

      if (shouldAutoStart) {
        console.log(`[VapiAssistant ${instanceId}] Auto-starting session with ID: ${assistantId.slice(0, 8)}...`);
        // Add a small delay to ensure cleanup of previous instance is fully processed by browser audio engine
        // Use longer delay for language changes to ensure clean transition
        const delay = isLanguageChange ? 300 : 100;
        setTimeout(() => {
          // Clear the language change flag before starting
          isLanguageChangeInProgress.current = false;
          vapi.start(assistantId).catch((error: any) => {
            console.error(`[VapiAssistant ${instanceId}] Failed to auto-start Vapi:`, error);
            setIsSessionActive(false);
            // Reset reconnect attempts on initial start failure
            if (isInitialMountRef.current) {
              reconnectAttemptsRef.current = 0;
            }
          });
        }, delay);
      } else {
        console.log(`[VapiAssistant ${instanceId}] Skipping auto-start (call was not active)`);
        // Clear the language change flag if we're not auto-starting
        isLanguageChangeInProgress.current = false;
      }

      // Mark initial mount as complete
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
      }
    }

    return () => {
      console.log(`[VapiAssistant ${instanceId}] CLEANUP - Language: ${language}`);

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        if (vapiRef.current) {
          vapiRef.current.stop();
        }
      } catch (e) {
        // Ignore stop errors on unmount
      }
      vapiRef.current = null;
    };
  }, [language]); // Re-run when language changes

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      // Calculate new position
      let newX = clientX - dragStartRef.current.x;
      let newY = clientY - dragStartRef.current.y;

      // Simple boundary checking to keep it somewhat on screen
      const boundsPadding = 10;
      const maxX = window.innerWidth - 60; // 60 is approx width
      const maxY = window.innerHeight - 60;

      newX = Math.max(boundsPadding, Math.min(newX, maxX));
      newY = Math.max(boundsPadding, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });

      // Check if moved more than a threshold to consider it a drag
      if (mouseDownStartRef.current) {
        const dist = Math.hypot(clientX - mouseDownStartRef.current.x, clientY - mouseDownStartRef.current.y);
        if (dist > 5) {
          hasMovedRef.current = true;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      mouseDownStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragStartRef.current = { x: clientX - position.x, y: clientY - position.y };
    mouseDownStartRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
    hasMovedRef.current = false;
  };

  const toggleCall = (e: React.MouseEvent) => {
    // Prevent toggle if we just dragged
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const vapi = vapiRef.current;
    if (!vapi) return;

    if (isSessionActive) {
      // Clear any pending reconnection attempts when manually stopping
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttemptsRef.current = 999; // Prevent auto-reconnection when manually stopped
      wasActiveBeforeLanguageChange.current = false;
      vapi.stop();
    } else {
      // Reset reconnect attempts when manually starting
      reconnectAttemptsRef.current = 0;
      wasActiveBeforeLanguageChange.current = true;

      const assistantId = getAssistantId();
      if (!assistantId) {
        console.error("No Assistant ID found for current language");
        return;
      }
      // Start WITHOUT tool definitions, just plain Vapi for STT
      vapi.start(assistantId).catch((err: any) => {
        console.error("Failed to start Vapi session:", err);
        setIsSessionActive(false);
      });
    }
  };


  return (
    <div
      className="fixed z-50 touch-none"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      <button
        className={`flex items-center justify-center rounded-full w-14 h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg transition-all duration-300 ${isDragging ? "cursor-grabbing scale-105" : "cursor-grab"} ${isSessionActive ? "shadow-xl ring-2 ring-white/30" : "shadow-md"
          }`}
        onClick={toggleCall}
        aria-label={t('intro.subtitle')}
        title={isSessionActive ? t('voice.end') : t('voice.start')}
        style={{
          transform: "scale(1)",
        }}
      >
        {isSessionActive ? (
          <div className="relative h-6 w-12 flex items-center justify-center">
            {/* Simple Active Animation */}
            <div className={`w-3 h-3 bg-white rounded-full mx-1 ${isSpeechActive ? "animate-bounce" : ""}`} style={{ animationDelay: "0s" }}></div>
            <div className={`w-3 h-3 bg-white rounded-full mx-1 ${isSpeechActive ? "animate-bounce" : ""}`} style={{ animationDelay: "0.1s" }}></div>
            <div className={`w-3 h-3 bg-white rounded-full mx-1 ${isSpeechActive ? "animate-bounce" : ""}`} style={{ animationDelay: "0.2s" }}></div>
          </div>
        ) : (
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" x2="12" y1="19" y2="22"></line>
            </svg>
            <div className="absolute inset-0 rounded-full border-2 border-white/50 mic-pulse" />
          </div>
        )}
      </button>

      {/* Add CSS animations for the mic animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes voicePulse {
          0%, 100% { height: 5px; }
          50% { height: 15px; }
        }
        .mic-bar {
          animation: voicePulse 0.8s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        .mic-pulse {
          animation: pulse 2s infinite;
        }
      `,
        }}
      />
      {/* Debug Info */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
        ID: ...{getAssistantId()?.slice(-4) || 'None'}
      </div>
    </div>
  );
};

export const VapiAssistant = React.memo(VapiAssistantComponent);
