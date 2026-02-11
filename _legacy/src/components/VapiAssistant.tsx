import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Vapi from "@vapi-ai/web";
import { useVoiceCommandHandlers } from "./useVoiceCommandHandlers";
import { useLanguage } from "@/context/LanguageContext";

const VapiAssistantComponent = () => {
  const { t } = useLanguage();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 0 }); // Static default for hydration safety
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const mouseDownStartRef = useRef<{ x: number, y: number } | null>(null);
  const hasMovedRef = useRef(false);

  const vapiRef = useRef<any>(null);
  const location = useLocation();
  const { processVoiceCommand, startCheckoutFlow, checkoutFlow, speak, registerSpeakCallback } = useVoiceCommandHandlers();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isInitialMountRef = useRef(true);
  const wasActiveRef = useRef(false);
  const hasStartedCheckoutFlowRef = useRef(false);
  const isAssistantSpeakingRef = useRef(false);
  const lastSpeechEndTimeRef = useRef(0);
  const speechStartTimeRef = useRef(0);
  const echoGuardDurationRef = useRef(4000); // Dynamic echo guard duration in ms

  const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

  // Use a ref to always keep the latest version of processVoiceCommand
  // preventing stale closures in the Vapi event listener
  const processVoiceCommandRef = useRef(processVoiceCommand);

  useEffect(() => {
    processVoiceCommandRef.current = processVoiceCommand;
  }, [processVoiceCommand]);

  // Debugging Instance ID
  const instanceId = useRef(Math.random().toString(36).substring(7)).current;

  // Handle position on resize (hydration-safe)
  useEffect(() => {
    const updatePosition = () => setPosition({ x: 24, y: window.innerHeight - 80 });
    window.addEventListener('resize', updatePosition);
    updatePosition(); // Set initial position after mount
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  // Register speak callback to use Vapi's say function
  useEffect(() => {
    registerSpeakCallback((text: string) => {
      console.log(`[VapiAssistant] Speaking: ${text}`);
      if (vapiRef.current && isSessionActive) {
        // Mark that we're about to speak to prevent echo
        isAssistantSpeakingRef.current = true;
        speechStartTimeRef.current = Date.now();
        lastSpeechEndTimeRef.current = 0; // Reset to allow the echo buffer to work

        // Calculate dynamic echo guard based on text length
        // Rough estimate: ~150ms per word spoken
        const wordCount = text.split(/\s+/).length;
        const estimatedSpeechDuration = Math.max(wordCount * 150, 2000);
        echoGuardDurationRef.current = estimatedSpeechDuration + 3000; // speech duration + 3s buffer
        console.log(`[VapiAssistant] Echo guard set to ${echoGuardDurationRef.current}ms for ${wordCount} words`);

        // Use Vapi's send method to make the assistant speak
        vapiRef.current.send({
          type: "add-message",
          message: {
            role: "system",
            content: `Say this to the user: "${text}"`
          }
        });
      }
    });
  }, [registerSpeakCallback, isSessionActive]);

  // Auto-start checkout flow when navigating to payment page
  useEffect(() => {
    if (location.pathname === "/payment" && isSessionActive && !hasStartedCheckoutFlowRef.current) {
      console.log("[VapiAssistant] On payment page - starting guided checkout flow");
      hasStartedCheckoutFlowRef.current = true;

      // Delay slightly to ensure page is rendered
      setTimeout(() => {
        const prompt = startCheckoutFlow();
        speak(prompt);
      }, 1500);
    }

    // Reset flag when leaving payment page
    if (location.pathname !== "/payment") {
      hasStartedCheckoutFlowRef.current = false;
    }
  }, [location.pathname, isSessionActive, startCheckoutFlow, speak]);

  // Initialize Vapi
  useEffect(() => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log(`[VapiAssistant ${instanceId}] CONF UPDATE - Path: ${window.location.pathname}`);

    const API_KEY = import.meta.env.VITE_VAPI_API_KEY;

    if (!API_KEY) {
      console.error("Missing VITE_VAPI_API_KEY");
      return;
    }

    // Cleanup previous instance if it exists to strictly prevent duplicates
    if (vapiRef.current) {
      try {
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
      wasActiveRef.current = true; // Mark as active so reconnection works
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful start
    });

    vapi.on("call-end", () => {
      console.log(`[VapiAssistant ${instanceId}] Call ended`);
      setIsSessionActive(false);
      setIsSpeechActive(false);

      // Automatically reconnect if the call was active and unexpectedly ended
      // No limit on reconnection attempts - keep the call alive throughout the session
      if (wasActiveRef.current) {
        console.log(`[VapiAssistant ${instanceId}] Call unexpectedly ended, attempting to reconnect...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (ASSISTANT_ID && vapiRef.current) {
            vapiRef.current.start(ASSISTANT_ID).catch((error: any) => {
              console.error(`[VapiAssistant ${instanceId}] Reconnection failed:`, error);
              // Try again after a delay
              if (wasActiveRef.current) {
                reconnectTimeoutRef.current = setTimeout(() => {
                  if (ASSISTANT_ID && vapiRef.current) {
                    vapiRef.current.start(ASSISTANT_ID).catch(() => { });
                  }
                }, 3000);
              }
            });
          }
        }, 1000); // Wait 1 second before reconnecting
      }
    });

    vapi.on("speech-start", () => {
      setIsSpeechActive(true);
      isAssistantSpeakingRef.current = true;
      speechStartTimeRef.current = Date.now();
      console.log(`[VapiAssistant ${instanceId}] Assistant started speaking`);
    });

    vapi.on("speech-end", () => {
      setIsSpeechActive(false);
      lastSpeechEndTimeRef.current = Date.now();

      // Calculate how long the assistant was speaking
      const speechDuration = Date.now() - speechStartTimeRef.current;
      // Set echo guard: longer speech = longer echo guard (min 3s, max 8s)
      const dynamicGuard = Math.min(Math.max(speechDuration + 2000, 3000), 8000);
      echoGuardDurationRef.current = dynamicGuard;

      console.log(`[VapiAssistant ${instanceId}] Assistant spoke for ${speechDuration}ms, echo guard: ${dynamicGuard}ms`);

      // Delay clearing the speaking flag based on dynamic guard
      setTimeout(() => {
        isAssistantSpeakingRef.current = false;
        console.log(`[VapiAssistant ${instanceId}] Echo guard cleared after ${dynamicGuard}ms`);
      }, dynamicGuard);
    });

    vapi.on("error", (error: any) => {
      console.error(`[VapiAssistant ${instanceId}] Vapi Error:`, JSON.stringify(error, null, 2));

      const errorMsg = error?.error?.msg || error?.error?.errorMsg || error?.message || "Unknown error";
      const errorType = error?.type || error?.error?.type || "";

      // Handle critical auth errors - only stop on actual auth failures
      if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('invalid api key')) {
        console.error("CRITICAL: Vapi authentication failed. Please check your API key.");
        setIsSessionActive(false);
        setIsSpeechActive(false);
        wasActiveRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        return;
      }

      setIsSessionActive(false);
      setIsSpeechActive(false);

      // Handle meeting ejection/ended - this is common and we should always reconnect
      const isEjectionError = errorType === 'daily-error' ||
        errorMsg.toLowerCase().includes('ejection') ||
        errorMsg.toLowerCase().includes('meeting has ended') ||
        errorMsg.toLowerCase().includes('ejected');

      if (isEjectionError) {
        console.log(`[VapiAssistant ${instanceId}] Meeting ejection detected, will reconnect...`);
      } else {
        console.log(`[VapiAssistant ${instanceId}] Non-critical error, will attempt reconnection...`);
      }

      // Always reconnect if the call was supposed to be active
      if (wasActiveRef.current) {
        // Clear any existing reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Use shorter delay for ejection errors since they're expected
        const reconnectDelay = isEjectionError ? 1500 : 3000;

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[VapiAssistant ${instanceId}] Attempting reconnection...`);
          if (ASSISTANT_ID && vapiRef.current && wasActiveRef.current) {
            vapiRef.current.start(ASSISTANT_ID).then(() => {
              console.log(`[VapiAssistant ${instanceId}] Reconnection successful!`);
            }).catch((err: any) => {
              console.error(`[VapiAssistant ${instanceId}] Reconnection failed:`, err);
              // Retry with exponential backoff
              if (wasActiveRef.current) {
                const retryDelay = Math.min(reconnectDelay * 2, 10000);
                console.log(`[VapiAssistant ${instanceId}] Will retry in ${retryDelay}ms...`);
                reconnectTimeoutRef.current = setTimeout(() => {
                  if (ASSISTANT_ID && vapiRef.current && wasActiveRef.current) {
                    vapiRef.current.start(ASSISTANT_ID).catch(() => {
                      // Keep trying with longer delays
                      if (wasActiveRef.current) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                          if (ASSISTANT_ID && vapiRef.current && wasActiveRef.current) {
                            vapiRef.current.start(ASSISTANT_ID).catch(() => { });
                          }
                        }, 15000);
                      }
                    });
                  }
                }, retryDelay);
              }
            });
          }
        }, reconnectDelay);
      }
    });

    // Listen for transcripts instead of tool calls
    // Only process USER transcripts to prevent echo from assistant's own voice
    vapi.on("message", async (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const transcriptText = message.transcript;
        const role = message.role;

        console.log(`[VapiAssistant ${instanceId}] Final transcript (role: ${role}):`, transcriptText);

        // Only process user transcripts, ignore assistant/bot transcripts
        if (role !== "user") {
          console.log(`[VapiAssistant ${instanceId}] Ignoring non-user transcript (role: ${role})`);
          return;
        }

        // Skip if assistant is currently speaking (echo prevention)
        if (isAssistantSpeakingRef.current) {
          console.log(`[VapiAssistant ${instanceId}] Ignoring transcript while assistant is speaking`);
          return;
        }

        // Dynamic echo prevention: check if we're within the echo guard window after speech ending
        // This prevents Vapi from listening to its own audio coming back through the mic
        const timeSinceSpeechEnd = Date.now() - lastSpeechEndTimeRef.current;
        const currentEchoGuard = echoGuardDurationRef.current;
        if (timeSinceSpeechEnd < currentEchoGuard && lastSpeechEndTimeRef.current > 0) {
          console.log(`[VapiAssistant ${instanceId}] Ignoring transcript ${timeSinceSpeechEnd}ms after speech (echo guard: ${currentEchoGuard}ms)`);
          return;
        }

        // Ignore very short transcripts that might be audio artifacts
        if (!transcriptText || transcriptText.length < 3) {
          console.log(`[VapiAssistant ${instanceId}] Ignoring short transcript (length: ${transcriptText?.length || 0})`);
          return;
        }

        // Pass the transcript to our client-side Gemini logic
        await processVoiceCommandRef.current(transcriptText);
      }
    });

    if (ASSISTANT_ID) {
      // Auto-start on initial mount
      if (isInitialMountRef.current) {
        console.log(`[VapiAssistant ${instanceId}] Auto-starting session with ID: ${ASSISTANT_ID.slice(0, 8)}...`);
        wasActiveRef.current = true; // Set this BEFORE starting so reconnection works
        setTimeout(() => {
          vapi.start(ASSISTANT_ID).catch((error: any) => {
            console.error(`[VapiAssistant ${instanceId}] Failed to auto-start Vapi:`, error);
            setIsSessionActive(false);

            // Explicitly trigger reconnection since initial start failed
            if (wasActiveRef.current) {
              console.log(`[VapiAssistant ${instanceId}] Auto-start failed, scheduling fast retry...`);

              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
              }

              reconnectTimeoutRef.current = setTimeout(() => {
                if (ASSISTANT_ID && vapiRef.current && wasActiveRef.current) {
                  console.log(`[VapiAssistant ${instanceId}] Retrying initial connection...`);
                  vapiRef.current.start(ASSISTANT_ID).catch((e: any) => {
                    console.error(`[VapiAssistant ${instanceId}] Initial retry failed:`, e);
                    // The error listener should pick up subsequent failures, 
                    // or the user can manually toggle. 
                    // We rely on the error listener for the loop mostly.
                  });
                }
              }, 1500);
            }
          });
        }, 100);
      }

      // Mark initial mount as complete
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
      }
    }

    return () => {
      console.log(`[VapiAssistant ${instanceId}] CLEANUP`);

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
  }, []); // Empty dependency array - no language changes

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
      wasActiveRef.current = false;
      vapi.stop();
    } else {
      // Reset reconnect attempts when manually starting
      reconnectAttemptsRef.current = 0;
      wasActiveRef.current = true;

      if (!ASSISTANT_ID) {
        console.error("No Assistant ID found");
        return;
      }
      // Start WITHOUT tool definitions, just plain Vapi for STT
      vapi.start(ASSISTANT_ID).catch((err: any) => {
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
        ID: ...{ASSISTANT_ID?.slice(-4) || 'None'}
      </div>
    </div>
  );
};

export const VapiAssistant = React.memo(VapiAssistantComponent);
