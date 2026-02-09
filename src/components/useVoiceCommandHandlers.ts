import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prompts } from "@/lib/prompts";
import { useFilters } from "@/context/FilterContext";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useCart } from "@/context/CartContext";
import { useNavigationHandler } from "@/hooks/voice-intents/useNavigationHandler";
import { useProductHandler } from "@/hooks/voice-intents/useProductHandler";
import { useFilterHandler } from "@/hooks/voice-intents/useFilterHandler";
import { useCheckoutFlow } from "@/hooks/useCheckoutFlow";

// Initializing Gemini
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!geminiApiKey) {
    console.error("Missing VITE_GEMINI_API_KEY. Set it in your .env.local file.");
}
const genAI = new GoogleGenerativeAI(geminiApiKey ?? "");

// Optimized for speed - use flash model only
const GEMINI_MODELS = ["gemini-2.5-flash"];

const callGeminiWithFallback = async <T,>(
    action: (model: ReturnType<typeof genAI.getGenerativeModel>) => Promise<T>
): Promise<T> => {
    let lastError: any = null;

    for (const modelName of GEMINI_MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            return await action(model);
        } catch (error: any) {
            lastError = error;
            console.warn(`Gemini model ${modelName} failed.`, error);
            if (modelName === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw error;
        }
    }
    throw lastError;
};

