import { useState, useCallback, useRef } from "react";
import { useUserInfo } from "@/hooks/useUserInfo";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prompts } from "@/lib/prompts";

export type CheckoutStep =
    | "idle"
    | "name"
    | "email"
    | "address"
    | "phone"
    | "cardName"
    | "cardNumber"
    | "expiryDate"
    | "cvv"
    | "confirm"
    | "complete";

const STEP_ORDER: CheckoutStep[] = [
    "name",
    "email",
    "address",
    "phone",
    "cardName",
    "cardNumber",
    "expiryDate",
    "cvv",
    "confirm"
];

const STEP_PROMPTS: Record<CheckoutStep, string> = {
    idle: "",
    name: "Let's complete your order. What is your full name?",
    email: "Great! What is your email address?",
    address: "What is your shipping address?",
    phone: "What is your phone number?",
    cardName: "Now for payment details. What name is on your card?",
    cardNumber: "What is your card number?",
    expiryDate: "What is the expiry date? Please say it as month and year.",
    cvv: "What is the CVV or security code on the back of your card?",
    confirm: "I have all your details. Would you like me to place the order?",
    complete: "Your order has been placed successfully!"
};

// Map checkout steps to field types for Gemini prompt
const STEP_TO_FIELD_TYPE: Record<CheckoutStep, string> = {
    idle: "",
    name: "NAME",
    email: "EMAIL",
    address: "ADDRESS",
    phone: "PHONE",
    cardName: "CARD_NAME",
    cardNumber: "CARD_NUMBER",
    expiryDate: "EXPIRY_DATE",
    cvv: "CVV",
    confirm: "",
    complete: ""
};

// Initialize Gemini
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Extract JSON from Gemini response
const extractJson = (text: string): string => {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) return jsonMatch[0];
    return text.replace(/```json|```/g, "").trim();
};

// Simple fallback extraction for names when Gemini fails
const extractNameFallback = (transcript: string): string | null => {
    const lower = transcript.toLowerCase();
    
    // Remove common prefixes
    const cleaned = lower
        .replace(/^my name is\s+/i, '')
        .replace(/^i'm\s+/i, '')
        .replace(/^i am\s+/i, '')
        .replace(/^call me\s+/i, '')
        .replace(/^it's\s+/i, '')
        .replace(/^this is\s+/i, '')
        .replace(/^my name's\s+/i, '')
        .trim();
    
    // Basic validation - should have at least 2 words, mostly letters
    if (cleaned.length >= 2 && /^[a-zA-Z\s]+$/.test(cleaned)) {
        // Capitalize first letter of each word
        const nameWords = cleaned.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        
        console.log("[CheckoutFlow] Fallback name extraction:", nameWords);
        return nameWords;
    }
    
    return null;
};

// Call Gemini to extract field value with retry logic
const extractFieldWithGemini = async (transcript: string, fieldType: string): Promise<{ extracted: string | null; error: string | null }> => {
    if (!genAI) {
        console.error("[CheckoutFlow] Gemini API not initialized");
        return { extracted: null, error: "AI not available" };
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const prompt = prompts.checkoutFieldExtraction
                .replace("{fieldType}", fieldType)
                .replace("{transcript}", transcript);

            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            console.log("[CheckoutFlow] Gemini raw response:", responseText);

            const cleaned = extractJson(responseText);
            const parsed = JSON.parse(cleaned);

            return {
                extracted: parsed.extracted || null,
                error: parsed.error || null
            };
        } catch (error: any) {
            console.error(`[CheckoutFlow] Gemini extraction error (attempt ${attempt}/${maxRetries}):`, error);
            
            // Check if it's a rate limit error
            if (error.message?.includes('429') || error.message?.includes('Resource exhausted')) {
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`[CheckoutFlow] Rate limit hit, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            
            // For non-rate-limit errors or final attempt, return error
            if (attempt === maxRetries) {
                return { extracted: null, error: "Failed to process your response" };
            }
        }
    }
    
    return { extracted: null, error: "Failed to process your response" };
};

export const useCheckoutFlow = () => {
    const [currentStep, setCurrentStep] = useState<CheckoutStep>("idle");
    const [collectedData, setCollectedData] = useState<Record<string, string>>({});
    const { updateUserInfo } = useUserInfo();
    const isFlowActiveRef = useRef(false);
    const isProcessingRef = useRef(false);

    const startFlow = useCallback(() => {
        console.log("[CheckoutFlow] Starting guided checkout flow");
        
        // Reset all state to ensure clean start
        setCurrentStep("name");
        setCollectedData({});
        isFlowActiveRef.current = true;
        
        console.log("[CheckoutFlow] Flow started, current step: name");
        return STEP_PROMPTS["name"];
    }, []);

    const stopFlow = useCallback(() => {
        console.log("[CheckoutFlow] Stopping checkout flow");
        setCurrentStep("idle");
        isFlowActiveRef.current = false;
    }, []);

    const getCurrentPrompt = useCallback(() => {
        return STEP_PROMPTS[currentStep];
    }, [currentStep]);

    const getNextStep = (current: CheckoutStep): CheckoutStep => {
        const currentIndex = STEP_ORDER.indexOf(current);
        if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
            return "complete";
        }
        return STEP_ORDER[currentIndex + 1];
    };

    // Async version that uses Gemini for extraction
    const processAnswer = useCallback(async (transcript: string): Promise<{
        success: boolean;
        nextPrompt: string;
        shouldConfirmOrder?: boolean;
    }> => {
        console.log("[CheckoutFlow] Processing answer for step:", currentStep, "transcript:", transcript);

        // Prevent concurrent processing
        if (isProcessingRef.current) {
            console.log("[CheckoutFlow] Already processing, skipping");
            return { success: false, nextPrompt: "" };
        }

        if (currentStep === "idle") {
            console.log("[CheckoutFlow] Current step is idle, ignoring input");
            return { success: false, nextPrompt: "" };
        }

        isProcessingRef.current = true;

        try {
            // Handle confirmation step (no Gemini needed)
            if (currentStep === "confirm") {
                console.log("[CheckoutFlow] Processing confirmation step with transcript:", transcript);
                const lowerTranscript = transcript.toLowerCase();
                if (lowerTranscript.includes("yes") || lowerTranscript.includes("place") ||
                    lowerTranscript.includes("confirm") || lowerTranscript.includes("proceed") ||
                    lowerTranscript.includes("okay") || lowerTranscript.includes("sure")) {
                    setCurrentStep("complete");
                    isFlowActiveRef.current = false;
                    return {
                        success: true,
                        nextPrompt: STEP_PROMPTS["complete"],
                        shouldConfirmOrder: true
                    };
                } else if (lowerTranscript.includes("no") || lowerTranscript.includes("cancel")) {
                    stopFlow();
                    return { success: true, nextPrompt: "Order cancelled. Let me know if you need anything else." };
                }
                return { success: false, nextPrompt: "Please say yes to confirm or no to cancel." };
            }

            // Use Gemini to extract the field value
            const fieldType = STEP_TO_FIELD_TYPE[currentStep];
            console.log("[CheckoutFlow] Extracting field type:", fieldType, "from transcript:", transcript);

            const { extracted, error } = await extractFieldWithGemini(transcript, fieldType);

            console.log("[CheckoutFlow] Gemini extraction result:", { extracted, error, fieldType, currentStep });

            if (!extracted) {
                // Try fallback for name extraction if Gemini fails
                if (fieldType === 'NAME' && error?.includes('Could not extract NAME')) {
                    console.log("[CheckoutFlow] Gemini failed for name, trying fallback extraction");
                    const fallbackName = extractNameFallback(transcript);
                    if (fallbackName) {
                        return { success: false, nextPrompt: "", shouldConfirmOrder: false };
                    }
                }
                
                // Gemini couldn't extract value - check if it was due to rate limiting
                if (error?.includes('Failed to process your response')) {
                    // Provide a more specific retry message for rate limiting
                    const retryPrompt = `I'm having trouble processing your ${currentStep} due to high demand. Please try again in a moment.`;
                    return { success: false, nextPrompt: retryPrompt };
                } else {
                    // Regular extraction failure
                    const retryPrompt = error || `I couldn't understand your ${currentStep}. Could you please repeat it?`;
                    return { success: false, nextPrompt: retryPrompt };
                }
            }

            // Store the extracted data
            const newData = { ...collectedData, [currentStep]: extracted };
            setCollectedData(newData);
            console.log("[CheckoutFlow] Stored data for step", currentStep, ":", extracted);

            // Save to UserInfo context with proper field mapping
            const fieldMapping: Record<string, string> = {
                name: "name",
                email: "email", 
                address: "address",
                phone: "phone",
                cardName: "cardName",
                cardNumber: "cardNumber",
                expiryDate: "expiryDate",
                cvv: "cvv"
            };

            const userInfoField = fieldMapping[currentStep];
            if (userInfoField) {
                console.log("[CheckoutFlow] Updating userInfo field:", userInfoField, "with value:", extracted);
                updateUserInfo({ [userInfoField]: extracted });

                // Dispatch event to update payment page form
                window.dispatchEvent(new CustomEvent("userInfoUpdated", {
                    detail: {
                        message: `${currentStep} updated`,
                        updatedFields: [userInfoField]
                    }
                }));
            } else {
                console.error("[CheckoutFlow] No field mapping found for step:", currentStep);
            }

            // Move to next step
            const nextStep = getNextStep(currentStep);
            console.log("[CheckoutFlow] Moving from step", currentStep, "to step", nextStep);
            setCurrentStep(nextStep);

            if (nextStep === "complete") {
                isFlowActiveRef.current = false;
                console.log("[CheckoutFlow] Checkout flow completed");
            }

            const nextPrompt = STEP_PROMPTS[nextStep];
            console.log("[CheckoutFlow] Moving to next step:", nextStep, "prompt:", nextPrompt);

            return { success: true, nextPrompt };
        } finally {
            isProcessingRef.current = false;
        }
    }, [currentStep, collectedData, updateUserInfo, stopFlow]);

    return {
        currentStep,
        isFlowActive: isFlowActiveRef.current || currentStep !== "idle",
        collectedData,
        startFlow,
        stopFlow,
        getCurrentPrompt,
        processAnswer
    };
};