const runGeminiText = async (prompt: string): Promise<string> => {
    const responseText = await callGeminiWithFallback(async (model) => {
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
    return responseText;
};

const extractJson = (text: string): string => {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) return jsonMatch[0];
    return text.replace(/```json|```/g, "").trim();
};

interface UseVoiceCommandHandlersProps {
    onRequestRestart?: () => void;
}

export const useVoiceCommandHandlers = ({ onRequestRestart }: UseVoiceCommandHandlersProps = {}) => {
    const { updateUserInfo, getUserInfo } = useUserInfo();
    const { clearFilters } = useFilters();
    const { triggerCheckout } = useCart();
    const navigate = useNavigate();

    const [lastAction, setLastAction] = useState<string>("");
    const [actionLog, setActionLog] = useState<
        Array<{ timestamp: number; action: string; success: boolean }>
    >([]);

    const logAction = (action: string, success: boolean = true) => {
        console.log(`Voice Action [${success ? "SUCCESS" : "FAILURE"}]: ${action}`);
        setActionLog((prevLog) => [
            { timestamp: Date.now(), action, success },
            ...prevLog.slice(0, 19),
        ]);
        setLastAction(action);
    };

    // Import modular handlers
    const navigationHandler = useNavigationHandler({ runGeminiText, extractJson, logAction });
    const productHandler = useProductHandler({ runGeminiText, extractJson, logAction });
    const filterHandler = useFilterHandler({ runGeminiText, extractJson, logAction });

    // Checkout flow for guided payment collection
    const checkoutFlow = useCheckoutFlow();
    const speakCallbackRef = useRef<((text: string) => void) | null>(null);

    // Register speak callback for guided flow
    const registerSpeakCallback = useCallback((callback: (text: string) => void) => {
        speakCallbackRef.current = callback;
    }, []);

    const speak = useCallback((text: string) => {
        if (speakCallbackRef.current) {
            speakCallbackRef.current(text);
        }
        logAction(text);
    }, [logAction]);

    // --- Intent Handlers ---

    const classifyPrimaryIntent = async (transcript: string): Promise<string> => {
        // Manual overrides for critical path commands to ensure reliability
        const lower = transcript.toLowerCase();
        if (lower.includes("checkout") ||
            lower.includes("place order") ||
            lower.includes("complete purchase") ||
            lower.includes("buy now")
        ) {
            return "order_completion";
        }

        try {
            const prompt = prompts.masterIntentClassifier.replace("{transcript}", transcript);
            const intent = (await runGeminiText(prompt)).trim();
            return intent;
        } catch (error) {
            console.error("Intent classification error:", error);
            return "general_command";
        }
    };

    const handleUserInfoUpdate = async (transcript: string) => {
        try {
            const prompt = prompts.userInfoUpdate.replace("{transcript}", transcript);
            const responseText = await runGeminiText(prompt);
            const cleaned = extractJson(responseText);
            const response = JSON.parse(cleaned);

            if (response.isUserInfoUpdate) {
                const currentInfo = getUserInfo();
                const updatedInfo = { ...currentInfo, ...response };
                // Filter nulls
                Object.keys(updatedInfo).forEach(key => {
                    if (updatedInfo[key as keyof typeof updatedInfo] === null) delete updatedInfo[key as keyof typeof updatedInfo];
                });

                updateUserInfo(updatedInfo);
                logAction("User info updated");
                return true;
            }
            return false;
        } catch (error) {
            console.error("User info update error:", error);
            return false;
        }
    };

    const handleOrderCompletion = async (transcript: string) => {
        try {
            // Manual check for speed and reliability
            const lower = transcript.toLowerCase();
            if (lower.includes("checkout") ||
                lower.includes("place order") ||
                lower.includes("pay") ||
                lower.includes("buy")
            ) {
                if (window.location.pathname === "/payment") {
                    triggerCheckout();
                    logAction("Submitting order");
                } else {
                    await navigate("/payment");
                    logAction("Proceeding to payment");
                }
                return true;
            }

            const prompt = prompts.orderCompletion.replace("{transcript}", transcript);
            const response = (await runGeminiText(prompt)).trim().toLowerCase();

            if (response === "yes") {
                if (window.location.pathname === "/payment") {
                    triggerCheckout();
                    logAction("Submitting order");
                } else {
                    await navigate("/payment");
                    logAction("Proceeding to payment");
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("Order complete error:", error);
            return false;
        }
    };

    const processVoiceCommand = async (transcript: string) => {
        console.log("%c[Voice Debug] Processing command:", "color: blue; font-weight: bold", transcript);

        // Ignore very short transcripts (noise/false positives)
        if (!transcript || transcript.length < 5) {
            console.log("[Voice Debug] Transcript too short, ignoring.");
            return;
        }

        // If checkout flow is active, route to it first
        if (checkoutFlow.isFlowActive) {
            console.log("[Voice Debug] Checkout flow active, processing answer");
            const result = checkoutFlow.processAnswer(transcript);

            if (result.nextPrompt) {
                speak(result.nextPrompt);
            }

            if (result.shouldConfirmOrder) {
                // Trigger the actual order completion
                triggerCheckout();
            }
            return;
        }

        logAction(`Processing: "${transcript}"`);

        try {
            const primaryIntent = await classifyPrimaryIntent(transcript);
            console.log("%c[Voice Debug] Primary Intent:", "color: green", primaryIntent);
            logAction(`Intent: ${primaryIntent}`);

            let handled = false;

            switch (primaryIntent) {
                case "navigation":
                    handled = await navigationHandler.handleNavigationCommand(transcript);
                    break;
                case "cart":
                    handled = await navigationHandler.handleCartNavigation(transcript);
                    break;
                case "category_navigation":
                    handled = await navigationHandler.handleCategoryNavigation(transcript);
                    break;
                case "product_navigation":
                    handled = await navigationHandler.handleProductDetailNavigation(transcript);
                    break;
                case "product_action":
                    console.log("[Voice Debug] Handling product action...");
                    handled = await productHandler.handleProductActions(transcript);
                    break;
                case "apply_filter":
                    handled = await filterHandler.interpretFilterCommand(transcript);
                    break;
                case "remove_filter":
                    handled = await filterHandler.handleRemoveFilters(transcript);
                    break;
                case "clear_filters":
                    handled = filterHandler.handleClearFilters();
                    break;
                case "user_info":
                    handled = await handleUserInfoUpdate(transcript);
                    break;
                case "order_completion":
                    handled = await handleOrderCompletion(transcript);
                    break;
                default:
                    // Fallback try common ones
                    console.log("[Voice Debug] Intent fell through, trying fallback navigation/cart");
                    handled = await navigationHandler.handleNavigationCommand(transcript) ||
                        await navigationHandler.handleCartNavigation(transcript);
            }

            console.log(`%c[Voice Debug] Command handled: ${handled}`, handled ? "color: green" : "color: red");

            if (!handled) {
                logAction("Command not recognized");
            }

        } catch (error) {
            console.error("[Voice Debug] Error processing voice command:", error);
            logAction("Error processing command", false);
        }
    };

    // Kept for compatibility
    const executeTool = async (toolName: string, args: any) => {
        return "Legacy tool execution";
    };

    return {
        logAction,
        lastAction,
        actionLog,
        setLastAction,
        processVoiceCommand,
        executeTool,
        // Checkout flow controls
        checkoutFlow,
        startCheckoutFlow: checkoutFlow.startFlow,
        registerSpeakCallback,
        speak
    };
};
